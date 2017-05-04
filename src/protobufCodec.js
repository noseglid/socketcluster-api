module.exports = {
  serialize: function (MessageType, plain) {
    const errMsg = MessageType.verify(plain);
    if (errMsg) {
      throw new Error(`Data object does not fit protobuf ${MessageType.name}`);
    }

    return MessageType.encode(MessageType.create(plain)).finish();
  },

  deserialize: function (MessageType, buffer) {
    return MessageType.decode(buffer).toObject();
  }
};
