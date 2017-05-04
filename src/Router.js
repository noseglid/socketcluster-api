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
    return this._routes.find(([ path, handler ]) => path === route);
  }

  register(scSocket, absolutePath = '') {
    scSocket.on('#api', (data, callback) => {
      const plain = deserialize(this._pbRoot.lookupType(data.dataType), data.buffer);

      const [ , handler ] = this.find(data.resource);
      handler(plain, (dataType, data) => {
        const buffer = serialize(this._pbRoot.lookupType(dataType), data);
        callback(null, { dataType, buffer });
      });
    });
  }
}

module.exports = Router;
