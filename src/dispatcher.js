const debug = require('debug')('socketcluster-api:dispatcher');
const { checkProps, PropsError } = require ('./Props');

function dispatcher(scSocket, fullPath, handler, data, callback) {
  if (handler.props) {
    try {
      checkProps(handler.props, data);
    } catch (err) {
      if (err instanceof PropsError) {
        // User induced error
        callback(err);
      } else {
        // Something unexpected
        callback(new Error('Internal server error'));
      }

      return;
    }
  }

  handler.call(scSocket, data, callback);
}

module.exports = dispatcher;