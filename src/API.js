const debug = require('debug')('socketcluster-api:API');
const Codec = require('sc-codec-protobuf');
const Router = require('./Router');
const apiEvent = require('./Event.proto');
const { serialize, deserialize } = require('./protobufCodec');

const { defineProperty } = Object;

const request = (scSocket, method, pbRoot) => (resource, [ dataType, plain ]) => new Promise((resolve, reject) => {
  debug('request: %s %s', method, resource);
  const buffer = serialize(pbRoot.lookupType(dataType), plain);
  scSocket.emit('#api', { resource, method, dataType, buffer }, (err, data) => {
    debug('response: %o', data);
    if (err) {
      // This is *not* a socketclusterapi error. This is a lower level stack error.
      return reject(err);
    }

    const clientData = deserialize(pbRoot.lookupType(data.dataType), data.buffer);
    if (data.isError) {
      reject(clientData);
    } else {
      resolve(clientData);
    }
  });
});

class API {

  constructor(protobufs) {
    const { encode, decode, messageTypes, pbRoot } = Codec(...protobufs, apiEvent);
    messageTypes.addEvent('#api', '.socketclusterapi.ApiCall', '.socketclusterapi.ApiResponse');

    this._pbRoot = pbRoot;
    this._encode = encode;
    this._decode = decode;
  }

  defineEndpoints(scSocket) {
    defineProperty(scSocket, 'get', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: request(scSocket, 'get', this._pbRoot)
    });

    defineProperty(scSocket, 'post', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: request(scSocket, 'post', this._pbRoot)
    });

    defineProperty(scSocket, 'put', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: request(scSocket, 'put', this._pbRoot)
    });

    defineProperty(scSocket, 'delete', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: request(scSocket, 'delete', this._pbRoot)
    });
  }

  router() {
    return new Router(this._pbRoot);
  }

  get codec() {
    return ({ encode: this._encode, decode: this._decode });
  }
}

module.exports = API;