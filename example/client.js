import createDebug from 'debug';
import socketCluster from 'socketcluster-client';
import { API } from '../src';
import protobuf from './messages.proto';

const api = new API([ protobuf ]);

const debug = createDebug('socketcluster-api:example:client');

const socket = socketCluster.connect({
  codecEngine: api.codec,
  port: 8000,
});

api.defineEndpoints(socket);

setTimeout(() => {
  socket.get('/resource/asdf', [ '.app.SomeMessage', { a: 'this is a', b: 'this is b' } ])
    .then((data) => debug('server replied %o', data))
    .catch((err) => debug('got an error:', err));
}, 1000);

