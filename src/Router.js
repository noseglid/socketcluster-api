const debug = require('debug')('socketcluster-api:Router');
const { serialize, deserialize } = require('./protobufCodec');

const NotFound = Symbol('404 NOT FOUND');

class Router {
  constructor(pbRoot) {
    this._routes = [];
    this._pbRoot = pbRoot;
  }

  _verifyMethod(method) {
    const allowedMethods = [ 'get', 'post', 'put', 'delete' ];
    if (!allowedMethods.includes(method)) {
      throw new Error(`Invalid method. Allowed methods are: ${allowedMethods.join(',')}`);
    }
  }

  get(path, handler) {
    return this.use('get', path, handler);
  }

  post(path, handler) {
    return this.use('post', path, handler);
  }

  put(path, handler) {
    return this.use('put', path, handler);
  }

  delete(path, handler) {
    return this.use('delete', path, handler);
  }

  use(method, path, handler) {
    this._verifyMethod(method);

    if (typeof path === 'function') {
      handler = path;
      path = '/';
    }

    if (typeof handler !== 'function' && !(handler instanceof Router)) {
      throw new Error('A handler (a function or a Router) must be passed to `use`.');
    }

    if (path[0] !== '/') {
      path = '/' + path;
    }

    const parts = path.split('/').slice(1); // First element is empty (as path always start with '/').

    let nextHandler = handler;
    if (parts.length > 1) {
      // This path contains multiple folders. Build `Router`s appropriately
      nextHandler = new Router(this._pbRoot).use(method, parts.slice(1).join('/'), handler);
    }

    this._routes.push([ method, `/${parts[0]}`, nextHandler ]);
    return this;
  }

  traverse(callback, absolutePath = '') {
    this._routes.forEach(([ method, path, handler ]) => {
      const fullPath = `${absolutePath}${path}`;

      if (handler instanceof Router) {
        handler.traverse(callback, fullPath);
      } else {
        callback(method, fullPath, handler);
      }
    });
  }

  _find(searchMethod, searchRoute) {
    let resolved = false;
    return new Promise((resolve, reject) => {
      this.traverse((method, fullPath, handler) => {
        if (!resolved && searchMethod === method && fullPath === searchRoute) {
          resolved = true;
          resolve(handler);
        }
      });

      if (!resolved) {
        reject(NotFound);
      }
    });
  }

  register(scSocket) {
    scSocket.on('#api', this._handleEvent.bind(this));
  }

  _handleEvent(data, callback) {
    let plain = {};
    if (data.dataType) {
      plain = deserialize(this._pbRoot.lookupType(data.dataType), data.buffer);
    }

    return this._find(data.method, data.resource)
      .then(handler => handler(plain))
      .then(({ dataType, responseData } = {}) => {
        let buffer;
        if (dataType) {
          buffer = serialize(this._pbRoot.lookupType(dataType), responseData);
        }

        callback(null, { dataType, buffer, isError: false });
      })
      .catch(err => {
        const dataType = '.socketclusterapi.ApiError';
        if (err === NotFound) {
          debug("No route for %o", data.resource);
          const buffer = serialize(this._pbRoot.lookupType(dataType), {
            code: 404,
            reason: 'Not Found',
            description: `Requested resource '${data.method} ${data.resource}' has no handler defined.`
          });
          callback(null, { dataType, buffer, isError: true });
        } else if ( err.dataType && typeof err.datType === 'string' && err.data) {
          const [ dataType, data ] = err;
          const buffer = serialize(this._pbRoot.lookupType(dataType), data);
          callback(null, { dataType: dataType, buffer, isError: true });
        } else {
          debug("Handler threw unexpectedly: %O", err);
          const buffer = serialize(this._pbRoot.lookupType(dataType), {
            code: 500,
            reason: 'Internal Server Error',
            description: `The resource threw an unexpected error.`
          });
          callback(null, { dataType, buffer, isError: true });
        }
      });
  }
}

module.exports = Router;
