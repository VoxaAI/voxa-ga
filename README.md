Voxa Google Analytics
===========

[![Build Status](https://travis-ci.org/mediarain/voxa-ga.svg?branch=master)](https://travis-ci.org/mediarain/voxa-ga)
[![Coverage Status](https://coveralls.io/repos/github/mediarain/voxa-ga/badge.svg?branch=master)](https://coveralls.io/github/mediarain/voxa-ga?branch=master)

A [Google Analytics](https://www.google.com/analytics) plugin for [voxa](https://mediarain.github.io/voxa/)

Installation
-------------

Just install from [npm](https://www.npmjs.com/package/voxa-ga)

```bash
npm install --save voxa-ga
```
**Important! This plugin is designed to work with Analytic properties that are setup as Mobile App's not Websites**

Usage
------

```javascript
require('voxa-ga')(skill,config.google_analytics);

```

### Options
```javascript
{
  trackingId: "UA-XXXXXX-X", // Your app's tracking id
  appName: "hamurabi", // The application name. If not provided, an attempt will be made to derive it
  appVersion: "1.1", // The applications current version number. If not provided, an attempt will be made to derive it.
  ignoreUsers: [] // An array of users that will be ignored. Useful for blacklisting dev or monitoring accounts from analytics
}
```

What You Get
--------

By attaching the plugin, for free you get the following
* Track users by their Alexa user id
* The paths of each response will be logged as a screen view (e.g. Welcome.FirstTimeUser)
* Events will be logged to track each
  * Intent (category: "Intents", action: "IntentName")
  * State (category: "States", action: "state-name")
  * Slot (category: "Slots", action: "slot-nmae", label: "slot-value")
* User timings will be logged for
  * Request processing time (how much time your code takes)
  * Each state's occupancy time 
* The device's capabilities (e.g. AudioPlayer) are logged it the flash-version variable
* Session start/stop bookends
* The user's locale
* Exceptions (fatal or caught) are captured

Additionally a `ga` object is attached to the `alexaEvent` object, allowing you to log custom events.

### Suppressing State Events
Sometimes smaller intermediary states are just not interesting to log. Suppress a state from logging as follows:
```javascript
skill.onState('my-state',alexaEvent => {
  alexaEvent.ga.ignore();
  return {reply: 'Greeting', to: 'my-next-state'};
})
```

### Custom Events
Log a custom event by invoking `.event` on the `ga` object
```javascript
skill.onState('my-state',alexaEvent => {
  alexaEvent.ga.event('Category','Action','Label',Value)
  return {reply: 'Greeting', to: 'my-next-state'};
})
```
### Timing
Have something to time? Use the `ga` object. Remember that the request and each state is already timed for you.
```javascript
skill.onState('my-state',alexaEvent => {
  alexaEvent.ga.time('Category','Variable');
  return longRunningOperaation().then(() => {
    alexaEvent.ga.timeEnd('Category','Variable');
  }).then(finishIt)
})
```

### Anything Else
Use the visitor object to get access to a [universal analytics](https://www.npmjs.com/package/universal-analytics) object.
```javascript
skill.onState('my-state',alexaEvent => {
  alexaEvent.ga.visitor.transaction('213')
})
```

### Sending events
The plugin will automatically send hits at the end of each request.
