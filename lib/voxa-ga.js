'use strict';

const _ = require('lodash');
const debug = require('debug')('voxa:opearlo');
const detect = require('./detect');
const EventRider = require('./EventRider');

const defaultConfig = {
  ignoreUsers: [],
  debug: false,
  appName: detect.appName(),
  appVersion: detect.appVersion()
};

function register(skill, config) {
  if (!config.trackingId) throw new Error('trackingId is required in the config file');
  const pluginConfig = _.merge({}, defaultConfig, config);

  skill.onRequestStarted((event) => {
    event.ga = new EventRider(event,pluginConfig);
    event.ga.time('Interaction','Request');
  });

  skill.onSessionStarted((event) => {
    event.ga.startSession();
  });

  skill.onSessionEnded(event => {
    event.ga.endSession();
    if (event.request.type === 'SessionEndedRequest') { // If this is an external end, we cannot ride on the normal pageview, we have to make one
      event.ga.pushPath('SessionEndedExternally');
      event.ga.logPath(event);
      return send(event);
    }
  });

  skill.onStateMachineError((event,reply,error) => {
    const ga = event.ga;
    if (!ga) return;
    const errMsg = error.stack || error.body || error.data || error.message || (error.request ? error.request.href : null) || error;
    ga.visitor.exception({exd: errMsg});
    return send(event).then(_.constant(undefined));
  });

  skill.onIntentRequest((event) => {
    const ga = event.ga;
    ga.visitor.event("Intents",event.intent.name,undefined,undefined,{ni: 1});
    _.forEach(event.intent.slots,(slot) => {
      ga.visitor.event("Slots",slot.name,slot.value, isNaN(slot.value) ? undefined : +slot.value, {ni: 1});
    });
  });

  skill.onBeforeStateChanged((event, reply, state) => {
    event.ga.from = state.name;
    event.ga.time('States',state.name);
  });

  skill.onAfterStateChanged((event, reply, transition) => {
    const ga = event.ga;
    if (!ga.ignoreState) {
      ga.pushPath(transition.reply);
      ga.visitor.event("States",ga.from, undefined, undefined, {ni: 1});
      event.ga.timeEnd('States',ga.from);
    }
    else{
      event.ga.timeRemove('States',ga.from);
    }
  });

  skill.onBeforeReplySent((event,reply) => {
    event.ga.logPath(event);
    event.ga.timeEnd('Interaction','Request');
    return send(event);
  });

  if (Object.prototype.hasOwnProperty.call(skill, 'onAlexaSkillEvent.SkillEnabled')) {
    skill['onAlexaSkillEvent.SkillEnabled'](defaultEventHandler);
  }

  if (Object.prototype.hasOwnProperty.call(skill, 'onAlexaSkillEvent.SkillDisabled')) {
    skill['onAlexaSkillEvent.SkillDisabled'](defaultEventHandler);
  }

  if (Object.prototype.hasOwnProperty.call(skill, 'onAlexaSkillEvent.SkillAccountLinked')) {
    skill['onAlexaSkillEvent.SkillAccountLinked'](defaultEventHandler);
  }

  function defaultEventHandler(event) {
    event.ga = new EventRider(event, pluginConfig);
    const eventData = event.request.type.split('.');
    const category = eventData[0];
    const action = eventData[1];
    event.ga.visitor.event(category, action);
    send(event);
  }

  if (Object.prototype.hasOwnProperty.call(skill, 'onAlexaSkillEvent.SkillPermissionChanged')) {
    skill['onAlexaSkillEvent.SkillPermissionChanged'](permissionEventHandler);
  }

  if (Object.prototype.hasOwnProperty.call(skill, 'onAlexaSkillEvent.SkillPermissionAccepted')) {
    skill['onAlexaSkillEvent.SkillPermissionAccepted'](permissionEventHandler);
  }

  function permissionEventHandler(event) {
    event.ga = new EventRider(event, pluginConfig);
    const eventData = event.request.type.split('.');
    const category = eventData[0];
    const action = eventData[1];
    event.request.body.acceptedPermissions.forEach((permissions) => {
      const label = permissions.scope;
      event.ga.visitor.event(category, action, label);
    });
    send(event);
  }

  if (Object.prototype.hasOwnProperty.call(skill, 'onAlexaHouseholdListEvent.ItemsCreated')) {
    skill['onAlexaHouseholdListEvent.ItemsCreated'](listEventHandler);
  }

  if (Object.prototype.hasOwnProperty.call(skill, 'onAlexaHouseholdListEvent.ItemsUpdated')) {
    skill['onAlexaHouseholdListEvent.ItemsUpdated'](listEventHandler);
  }

  if (Object.prototype.hasOwnProperty.call(skill, 'onAlexaHouseholdListEvent.ItemsDeleted')) {
    skill['onAlexaHouseholdListEvent.ItemsDeleted'](listEventHandler);
  }

  function listEventHandler(event) {
    event.ga = new EventRider(event, pluginConfig);
    const eventData = event.request.type.split('.');
    const category = eventData[0];
    const action = eventData[1];
    const listId = event.request.body.listId;
    event.request.body.listItemIds.forEach((listItemId) => {
      const label = `${listId} - ${listItemId}`;
      event.ga.visitor.event(category, action, label);
    });
    send(event);
  }

  function send(event) {
    if (_.includes(pluginConfig.ignoreUsers, event.user.userId)) return Promise.resolve(null);
    if (config.suppressSending) return Promise.resolve(null);
    return new Promise((resolve) => {
      event.ga.visitor.send((err,cnt) => {
        if (err) {
          console.error('Failed to send analytics');
          console.error(err.stack || err);
          return resolve(); // Analytics errors shouldn't tank the whole process
        }
        return resolve();
      });
    });
  }
}

module.exports = register;
