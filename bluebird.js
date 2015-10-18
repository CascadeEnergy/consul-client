var Bluebird = require('bluebird');
var consulClient = require('./index');

function consulRequestBluebirdDecorator(consulRequest) {
  return function(config) {
    return Bluebird.resolve(consulRequest(config));
  }
}

function consulClientBluebird(host) {
  return consulRequestBluebirdDecorator(consulClient(host));
}

module.exports = consulClientBluebird;
