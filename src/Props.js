const debug = require('debug')('socketcluster-api:Props');

class PropsError extends Error {}

function checkProps(definition, props) {
    Object.keys(definition).forEach(propName => {
      definition[propName](propName, props[propName]);
    });
}

function checkType(required, type, propName, value) {
  debug(`verifying %o of type %o with value: %o (required: %o)`, propName, type, value, required);
  if (undefined !== value) {
    if (typeof value !== type) {
      debug('checkType failed because of invalid type');
      throw new PropsError(`${value} is not of type ${type}`);
    }
  } else if (required) {
    debug('checkType failed because of missing value');
    throw new PropsError(`required param '${propName}' missing value`);
  }
}

const string = checkType.bind(null, false, 'string');
string.isRequired = checkType.bind(null, true, 'string');

const number = checkType.bind(null, false, 'number');
number.isRequired = checkType.bind(null, true, 'number');

module.exports = {
  PropsError,
  checkProps,
  string,
  number
};
