## socketcluster-api

SocketCluster-API is a module for creating REST api's over
[SocketCluster](http://socketcluster.io/)'s websocket implementation.

If you're familiar with [expressjs](https://expressjs.com/) using `socketcluster-api`
will include many familiar steps

## Getting started

Very rough tutorial right now. Better docs coming soon.

### Basic

```javascript
const { Router } = require('socketcluster-api');
const router = new Router();

// `data` is provided by the client
// `callback` if the client expects a response
router.use('/resource', (data, callback) => {
  // Perform operations
  callback('important result');
});

// SocketCluster's workerController
function workerController(worker) {
  scServer.on('connection', (scSocket) => {
    router.register(scSocket);
  });
}
```

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

The nesting support makes it easy to structure your project.

## Client

```javascript
scSocket.emit('/resource/something', { key: value }, (stuff) => {
  // `stuff` is what value is provided to the `callback` function on server
});
```
