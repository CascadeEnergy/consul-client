'use strict';

var _ = require('lodash');
var Bluebird = require('bluebird');
var format = require('util').format;

var methods = ['get', 'post'];

/**
 * @module @cascadeenergy/service-client
 * @param {string} discoveryUrl
 * @param {string} storageUrl
 * @param {Object} httpClient with getAsync and postAsync methods
 * @returns {Object} serviceClient with invoke and retrieve methods
 */
module.exports = function(discoveryUrl, storageUrl, httpClient) {

  /**
   * @function invoke invoke
   * @param {string} serviceName
   * @param {Object} options can include method, endpoint and data
   * @returns {Promise} resolves with
   */
  function invoke(serviceName, options) {
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
  }

  function retrieve(key) {
    return httpClient
      .getAsync({
        url: format(storageUrl, key),
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
