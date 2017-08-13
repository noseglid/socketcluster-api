const expect = require('chai').expect;
const API = require('../src/API');

const request = async (router, method, resource) => {
  const callback = (nn, { isError, buffer }) => {
    if (isError) {
      throw new Error(buffer.toString('utf8'));
    }
  };

  await router._handleEvent({ method, resource }, callback);
};

describe('Router', () => {
  let api = null;
  let router = null;
  let handler = null;
  let called = null;

  beforeEach(() => {
    api = new API();
    router = api.router();
    called = false;
    handler = () => called = true;
  });

  describe('#use', () => {

    it('should throw if used with an unknown method', () => {
      expect(() => router.use('badmethod', 'path', () => {})).to.throw();
    });

    it('should throw an error if used without a handler', () => {
      expect(() => router.use('get', 'path')).to.throw();
    });

    it('should return a reference to itself so calls can be chained', () => {
      const returnedRouter = router.use('get', 'something', () => {});
      expect(returnedRouter).to.equal(router);
    });

    it('should register a handler (no path specified)', async () => {
      router.use('get', handler);
      await request(router, 'get', '/');
      expect(called).to.be.true;
    });

    it('should register a handler (path specified)', async () => {
      router.use('get', 'somePath', handler);
      await request(router, 'get', '/somePath');
      expect(called).to.be.true;
    });

    it('should not matter if initial slash is provided', async () => {
      router.use('get', 'resource', handler);
      let calledDeep = false;
      router.use('get', 'resource', api.router().use('get', 'deep', () => { calledDeep = true; }));

      await request(router, 'get', '/resource');
      expect(called).to.be.true;
      expect(calledDeep).to.be.false;

      await request(router, 'get', '/resource/deep');
      expect(called).to.be.true;
      expect(calledDeep).to.be.true;
    });

    it('should support routers as handlers', async () => {
      const nestedRouter = api.router();
      nestedRouter.use('get', 'path', handler);

      router.use('get', 'nested', nestedRouter);

      await request(router, 'get', '/nested/path');
      expect(called).to.be.true;
    });

    it('should allow deep nesting of routers', async () => {
      let called = false, calledl3 = false, calledl3l2 = false, calledl3l2eve = false, calledl3l2l1 = false;
      const l1 = api.router().use('get', () => { calledl3l2l1 = true; });
      const l2 = api.router().use('get', () => { calledl3l2 = true; }).use('get', 'eve', () => { calledl3l2eve = true; }).use('get', 'l1', l1);
      const l3 = api.router().use('get', () => { calledl3 = true; }).use('get', 'l2', l2);
      router.use('get', () => { called = true; }).use('get', 'l3', l3);

      await request(router, 'get', '/');
      expect(called).to.be.true;
      expect(calledl3).to.be.false;
      expect(calledl3l2).to.be.false;
      expect(calledl3l2eve).to.be.false;
      expect(calledl3l2l1).to.be.false;
      called = false;

      await request(router, 'get', '/l3/');
      expect(called).to.be.false;
      expect(calledl3).to.be.true;
      expect(calledl3l2).to.be.false;
      expect(calledl3l2eve).to.be.false;
      expect(calledl3l2l1).to.be.false;
      calledl3 = false;

      await request(router, 'get', '/l3/l2/');
      expect(called).to.be.false;
      expect(calledl3).to.be.false;
      expect(calledl3l2).to.be.true;
      expect(calledl3l2eve).to.be.false;
      expect(calledl3l2l1).to.be.false;
      calledl3l2 = false;

      await request(router, 'get', '/l3/l2/eve');
      expect(called).to.be.false;
      expect(calledl3).to.be.false;
      expect(calledl3l2).to.be.false;
      expect(calledl3l2eve).to.be.true;
      expect(calledl3l2l1).to.be.false;
      calledl3l2eve = false;

      await request(router, 'get', '/l3/l2/l1/');
      expect(called).to.be.false;
      expect(calledl3).to.be.false;
      expect(calledl3l2).to.be.false;
      expect(calledl3l2eve).to.be.false;
      expect(calledl3l2l1).to.be.true;
      calledl3l2l1 = false;
    });

    it('should be possible to register a handler for deep path', async () => {
      router.use('get', '/a/b/c', handler);
      await request(router, 'get', '/a/b/c');
      expect(called).to.be.true;
    });

    it('should be possible to mix route definitions freely', async () => {
      let calledAbc = false, called = false, calledA = false, calledASlash = false, calledAd = false;
      router.use('get', '/a/b/c', () => { calledAbc = true; });
      router.use('get', () => { called = true; });
      router.use('get', 'a', () => { calledA = true; });
      const nestedRouter = api.router().use('get', () => { calledASlash = true; }).use('get', 'd', () => { calledAd = true; });
      router.use('get', '/a', nestedRouter);

      await request(router, 'get', '/a/b/c');
      expect(calledAbc).to.be.true;

      await request(router, 'get', '/');
      expect(called).to.be.true;

      await request(router, 'get', '/a');
      expect(calledA).to.be.true;

      await request(router, 'get', '/a/');
      expect(calledASlash).to.be.true;

      await request(router, 'get', '/a/d');
      expect(calledAd).to.be.true;
    });
  });

  describe('#get', () => {

    it('should return a reference to itself so calls can be chained', () => {
      const returnedRouter = router.get('something', () => {});
      expect(returnedRouter).to.equal(router);
    });

    it('should register with the .get shorthand', async () => {
      router.get('/resource', handler);
      await request(router, 'get', '/resource');
      expect(called).to.be.true;
    });

    it('should not be possible to use any other method with a get endpoint', async () => {
      router.get('/resource', handler);

      try {
        await request(router, 'post', '/resource');
        expect().fail('Request should\'ve failed.');
      } catch (err) { /* expecting exception */ }

      try {
        await request(router, 'put', '/resource');
        expect().fail('Request should\'ve failed.');
      } catch (err) { /* expecting exception */ }

      try {
        await request(router, 'delete', '/resource');
        expect().fail('Request should\'ve failed.');
      } catch (err) { /* expecting exception */ }

      expect(called).to.be.false;
    });
  });

  describe('#post', () => {

    it('#post should return a reference to itself so calls can be chained', () => {
      const returnedRouter = router.post('something', () => {});
      expect(returnedRouter).to.equal(router);
    });

    it('should register with the .post shorthand', async () => {
      router.post('/resource', handler);
      await request(router, 'post', '/resource');
      expect(called).to.be.true;
    });

    it('should not be possible to use any other method with a post endpoint', async () => {
      router.post('/resource', handler);

      try {
        await request(router, 'get', '/resource');
        expect().fail('Request should\'ve failed.');
      } catch (err) { /* expecting exception */ }

      try {
        await request(router, 'put', '/resource');
        expect().fail('Request should\'ve failed.');
      } catch (err) { /* expecting exception */ }

      try {
        await request(router, 'delete', '/resource');
        expect().fail('Request should\'ve failed.');
      } catch (err) { /* expecting exception */ }

      expect(called).to.be.false;
    });
  });

  describe('#put', () => {

    it('#put should return a reference to itself so calls can be chained', () => {
      const returnedRouter = router.put('something', () => {});
      expect(returnedRouter).to.equal(router);
    });

    it('should register with the .put shorthand', async () => {
      router.put('/resource', handler);
      await request(router, 'put', '/resource');
      expect(called).to.be.true;
    });

    it('should not be possible to use any other method with a put endpoint', async () => {
      router.put('/resource', handler);

      try {
        await request(router, 'get', '/resource');
        expect().fail('Request should\'ve failed.');
      } catch (err) { /* expecting exception */ }

      try {
        await request(router, 'post', '/resource');
        expect().fail('Request should\'ve failed.');
      } catch (err) { /* expecting exception */ }

      try {
        await request(router, 'delete', '/resource');
        expect().fail('Request should\'ve failed.');
      } catch (err) { /* expecting exception */ }

      expect(called).to.be.false;
    });
  });

  describe('#delete', () => {

    it('#delete should return a reference to itself so calls can be chained', () => {
      const returnedRouter = router.delete('something', () => {});
      expect(returnedRouter).to.equal(router);
    });

    it('should register with the .delete shorthand', async () => {
      router.delete('/resource', handler);
      await request(router, 'delete', '/resource');
      expect(called).to.be.true;
    });

    it('should not be possible to use any other method with a delete endpoint', async () => {
      router.delete('/resource', handler);

      try {
        await request(router, 'get', '/resource');
        expect().fail('Request should\'ve failed.');
      } catch (err) { /* expecting exception */ }

      try {
        await request(router, 'post', '/resource');
        expect().fail('Request should\'ve failed.');
      } catch (err) { /* expecting exception */ }

      try {
        await request(router, 'put', '/resource');
        expect().fail('Request should\'ve failed.');
      } catch (err) { /* expecting exception */ }

      expect(called).to.be.false;
    });
  });
});
