const { format } = require("util");

/**
 * Templates a host, and serviceName into a url for the Consul HTTP API
 * which returns health information about a particular service.
 *
 * @param {string} host
 * @param {string} serviceName
 * @returns {string} Consul service health url
 */
function composeConsulHealthUrl(host, serviceName) {
  const template = "http://%s/v1/health/service/%s?passing";
  return format(template, host, serviceName);
}

module.exports = composeConsulHealthUrl;
