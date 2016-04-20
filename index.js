'use strict';

var assign = require('lodash/object/assign');
var got = require('got');
var isEmpty = require('lodash/lang/isEmpty');
var reqo = require('reqo');
var sample = require('lodash/collection/sample');
var composeConsulHealthUrl = require('./lib/composeConsulHealthUrl');
var prepareRequestOptions = require('./lib/prepareRequestOptions');
var serviceUrlComposer = require('./lib/serviceUrlComposer');
var semver = require('semver');
var filter = require('lodash/collection/filter');

/**
 * Returns a consul request function, closure scopes the host configuration
 * of the service discovery system.
 *
 * @param host DNS or IP location of service discovery API
 */
function consulClient(host) {
  /**
   * Discovers services and makes HTTP requests to them using "got" http client.
   *
   * @param {object} config Hash of configuration for the service request. It is a
   * super set of "got" options, which is used underneath.
   *
   * @returns Promise
   */
  function consulRequest(config) {
    var defaults = { endpoint: '', json: true };
    var settings = assign({}, defaults, config);
    var requestOptions = prepareRequestOptions(settings);
    var healthUrl = composeConsulHealthUrl(
      host,
      settings.serviceName
    );
    var version = semver.validRange(settings.version);

    // Make a request to Consul host to retrieve service health info
    // selects a healthy service, if one exists
    // uses service data found to compose a url of where to reach the service
    // makes an HTTP request to the service.
    return got(healthUrl, { json: true })
      .then(function(response) {
        return selectServiceInstance(response, version)
      })
      .then(serviceUrlComposer(settings.endpoint))
      .then(makeRequest);

    /**
     * Selects a healthy service instance to use if one exists.
     *
     * @param {object} response
     * @param {String} version
     * @returns {Service|*}
     */
    function selectServiceInstance(response, version) {
      if (isEmpty(response.body)) {
        throw new Error('no service instances available');
      }

      if (!version) {
        throw new Error('invalid version supplied');
      }

      var matches = [];

      response.body.forEach(function(hit) {
        if (semver.satisfies(hit.Service.Tags[0] = hit.Service.Tags[0].replace(/-/g, '.'), version)) {
          matches.push(hit.Service);
        }
      });

      if(isEmpty(matches)) {
        throw new Error('no services matching requested version were found');
      }

      var maxVersion = semver.maxSatisfying(matches.map( function(match) { return match.Tags[0]; }), version);

      return sample(filter(matches, function(match) { return match.Tags[0] == maxVersion; }));
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

  return reqo(consulRequest, ['serviceName', 'version']);
}

module.exports = consulClient;
