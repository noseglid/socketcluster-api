const fs = require('fs');
const path = require('path');
const http = require('http');
const debug = require('debug')('socketcluster-api:example:server');
const socketClusterServer = require('socketcluster-server');
const { API } = require('../src');

const protobuf = fs.readFileSync(path.join(__dirname, 'messages.proto'), 'utf8');
const app = new API([ protobuf ]);

const router = app.router().use('/resource/asdf', (data, callback) => {
  debug('got call for /resource/asdf', data);
  callback(null, [ '.app.SomeResponse', { c: 'something dark' } ]);
});

const port = process.env.PORT || 8000;
const httpServer = http.createServer();
const scServer = socketClusterServer.attach(httpServer);
scServer.setCodecEngine(app.codec);
scServer.on('connection', (socket) => {
  debug('websocket connection received');
  router.register(socket);
});

httpServer.listen(port, '0.0.0.0', () => {
  debug('listening on %o', port);
});

