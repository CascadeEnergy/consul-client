'use strict';

var assert = require('assert');
var proxyquire = require('proxyquire');
var sinon = require('sinon');

describe('index', function() {
  var serviceFactory = sinon.stub().returns({invoke: '', retrieve: ''});
  var service = proxyquire('../index', {
    './lib/serviceFactory': serviceFactory
  });

  it('should configure service', function() {
    assert(serviceFactory.calledOnce);
    assert.deepEqual(serviceFactory.args[0], [{
      discoveryUrl:
        'http://internal.consul.energysensei.info/v1/health/service/%s?passing',
      storageUrl: 'http://internal.consul.energysensei.info/v1/kv/%s',
      httpClient: require('request')
    }]);
  });
});
