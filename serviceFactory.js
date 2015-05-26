'use strict';

var _ = require('lodash');
var Bluebird = require('bluebird');
var format = require('util').format;

var methods = ['get', 'post'];

module.exports = function(options) {

  function invoke(params) {
    return Bluebird.resolve(params)
      .then(getServiceUrl)
      .spread(checkStatusCode)
      .then(pluckServiceUrl)
      .then(makeRequest)
      .spread(checkStatusCode);

    function getServiceUrl(params) {
      if (params == null || params.serviceName == null) {
        throw new Error('service name required');
      }

      if (!params.method) {
        params.method = 'get';
      }

      if (_.indexOf(methods, params.method) < 0) {
        throw new Error('unsupported method');
      }

      return options.httpClient
        .getAsync({
          url: format(options.discoveryUrl, params.serviceName),
          json: true
        });
    }

    function pluckServiceUrl(data) {
      var serviceInfo;

      if (data.length === 0) {
        throw new Error('no service instances available');
      }

      serviceInfo = _.sample(data).Service;

      return format(
        'http://%s:%s',
        serviceInfo.Address,
        serviceInfo.Port
      );
    }

    function makeRequest(serviceUrl) {
      var request = {
        json: true
      };

      if (params.endpoint) {
        serviceUrl += '/' + params.endpoint;
      }
      request.url = serviceUrl;

      if (params.payload) {
        request.body = params.payload;
      }

      return options.httpClient[params.method + 'Async'](request);
    }
  }

  function retrieve(key) {
    return options.httpClient
      .getAsync({
        url: format(options.storageUrl, key),
        json: true
      })
      .spread(checkStatusCode)
      .then(pluckValue)
      .then(decodeBase64);

    function pluckValue(data) {
      return data[0].Value;
    }
    function decodeBase64(value) {
      return new Buffer(value, 'base64').toString();
    }
  }

  function checkStatusCode(response, data) {
    if (response.statusCode !== 200) {
      throw new Error('resource not found');
    }
    return data;
  }

  return {
    invoke: invoke,
    retrieve: retrieve
  };
};
