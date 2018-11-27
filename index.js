const { assign, isEmpty, sample, filter } = require("lodash");
const got = require("got");
const semver = require("semver");
const reqo = require("./lib/reqo");
const composeConsulHealthUrl = require("./lib/composeConsulHealthUrl");
const prepareRequestOptions = require("./lib/prepareRequestOptions");
const serviceUrlComposer = require("./lib/serviceUrlComposer");

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
    const defaults = { endpoint: "", json: true };
    const settings = assign({}, defaults, config);
    const requestOptions = prepareRequestOptions(settings);
    const healthUrl = composeConsulHealthUrl(host, settings.serviceName);
    const version = semver.validRange(settings.version);

    // Make a request to Consul host to retrieve service health info
    // selects a healthy service, if one exists
    // uses service data found to compose a url of where to reach the service
    // makes an HTTP request to the service.
    return got(healthUrl, { json: true })
      .then(response => selectServiceInstance(response, version))
      .then(serviceUrlComposer(settings.endpoint))
      .then(makeRequest);

    /**
     * Selects a healthy service instance to use if one exists.
     *
     * @param {object} response
     * @param {String} version
     * @returns {Service|*}
     */
    // eslint-disable-next-line no-shadow
    function selectServiceInstance(response, version) {
      const matches = [];

      if (isEmpty(response.body)) {
        throw new Error("No service instances available");
      }

      if (!version) {
        throw new Error("Invalid version supplied");
      }

      response.body.forEach(hit => {
        // eslint-disable-next-line no-param-reassign
        hit.Service.Tags[0] = hit.Service.Tags[0].replace(/-/g, ".");

        if (semver.satisfies(hit.Service.Tags[0], version)) {
          matches.push(hit.Service);
        }
      });

      if (isEmpty(matches)) {
        throw new Error("No services matching requested version were found");
      }

      const maxVersion = semver.maxSatisfying(matches.map(match => match.Tags[0]), version);

      return sample(filter(matches, match => match.Tags[0] === maxVersion));
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

  return reqo(consulRequest, ["serviceName", "version"]);
}

module.exports = consulClient;
