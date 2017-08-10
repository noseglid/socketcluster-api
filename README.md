## socketcluster-api

SocketCluster-API is a module for creating REST api's over
[SocketCluster](http://socketcluster.io/)'s websocket implementation.

If you're familiar with [expressjs](https://expressjs.com/) using `socketcluster-api`
will include many familiar steps

This is built using [`sc-codec-protobuf`](https://github.com/noseglid/sc-codec-protobuf) which will
encode all messages using [Google Protocol Buffer](https://developers.google.com/protocol-buffers/).

All messages are encoded to a protobuf, which also requires you to provided message definitions.

## Getting started

Using the following protobuf for the getting started
```protobuf
syntax = "proto3";

package app;

message RequestMessage {
  string a = 1;
  string b = 2;
}

message ResponseMessage {
  string c = 1;
}

message SomeError {
  uint32 code = 1;
  string message = 2;
}
```

### Server

```javascript
const protobuf = /* acquire protobuf as a string */
const { API } = require('socketcluster-api');
const app = new API([ protobuf ]
const router = app.router();

// `data` is provided by the client
router.use('/resource', async (data) => {
  // ... Perform operations
  return {
    dataType: '.app.ResponseMessage',
    data: { c : 'important result' }
  };

  // To indicate an error, you could instead throw an object
  throw {
    dataType: '.app.ResponseMessage',
    data: { c : 'important result' }
  };
});

// SocketCluster's workerController
function workerController(worker) {
  // Get the custom codecEngine so that protobuf message are properly encoded/decoded.
  scServer.setCodecEngine(app.codec);

  // Register the router for each client that connects
  scServer.on('connection', (scSocket) => {
    router.register(scSocket);
  });
}
```

## Client

```javascript
import protobuf from /* acquire protobuf as a string */;
import socketCluster from 'socketcluster-client';
import { API } from 'socketcluster-api';

const api = new API([ protobuf ]);

const socket = socketCluster.connect({
  codecEngine: api.codec,
  port: 8000,
});

// Makes `get` available as a function on `socket`
api.defineEndpoints(socket);

// Calls the `/resource` endpoint, with a message of type `.app.RequestMessage`.
// Note that the data must fit the `.app.RequestMessage` or an error will be thrown.
socket.get('/resource', [ '.app.RequestMessage', { a: 'this string', b: 'this string too' } ])
  .then((data) => debug('server replied %o', data))
  .catch((err) => debug('got an error:', err));

```

## Advanced topics - Server

### Nested routers
```javascript

const resourceRouter = new Router()
  .use(() => { /* handler */ })               // 1
  .use('something', () => { /* handler */ }); // 2

const router = new Router()
  .use('resource', () => { /* handler */ })   // 3
  .use('resource', resourceRouter);           // 4

// ...

// This will bind the following routes:
// 1. '/resource/'
// 2. '/resource/something'
// 3. '/resource
// 4. Doesn't bind anything since handler is a `Router`
router.register(scSocket);
```

**NB**. `/resource` and `/resource/` (trailing slash) are different routes and invokes different handlers

Routers can be nested to any depth.
