'use strict';

const universalAnalytics = require('universal-analytics');
const _ = require('lodash');
const debug = require('debug')('voxa:ga');

/* A rider is attached to voxaEvents to expose an API
 */
module.exports = class GoogleAnalyticsEventRider {
  constructor(voxaEvent, config) {
    this.voxaEvent = voxaEvent;
    this.config = config;
    this.pageparams = {};
    this.path = [];
    this.timers = [];

    this.visitor = universalAnalytics(
      config.trackingId,
      voxaEvent.user.userId,
      {
        debug: config.debug,
        strictCidFormat: false,
        https: true,
      }
    );

    if (voxaEvent.request.locale) {
      this.visitor.set('ul', voxaEvent.request.locale.toLowerCase());
      const countryCode = voxaEvent.request.locale.split('-')[1];
      this.visitor.set('geoid', countryCode.toUpperCase());
    }
    this.visitor.set('ds', `${this.config.appName}@${this.config.appVersion}`);

    this.visitor.set('cd1', voxaEvent.platform.name);
    this.visitor.set('cd2', _.sortBy(voxaEvent.supportedInterfaces).join(':'));

    this.visitor.set('anonymizeIp', true);
  }

  ignore() {
    this.ignoreState = true;
  }

  startSession() {
    this.pageparams.sc = 'start';
  }

  endSession() {
    this.pageparams.sc = 'end';
  }

  event(...args) {
    this.visitor.event.apply(this.visitor, args); // eslint-disable-line prefer-spread
  }

  time(cat, variable) {
    this.timers.push({ cat, variable, start: +new Date() });
  }

  timeEnd(cat, variable) {
    const timer = this.timeRemove(cat, variable);
    if (!timer) return null;
    const elapsed = (+new Date()) - timer.start;
    this.visitor.timing(cat, variable, elapsed);
  }

  timeRemove(cat, variable) {
    const i = _.findIndex(this.timers, { cat, variable });
    if (i < 0) return null;
    const timer = this.timers[i];
    this.timers.splice(i, 1);
    return timer;
  }

  pushPath(reply) {
    debug('pushPath', reply);
    if (_.isString(reply)) {
      this.path.push(reply);
    } else if (_.isArray(reply)) {
      _.map(reply, view => this.path.push(view));
    }
  }

  logPath() {
    const path = _(this.path)
      .compact()
      .filter(_.isString)
      .value()
      .join('/');

    const name = _(this.path)
      .compact()
      .filter(_.isString)
      .value()
      .join('; ');

    this.visitor.set('dp', path);
    this.visitor.pageview(path, null, name, this.pageparams);
    this.pageparams = {};
    this.path = [];
  }
};
