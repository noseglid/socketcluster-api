const expect = require('expect.js');
const Router = require('../src/Router');
const MockSocket = require('./MockSocket');

function expectPaths(mockSocket, ...paths) {
  expect(mockSocket.listenerLength).to.be(paths.length);
  paths.forEach(path => expect(mockSocket.getByPath(path).handler).to.be.a('function'));
}

describe('Router', () => {
  describe('#use', () => {
    // Most of this functionality is tested in '#register', to avoid white-boxing too much
    it('should return a reference to itself so calls can be chained', () => {
      const router = new Router();
      const returnedRouter = router.use('something', () => {});
      expect(returnedRouter).to.be(router);
    });

    it('should throw an error if used without a handler', () => {
      expect(() => new Router().use()).to.throwException();
      expect(() => new Router().use('path')).to.throwException();
    });
  });

  describe('#register', () => {
    let router = null;
    let mockSocket = null;

    beforeEach(() => {
      router = new Router();
      mockSocket = new MockSocket();
    });

    it('should register a handler (no path specified)', () => {
      router.use(() => {});
      router.register(mockSocket);

      expectPaths(mockSocket, '/');
    });

    it('should register a handler (path specified)', () => {
      router.use('somePath', () => {});
      router.register(mockSocket);

      expectPaths(mockSocket, '/somePath');
    });

    it('should not matter if initial slash is provided', () => {
      router.use('resource', () => {});
      router.use('resource', new Router().use('deep', () => {}));
      router.register(mockSocket);
      expectPaths(mockSocket, '/resource', '/resource/deep');
    });

    it('should support routers as handlers', () => {
      const nestedRouter = new Router();
      nestedRouter.use(() => {});
      nestedRouter.use('path', () => {});

      router.use(() => {});
      router.use('nested', nestedRouter);
      router.register(mockSocket);

      expectPaths(mockSocket, '/', '/nested/', '/nested/path');
    });

    it('should allow deep nesting of routers', () => {
      const l1 = new Router().use(() => {});
      const l2 = new Router().use(() => {}).use('eve', () => {}).use('l1', l1);
      const l3 = new Router().use(() => {}).use('l2', l2);
      router.use(() => {}).use('l3', l3);
      router.register(mockSocket);

      expectPaths(mockSocket, '/', '/l3/', '/l3/l2/', '/l3/l2/eve', '/l3/l2/l1/');
    });

    it('should be possible to register a handler for deep path', () => {
      router.use('/a/b/c', () => {});
      router.register(mockSocket);
      expectPaths(mockSocket, '/a/b/c');
    });

    it('should be possible to mix route definitions freely', () => {
      router.use('/a/b/c', () => {});
      router.use(() => {});
      router.use('a', () => {});
      const nestedRouter = new Router().use(() => {}).use('d', () => {});
      router.use('/a', nestedRouter);
      router.register(mockSocket);

      expectPaths(mockSocket, '/a/b/c', '/', '/a', '/a/', '/a/d');
    });
  });
});
