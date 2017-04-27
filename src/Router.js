const debug = require('debug')('socketcluster-api:Router');
const dispatcher = require('./dispatcher');

class Router {
  constructor() {
    this._routes = [];
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

  register(scSocket, absolutePath = '') {
    this.traverse((fullPath, handler) => {
      debug(`Registering an event listener on path '%s'`, fullPath);
      scSocket.on(fullPath, dispatcher.bind(null, scSocket, fullPath, handler));
    });
  }

  get describe() {
    const api = [];
    this.traverse((fullPath, handler) => {
      api.push({
        path: fullPath,
        description: handler.description || 'No description.',
        props: handler.props
      });
    });

    return api;
  }
}

module.exports = Router;
