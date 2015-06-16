'use strict';

var format = require('util').format;

/**
 * Composes a url string for a service call, service data and an endpoint.
 *
 * @param {string} endpoint
 * @returns {Function}
 */
function serviceUrlComposer(endpoint) {
  /**
   * Returns url string with consul service location, and endpoint.
   *
   * @param {object} service
   * @returns {string} Service url.
   */
  return function composeServiceUrl(service) {
    return format('http://%s:%s/%s', service.Address, service.Port, endpoint);
  };
}

module.exports = serviceUrlComposer;
