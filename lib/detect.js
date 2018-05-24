'use strict';

const path = require('path');
const _ = require('lodash');

exports.appNameFromDir = function appNameFromDir (dir) {
  dir = dir || __dirname;
  const re = /([^\/]+)\/node_modules/;
  const match = re.exec(dir);
  if(!match) return null;
  return match[1];
};

exports.appNameFromEnv = function appNameFromEnv(/* dir */) {
  return process.env.AWS_LAMBDA_FUNCTION_NAME;
};

exports.appName = function appName() {
  return exports.appNameFromEnv() ||  exports.appNameFromDir() || 'unknown';
};

exports.versionFromEnv = function versionFromEnv() {
  const version = process.env.AWS_LAMBDA_FUNCTION_VERSION;
  if(version === '$Latest') return null;
  return version || null;
};

exports.versionFromPackage = function versionFromPackage() {
  try {
    const json = require(path.join(__dirname,'../../../package.json'));
    return json.version || null;
  }
  catch(e) { return null; }
};

exports.appVersion = function appVersion() {
  return exports.versionFromEnv() ||  exports.versionFromPackage() || '1.0';
};
