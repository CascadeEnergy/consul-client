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
// You mentioned a couple days ago to me that you weren't sure if you liked having
// to pass the httpClient in here. I definitely think it hurts the ease of use
// of this module. Not only are you expecting the user to pass in an http client
// you require it to be a very specific one. It needs to be a Bluebird
// promisified one, that uses the "Async" suffix. I don't think it is necessary
// to have the user pass one in, and it should just be internally define. You could
// either promisify request in here, or use a request library of your choosing
// which already supports promises.

// This isn't really a discovery "url". I think a url type of string is expected
// to have a uri scheme like "http://", "https://", "s3://", "file://" etc. I
// like the name "host" for this variable perhaps.
module.exports = function(discoveryUrl, httpClient) {

  /**
   * @function invoke
   * @param {string} serviceName
   * @param {Object} options can include method, endpoint and data
   * @returns {Promise} resolves with service response
   */
  // I don't think there's any need to separate serviceName, from the options
  // hash. The interface could be just (options)

  // options = { serviceName, endpoint, method, body }
   return function(serviceName, options) {
    var defaultOptions = {
      method: 'get'
    };

    options = _.assign(defaultOptions, options);

    // No need to Bluebird.resolve a promise with options to kick off a promise
    // chain. You could just validate the options, and throw an error if they're
    // invalid.

    // validateOptions(options) // if that function hits an invalid it throws.
    //
    // Or even this, because you only really validate serviceName
    //
    // if (options.serviceName == null) {
    //   throw new Error('service name required');
    // }
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

      // Not sure I understand the need for throwing this error.
      // All HTTP verbs should be acceptable right?
      // If you try to make a request, and the service you're requesting doesn't
      // support that HTTP verb, it should fail and come back in the service
      // response. And that would be enough right?
      if (_.indexOf(methods, options.method) < 0) {
        throw new Error('unsupported method');
      }

      // Does this need to return anything at all?
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

      // I'd just call this "body", most things call it body, hapi is the
      // only thing I know of that calls it payload.
      if (options.payload) {
        request.body = options.payload;
      }

      // This would get a little simpler if you were using your own specific
      // http client as part of this module, rather than allowing it to be
      // passed in.
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
