'use strict';

const chai = require('chai');
const simple = require('simple-mock');
const EventRider = require('../lib/EventRider');

const { expect } = chai;

describe('EventRider.spec.js', () => {
  describe('time', () => {
    beforeEach(() => {
    });

    afterEach(() => {
      simple.restore();
    });

    it('times with a category and variable', (done) => {
      const sut = new EventRider(alexaEvent, {});
      simple.mock(sut.visitor, 'timing');
      sut.time('a', 'b');
      setTimeout(() => {
        sut.timeEnd('a', 'b');
        try {
          expect(sut.visitor.timing.called).to.be.true;
          expect(sut.visitor.timing.lastCall.args[2]).to.within(60, 80);
          done();
        } catch (e) {
          done(e);
        }
      }, 65);
    });

    it('times with just a cat', (done) => {
      const sut = new EventRider(alexaEvent, {});
      simple.mock(sut.visitor, 'timing');
      sut.time('a');
      setTimeout(() => {
        sut.timeEnd('a');
        try {
          expect(sut.visitor.timing.called).to.be.true;
          expect(sut.visitor.timing.lastCall.args[2]).to.within(60, 80);
          done();
        } catch (e) {
          done(e);
        }
      }, 65);
    });

    it('does nothing if there is no timer', () => {
      const sut = new EventRider(alexaEvent, {});
      simple.mock(sut.visitor, 'timing');
      sut.timeEnd('a');
      expect(sut.visitor.timing.called).to.be.false;
    });

    it('can remove a timer', () => {
      const sut = new EventRider(alexaEvent, {});
      simple.mock(sut.visitor, 'timing');
      sut.time('a');
      sut.timeRemove('a');
      sut.timeEnd('a');
      expect(sut.visitor.timing.called).to.be.false;
    });

    it('can add geolocation', () => {
      const sut = new EventRider(alexaEvent, {});
      expect(sut.visitor._persistentParams.geoid).to.be.equal("US");
    });
  });
});

const alexaEvent = {
  user: { userId: 'blah' },
  request: { locale: 'en-us' },
  platform: { name: 'alexa' },
};
