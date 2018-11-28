const { omit, isPlainObject } = require("lodash");

/**
 * Prepares a service-client specific configuration hash for use as
 * options for the got http client.
 *
 * @param {object} settings service-client setting
 * @returns {object} A configuration object suitable for got http client.
 */
function prepareRequestOptions(settings) {
  // Removes service-client specific configuration settings.
  const options = omit(settings, ["serviceName", "version", "endpoint"]);

  // Checks if the body setting is a plain object and turns it into  a json
  // string so it can be used as POST data.
  if (isPlainObject(options.body)) {
    options.body = JSON.stringify(settings.body);
  }

  return options;
}

module.exports = prepareRequestOptions;
