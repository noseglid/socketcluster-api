const debug = require('debug')('socketcluster-api:Router');
const { serialize, deserialize } = require('./protobufCodec');

class Router {
  constructor(pbRoot) {
    this._routes = [];
    this._pbRoot = pbRoot;
  }

  use(path, handler) {
    if (typeof path === 'function') {
      // Passing function is first argument - default the path.
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
      nextHandler = new Router().use(parts.slice(1).join('/'), handler);
    }

    this._routes.push([ `/${parts[0]}`, nextHandler ]);
    return this;
  }

  traverse(callback, absolutePath = '') {
    this._routes.forEach(([ path, handler ]) => {
      const fullPath = `${absolutePath}${path}`;

      if (handler instanceof Router) {
        handler.traverse(callback, fullPath);
      } else {
        callback(fullPath, handler);
      }
    });
  }

  find(route) {
    let resolved = false;
    return new Promise((resolve, reject) => {
      this.traverse((fullPath, handler) => {
        if (!resolved && fullPath === route) {
          resolved = true;
          resolve(handler);
        }
      });

      if (!resolved) {
        reject();
      }
    });
  }

  register(scSocket, absolutePath = '') {
    scSocket.on('#api', this.handleEvent.bind(this));
  }

  handleEvent(data, callback) {
    const plain = deserialize(this._pbRoot.lookupType(data.dataType), data.buffer);

    this.find(data.resource)
      .then(handler => handler(plain, (err, response) => {
        if (err) {
          const [ dataType, data ] = err;
          const buffer = serialize(this._pbRoot.lookupType(dataType), data);
          callback(null, { dataType: dataType, buffer, isError: true });
        } else {
          const [ dataType, data ] = response;
          const buffer = serialize(this._pbRoot.lookupType(dataType), data);
          callback(null, { dataType, buffer, isError: false });
        }

      }))
      .catch(err => {
        debug("No route for %o", data.resource);
        const dataType = '.socketclusterapi.ApiError';
        const buffer = serialize(this._pbRoot.lookupType(dataType), {
          code: 404,
          reason: 'Not Found',
          description: `Requested route (${data.resource}) has no handler defined.`
        });
        callback(null, { dataType, buffer, isError: true });
      });
  }
}

module.exports = Router;
