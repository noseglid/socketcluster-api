const expect = require('chai').expect;
const API = require('../src/API');
const Router = require('../src/Router');

describe('API', () => {

  describe('#constructor', () => {

    it('should be constructible', () => {
      expect(new API()).to.be.an.instanceof(API);
      expect(new API([])).to.be.an.instanceof(API);
    });

    it('should create routers', () => {
      const api = new API();
      expect(api.router()).to.be.an.instanceof(Router);
    });

  });

  describe('#defineEndpoints', () => {

    it('should define relevant endpoints', () => {
      const scSocket = {};

      const api = new API();
      api.defineEndpoints(scSocket);

      expect(scSocket).to.respondTo('get');
      expect(scSocket).to.respondTo('post');
      expect(scSocket).to.respondTo('put');
      expect(scSocket).to.respondTo('delete');
    });

  });
});
