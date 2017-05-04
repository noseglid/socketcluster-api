const debug = require('debug')('socketcluster-api:API');
const Codec = require('sc-codec-protobuf');
const Router = require('./Router');
const apiEvent = require('./Event.proto');
const { serialize, deserialize } = require('./protobufCodec');

const { defineProperty } = Object;

class API {

  constructor(protobufs) {
    const { encode, decode, messageTypes, pbRoot } = Codec(...protobufs, apiEvent);
    messageTypes.addEvent('#api', '.socketclusterapi.ApiCall', '.socketclusterapi.ApiResponse');

    this._pbRoot = pbRoot;
    this._encode = encode;
    this._decode = decode;
  }

  defineEndpoints(scSocket) {
    const self = this;
    defineProperty(scSocket, 'get', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: function(resource, dataType, plain) {
        return new Promise((resolve, reject) => {
          const buffer = serialize(self._pbRoot.lookupType(dataType), plain);
          this.emit('#api', { resource, dataType, buffer}, (err, data) => {
            if (err) return reject(err);
            else return resolve(deserialize(self._pbRoot.lookupType(data.dataType), data.buffer));
          });
        });
      }
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