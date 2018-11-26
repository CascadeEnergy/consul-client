var assert = require('assert');
var { format } = require('util');
var { isEqual } = require('lodash');
var nock = require('nock');
var { withData } = require('leche');
var consulClientBluebird = require('../bluebird');

describe('consul-client/bluebird', function() {
  var host = 'my.service.discovery.host.com';
  var hostUrl = 'http://' + host;
  var serviceName = 'testService';
  var endpoint = 'testEndpoint';
  var version = '1.0.0';
  var sampleBody = { beep: 'boop' };
  var getSetup;
  var postSetup;
  var putSetup;
  var deleteSetup;
  var consulRequest;

  beforeEach(function() {
    consulRequest = consulClientBluebird(host);
  });

  // =====================================
  // Testing requests with HTTP verbs
  // =====================================
  getSetup = [
    'get',
    undefined,
    { serviceName: serviceName, version: version, endpoint: endpoint }
  ];

  postSetup = [
    'post',
    function(body) { return isEqual(body, sampleBody); },
    {
      serviceName: serviceName,
      version: version,
      endpoint: endpoint,
      method: 'POST',
      body: sampleBody
    }
  ];

  putSetup = [
    'put',
    function(body) { return isEqual(body, sampleBody); },
    {
      serviceName: serviceName,
      version: version,
      endpoint: endpoint,
      method: 'PUT',
      body: sampleBody
    }
  ];

  deleteSetup = [
    'delete',
    undefined,
    {
      serviceName: serviceName,
      version: version,
      endpoint: endpoint,
      method: 'DELETE'
    }
  ];

  withData({
    'GET verb': getSetup,
    'POST verb': postSetup,
    'PUT verb': putSetup,
    'DELETE verb': deleteSetup
  }, function(verb, bodyValidateFn, requestConfig) {
    it('should make consul request', function(done) {
      var address = 'test.service.com';
      var port = 4242;
      var serviceUrl = 'http://' + address + ':' + port;
      var serviceResponse = { foo: 'bar' };
      var healthUrl = format(
        '/v1/health/service/%s?passing',
        requestConfig.serviceName
      );

      // Health check call responds with one healthy service.
      nock(hostUrl)
        .get(healthUrl)
        .reply(200, [{Service: {Tags: ['1.0.0'], Address: address, Port: port}}]);

      // Service call
      nock(serviceUrl)
        [verb]('/' + requestConfig.endpoint, bodyValidateFn)
        .reply(200, serviceResponse);

      consulRequest(requestConfig)
        .then(function(response) {
          assert.deepEqual(response.body, serviceResponse);
          // Something to send through bluebird.map()
          return ['foo', 'bar'];
        })
        .map(function(result) {
          // bazify each item in the result set
          return result + 'baz';
        })
        .then(function(arr) {
          assert.deepEqual(arr, ['foobaz', 'barbaz']);
          done();
        });
    });
  });

  // =====================================
  // Testing service instances not found.
  // =====================================
  it('should throw an error if no healthy services are found', function(done) {
    var healthUrl = format(
      '/v1/health/service/%s?passing',
      serviceName
    );

    // Return empty array from service health check call
    nock(hostUrl)
      .get(healthUrl)
      .reply(200, []);

    // Results in an error, "no service instances available"
    consulRequest({
      serviceName: serviceName,
      version: version
    }).catch(function(err) {
      assert.equal(err.message, 'No service instances available');
      done();
    });
  });
});
