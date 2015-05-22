'use strict';

var Bluebird = require('bluebird');
var request = require('request');
var serviceFactory = require('./lib/serviceFactory');

var DISCOVERY_URL =
  'http://internal.consul.energysensei.info/v1/health/service/%s?passing';

var STORAGE_URL =
  'http://internal.consul.energysensei.info/v1/kv/%s';

var service;

Bluebird.promisifyAll(request);

service = serviceFactory({
  discoveryUrl: DISCOVERY_URL,
  storageUrl: STORAGE_URL,
  httpClient: request
});

module.exports = {
  invoke: service.invoke,
  retrieve: service.retrieve
};
