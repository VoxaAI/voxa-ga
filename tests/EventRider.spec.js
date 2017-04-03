'use strict';

const chai = require('chai');

const simple = require('simple-mock');

const expect = chai.expect;
const EventRider = require('../lib/EventRider');
const universalAnalytics = require('universal-analytics');

describe('EventRider.spec.js', () => {

  describe('time',() => {

    beforeEach(function(){
    })

    afterEach(function(){
      simple.restore();
    })

    it('times with a category and variable',done => {
      let sut = new EventRider(alexaEvent,{});
      simple.mock(sut.visitor,'timing');
      sut.time('a','b');
      setTimeout(function(){
        sut.timeEnd('a','b')
        try{
          expect(sut.visitor.timing.called).to.be.true;
          expect(sut.visitor.timing.lastCall.args[2]).to.within(60,80)
          done();
        }
        catch(e){
          done(e);
        }
      },65)
    })

    it('times with just a cat',done => {
      let sut = new EventRider(alexaEvent,{});
      simple.mock(sut.visitor,'timing');
      sut.time('a');
      setTimeout(function(){
        sut.timeEnd('a')
        try{
          expect(sut.visitor.timing.called).to.be.true;
          expect(sut.visitor.timing.lastCall.args[2]).to.within(60,80)
          done();
        }
        catch(e){
          done(e);
        }
      },65)
    })

    it('does nothing if there is no timer',() => {
      let sut = new EventRider(alexaEvent,{});
      simple.mock(sut.visitor,'timing');
      sut.timeEnd('a');
      expect(sut.visitor.timing.called).to.be.false;
    })

    it('can remove a timer',() => {
      let sut = new EventRider(alexaEvent,{});
      simple.mock(sut.visitor,'timing');
      sut.time('a');
      sut.timeRemove('a');
      sut.timeEnd('a');
      expect(sut.visitor.timing.called).to.be.false;
    })

  });
});

const alexaEvent = {
  user: { userId: 'blah' },
  request: {locale: 'en-us'}
}
