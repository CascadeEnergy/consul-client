'use strict';

var _ = require('lodash');
var Bluebird = require('bluebird');
var format = require('util').format;

var methods = ['get', 'post'];

/**
 * @module @cascadeenergy/service-client
 * @param {string} discoveryUrl
 * @param {Object} httpClient with getAsync and postAsync methods
 * @returns {Object} serviceClient with invoke and retrieve methods
 */
module.exports = function(discoveryUrl, httpClient) {

  /**
   * @function invoke
   * @param {string} serviceName
   * @param {Object} options can include method, endpoint and data
   * @returns {Promise} resolves with service response
   */
   return function(serviceName, options) {
    var defaultOptions = {
      method: 'get'
    };

    options = _.assign(defaultOptions, options);

    return Bluebird.resolve(options)
      .then(validate)
      .then(getServiceUrl)
      .spread(checkStatusCode)
      .then(pluckServiceUrl)
      .then(makeRequest)
      .spread(checkStatusCode);

    function validate(options) {
      if (serviceName == null) {
        throw new Error('service name required');
      }

      if (_.indexOf(methods, options.method) < 0) {
        throw new Error('unsupported method');
      }

      return true;
    }

    function getServiceUrl() {
      return httpClient
        .getAsync({
          url: format(discoveryUrl, serviceName),
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
      if (options.endpoint) {
        serviceUrl += '/' + options.endpoint;
      }
      request.url = serviceUrl;

      if (options.payload) {
        request.body = options.payload;
      }

      return httpClient[options.method + 'Async'](request);
    }

    function checkStatusCode(response, data) {
      var statusCode = response.statusCode;
      if (200 <= statusCode && statusCode < 400) {
        return data;
      }
      throw statusErrorFactory(statusCode, data);
    }

    function statusErrorFactory(statusCode, data) {
      if(data && data.message) {
        return new Error(data.message);
      }
      return new Error('Status Code: ' + statusCode)
    }
  };
};
