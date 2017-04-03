'use strict';

const chai = require('chai');

const simple = require('simple-mock');

const expect = chai.expect;
const detect = require('../lib/detect');

describe('detect', () => {

  describe('appNameFromDir',() => {
    let sut = detect.appNameFromDir;
    itIs('/Users/mitchellharris/src/alexa/hammurabi/node_modules/voxa-opearlo/lib','hammurabi');
    itIs('/Users/mitchellharris/src/alexa/hammurabi/node_modules/','hammurabi');
    itIs('/Users/mitchellharris/src/alexa/hammurabi',null);

    function itIs(dir,expected) {
      it(`${dir} => ${expected}`,() => {
        let actual = sut(dir);
        expect(actual).to.equal(expected);
      })
    }

  });

  describe('versionNameFromEnv',() => {
    let versionName, hasVersion;
    beforeEach(function(){
      hasVersion = !!process.env.AWS_LAMBDA_FUNCTION_VERSION;
      versionName = process.env.AWS_LAMBDA_FUNCTION_VERSION;
    })
    it('finds it from the node version',() => {
      process.env.AWS_LAMBDA_FUNCTION_VERSION = '7'
      let actual = detect.versionFromEnv();
      expect(actual).to.equal('7');
    })
    it('does not allow $Latest version',() => {
      let actual = detect.versionFromEnv();
      expect(actual).to.be.null;
    })
    afterEach(function(){
      if(!hasVersion) delete process.env.AWS_LAMBDA_FUNCTION_VERSION;
      else process.env.AWS_LAMBDA_FUNCTION_VERSION = versionName;
    })
  });

  describe('deviceCapabilities',() => {
    let sut = detect.deviceCapabilities;
    itIs({},'none')
    itIs({AudioPlayer: {}},'AudioPlayer')
    itIs({"AudioPlayer":{},"Video": {}},'AudioPlayer;Video')


    function itIs(supportedInterfaces, expected) {
      it('finds ' + expected,function(){
        let actual = sut({context: {System: {device:{ supportedInterfaces: supportedInterfaces }}}})
        expect(actual).to.equal(expected);
      })
    }

  });
});
