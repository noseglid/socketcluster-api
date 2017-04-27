const expect = require('expect.js');
const { checkProps, string, number } = require('../src/Props');

describe('Props', () => {

  describe('#checkProps', () => {

    describe('string', () => {

      it('correct', () => {
        expect(checkProps).withArgs({ str: string }, { str: 'some-string' }).not.to.throwException();
        expect(checkProps).withArgs({ str: string.isRequired }, { str: 'some-string' }).not.to.throwException();
      });

      it('missing', () => {
        expect(checkProps).withArgs({ str: string }, {}).to.not.throwException();
        expect(checkProps).withArgs({ str: string.isRequired }, {}).to.throwException();
      });

      it('invalid', () => {
        expect(checkProps).withArgs({ str: string }, { str: 12 }).to.throwException();
        expect(checkProps).withArgs({ str: string.isRequired }, { str: [] }).to.throwException();
      });
    });

    describe('number', () => {

      it('correct', () => {
        expect(checkProps).withArgs({ nbr: number }, { nbr: 12 }).not.to.throwException();
        expect(checkProps).withArgs({ nbr: number.isRequired }, { nbr: 256 }).not.to.throwException();
      });

      it('missing', () => {
        expect(checkProps).withArgs({ nbr: number }, {}).to.not.throwException();
        expect(checkProps).withArgs({ nbr: number.isRequired }, {}).to.throwException();
      });

      it('invalid', () => {
        expect(checkProps).withArgs({ nbr: number }, { nbr: 'somestring' }).to.throwException();
        expect(checkProps).withArgs({ nbr: number.isRequired }, { nbr: {} }).to.throwException();
      });
    });

  });

});