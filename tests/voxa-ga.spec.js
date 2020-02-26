"use strict";

const chai = require("chai");
const simple = require("simple-mock");
const _ = require("lodash");
const { AlexaPlatform, VoxaApp } = require("voxa");

const { expect } = chai;
const voxaGA = require("../lib/voxa-ga");

const alexaEvent = {
  user: {
    userId: "blah"
  },
  session: {
    user: {
      userId: "blah"
    }
  },
  request: {
    type: "IntentRequest",
    locale: "en-us",
    intent: {
      name: "BlahIntent",
      slots: {
        SlotA: {
          name: "SlotA",
          value: 10
        },
        SlotB: {
          name: "SlotB",
          value: 11
        },
        SlotC: {
          name: "SlotC",
          value: "a"
        }
      }
    }
  }
};

describe("voxa-ga.spec.js", () => {
  let skill;
  let alexaPlatform;
  let rider;
  let sentFn;
  beforeEach(() => {
    skill = new VoxaApp({
      views: {}
    });
    alexaPlatform = new AlexaPlatform(skill);

    skill.onIntentRequest(event => {
      rider = event.ga;

      sentFn = simple.mock(rider.visitor, "send").callbackWith(null, "sent");
    });

    skill.onIntent("BlahIntent", () => ({
      to: "die"
    }));
  });

  afterEach(() => {
    simple.restore();
  });

  it("logs slot values", () => {
    voxaGA(skill, {
      trackingId: "blah",
      suppressSending: true
    });

    return alexaPlatform.execute(alexaEvent, {}).then(() => {
      const queue = rider.visitor._queue;
      expect(
        _.find(queue, {
          t: "event",
          ec: "Params",
          ea: "SlotA",
          el: 10,
          ev: 10
        })
      ).to.exist;
      expect(
        _.find(queue, {
          t: "event",
          ec: "Params",
          ea: "SlotB",
          el: 11,
          ev: 11
        })
      ).to.exist;
      expect(
        _.find(queue, {
          t: "event",
          ec: "Params",
          ea: "SlotC",
          el: "a"
        })
      ).to.exist;
    });
  });

  it("grab platform specificKey", () => {
    voxaGA(skill, {
      alexa: "blah",
      suppressSending: false
    });

    return alexaPlatform.execute(alexaEvent, {}).then(() => {
      const queue = rider.visitor._queue;
      expect(queue).to.have.lengthOf(7);
      expect(sentFn.callCount).to.be.equal(1);
    });
  });

  it("does not log health check events", () => {
    const healthCheckEvent = _.cloneDeep(alexaEvent);
    _.set(healthCheckEvent, "request.intent.slots.is_health_check", {
      name: "is_health_check",
      value: true
    });
    voxaGA(skill, {
      trackingId: "blah",
      suppressSending: false
    });

    return alexaPlatform.execute(healthCheckEvent, {}).then(() => {
      expect(sentFn.callCount).to.be.equal(0);
    });
  });

  it("does not log suppressed slots", () => {
    voxaGA(skill, {
      trackingId: "blah",
      suppressSending: true,
      suppressSlots: ["SlotB"]
    });

    return alexaPlatform.execute(alexaEvent, {}).then(() => {
      const queue = rider.visitor._queue;
      expect(
        _.find(queue, {
          t: "event",
          ec: "Params",
          ea: "SlotA",
          el: 10,
          ev: 10
        })
      ).to.exist;
      expect(
        _.find(queue, {
          t: "event",
          ec: "Params",
          ea: "SlotB"
        })
      ).to.not.exist;
    });
  });
});
