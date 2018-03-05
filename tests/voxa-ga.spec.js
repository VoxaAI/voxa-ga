'use strict';

const chai = require('chai');
const simple = require('simple-mock');
const _ = require('lodash');
const universalAnalytics = require('universal-analytics');
const Voxa = require('voxa');

const expect = chai.expect;
const voxaGA = require('../lib/voxa-ga');

const alexaEvent = {
  user: { userId: 'blah' },
  session: {
    user: { userId: 'blah' },
  },
  request: {
    type: 'IntentRequest',
    locale: 'en-us',
    intent: {
      name: 'BlahIntent',
      slots: {
        "SlotA": { name: 'SlotA', value: 10 },
        "SlotB": { name: 'SlotB', value: 11 },
        "SlotC": { name: 'SlotC', value: 'a' }
      }
    }
  }
};

describe('voxa-ga.spec.js', () => {
  afterEach(function(){ simple.restore(); })

  it('logs slot values', () => {
    let skill = new Voxa({views: {} });
    let rider = null
    voxaGA(skill, {trackingId: 'blah', suppressSending: true});
    skill.onIntentRequest(event => {
      rider = event.ga;
    })
    return skill.execute(alexaEvent, {}).then(response => {
      let queue = rider.visitor._queue;
      expect(_.find(queue,{t:'event',ec:'Slots',ea:'SlotA',el: 10, ev: 10})).to.exist;
      expect(_.find(queue,{t:'event',ec:'Slots',ea:'SlotB',el: 11, ev: 11})).to.exist;
      expect(_.find(queue,{t:'event',ec:'Slots',ea:'SlotC',el: 'a'})).to.exist;
    })
  })

  it('does not log suppressed slots', () => {
    let skill = new Voxa({views: {} });
    let rider = null
    voxaGA(skill, {
      trackingId: 'blah',
      suppressSending: true,
      suppressSlots: ['SlotB'],
    });
    skill.onIntentRequest(event => {
      rider = event.ga;
    })
    return skill.execute(alexaEvent, {}).then(response => {
      let queue = rider.visitor._queue;
      expect(_.find(queue,{t:'event',ec:'Slots',ea:'SlotA',el: 10, ev: 10})).to.exist;
      expect(_.find(queue,{t:'event',ec:'Slots',ea:'SlotB'})).to.not.exist;
    })
  })

});

