'use strict';

var assign = require('lodash/object/assign');
var got = require('got-promise');
var isEmpty = require('lodash/lang/isEmpty');
var reqo = require('reqo');
var sample = require('lodash/collection/sample');
var composeConsulHealthUrl = require('./lib/composeConsulHealthUrl');
var prepareRequestOptions = require('./lib/prepareRequestOptions');
var serviceUrlComposer = require('./lib/serviceUrlComposer');

/**
 * Returns a service request function, closure scopes the host configuration
 * of the service discovery system.
 *
 * @param host DNS or IP location of service discovery API
 */
function serviceClient(host) {
  /**
   * Discovers services and makes HTTP requests to them using "got" http client.
   *
   * @param {object} config Hash of configuration for the service request. It is a
   * super set of "got" options, which is used underneath.
   *
   * @returns Promise
   */
  function serviceRequest(config) {
    var defaults = { endpoint: '', json: true };
    var settings = assign({}, defaults, config);
    var requestOptions = prepareRequestOptions(settings);
    var healthUrl = composeConsulHealthUrl(host, settings.serviceName);

    // Make a request to Consul host to retrieve service health info
    // selects a healthy service, if one exists
    // uses service data found to compose a url of where to reach the service
    // makes an HTTP request to the service.
    return got(healthUrl, { json: true })
      .then(selectServiceInstance)
      .then(serviceUrlComposer(config.endpoint))
      .then(makeRequest);

    /**
     * Selects a healthy service instance to use if one exists.
     *
     * @param {object} response
     * @returns {Service|*}
     */
    function selectServiceInstance(response) {
      if (isEmpty(response.body)) {
        throw new Error('no service instances available');
      }

      return sample(response.body).Service;
    }

    /**
     * Makes an HTTP request to the service.
     *
     * @param {string} serviceUrl
     * @returns {Promise}
     */
    function makeRequest(serviceUrl) {
      return got(serviceUrl, requestOptions);
    }
  }

  return reqo(serviceRequest, ['serviceName']);
}

module.exports = serviceClient;
