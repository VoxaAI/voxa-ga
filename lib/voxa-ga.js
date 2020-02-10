"use strict";

const _ = require("lodash");
const detect = require("./detect");
const EventRider = require("./EventRider");

const defaultConfig = {
  ignoreUsers: [],
  debug: false,
  appName: detect.appName(),
  appVersion: detect.appVersion()
};

function register(skill, config) {

  const pluginConfig = _.merge({}, defaultConfig, config);

  skill.onRequestStarted((event) => {
    const platformName = _.get(event, 'platform.name');

    const trackingId = _.get(pluginConfig, platformName) || pluginConfig.trackingId;
    pluginConfig.trackingId = trackingId;

    if (!pluginConfig.trackingId) throw new Error('trackingId is required in the config file');

    event.ga = new EventRider(event, pluginConfig);
    event.ga.time('Interaction', 'Request');
  });

  skill.onSessionStarted(event => {
    event.ga.startSession();
  });

  skill.onSessionEnded(event => {
    event.ga.endSession();
    if (event.request.type === "SessionEndedRequest") {
      // If this is an external end, we cannot ride on the normal pageview, we have to make one
      event.ga.pushPath("SessionEndedExternally");
      event.ga.logPath(event);
      return send(event);
    }
  });

  skill.onIntentRequest(event => {
    const {
      ga
    } = event;
    ga.visitor.event("Intents", event.intent.name, undefined, undefined, {
      ni: 1
    });
    _.forEach(event.intent.params, (value, name) => {
      if (_.includes(config.suppressSlots, name)) return; // Suppressed slots don't log
      ga.visitor.event(
        "Params",
        name,
        value,
        _.isNaN(value) ? undefined : +value, {
          ni: 1
        }
      );
    });
  });

  skill.onBeforeStateChanged((event, reply, state) => {
    event.ga.from = state.name;
    event.ga.time("States", state.name);
  });

  skill.onAfterStateChanged((event, reply, transition) => {
    const {
      ga
    } = event;
    if (!ga.ignoreState) {
      ga.pushPath(transition.say);
      ga.visitor.event("States", ga.from, undefined, undefined, {
        ni: 1
      });
      event.ga.timeEnd("States", ga.from);
    } else {
      event.ga.timeRemove("States", ga.from);
    }
  });

  skill.onBeforeReplySent(event => {
    event.ga.logPath(event);
    event.ga.timeEnd("Interaction", "Request");
    return send(event);
  });

  if (_.has(skill, "onAlexaSkillEvent.SkillEnabled")) {
    skill["onAlexaSkillEvent.SkillEnabled"](defaultEventHandler);
  }

  if (_.has(skill, "onAlexaSkillEvent.SkillDisabled")) {
    skill["onAlexaSkillEvent.SkillDisabled"](defaultEventHandler);
  }

  if (_.has(skill, "onAlexaSkillEvent.SkillAccountLinked")) {
    skill["onAlexaSkillEvent.SkillAccountLinked"](defaultEventHandler);
  }

  function defaultEventHandler(event) {
    event.ga = new EventRider(event, pluginConfig);
    const eventData = event.request.type.split(".");
    const category = eventData[0];
    const action = eventData[1];
    event.ga.visitor.event(category, action);
    send(event);
  }

  if (_.has(skill, "onAlexaSkillEvent.SkillPermissionChanged")) {
    skill["onAlexaSkillEvent.SkillPermissionChanged"](permissionEventHandler);
  }

  if (_.has(skill, "onAlexaSkillEvent.SkillPermissionAccepted")) {
    skill["onAlexaSkillEvent.SkillPermissionAccepted"](permissionEventHandler);
  }

  function permissionEventHandler(event) {
    event.ga = new EventRider(event, pluginConfig);
    const eventData = event.request.type.split(".");
    const category = eventData[0];
    const action = eventData[1];
    event.request.body.acceptedPermissions.forEach(permissions => {
      const label = permissions.scope;
      event.ga.visitor.event(category, action, label);
    });
    send(event);
  }

  if (_.has(skill, "onAlexaHouseholdListEvent.ItemsCreated")) {
    skill["onAlexaHouseholdListEvent.ItemsCreated"](listEventHandler);
  }

  if (_.has(skill, "onAlexaHouseholdListEvent.ItemsUpdated")) {
    skill["onAlexaHouseholdListEvent.ItemsUpdated"](listEventHandler);
  }

  if (_.has(skill, "onAlexaHouseholdListEvent.ItemsDeleted")) {
    skill["onAlexaHouseholdListEvent.ItemsDeleted"](listEventHandler);
  }

  function listEventHandler(event) {
    event.ga = new EventRider(event, pluginConfig);
    const eventData = event.request.type.split(".");
    const category = eventData[0];
    const action = eventData[1];
    const {
      listId
    } = event.request.body;
    event.request.body.listItemIds.forEach(listItemId => {
      const label = `${listId} - ${listItemId}`;
      event.ga.visitor.event(category, action, label);
    });
    send(event);
  }

  function send(event) {
    if (_.includes(pluginConfig.ignoreUsers, event.user.userId))
      return Promise.resolve(null);
    if (config.suppressSending) return Promise.resolve(null);
    return new Promise(resolve => {
      event.ga.visitor.send((err, cnt) => {
        if (err) {
          console.error("Failed to send analytics");
          console.error(err.stack || err);
          return resolve(); // Analytics errors shouldn't tank the whole process
        }
        return resolve();
      });
    });
  }
}

module.exports = register;