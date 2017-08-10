const fs = require('fs');

const debug = require('debug')('socket-api');

if (process.versions && process.versions.node && process.env.NODE_ENV === 'development') {
  // In the built UMD module (production), webpack will inline the protobuf require below
  // so this will not be used.
  require.extensions['.proto'] = (module, filename) => {
    module.exports = fs.readFileSync(filename, 'utf8');
  };
}

module.exports = {
  API: require('./API'),
  Router: require('./Router')
};
