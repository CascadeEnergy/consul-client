var assert = require('assert');
var isEqual = require('lodash/lang/isEqual');
var nock = require('nock');
var withData = require('leche').withData;
var serviceClient = require('../index');

describe('service-client', function() {
  var serviceRequest;
  var host = 'my.service.discovery.host.com';
  var hostUrl = 'http://' + host;
  var serviceName = 'testService';
  var endpoint = 'testEndpoint';
  var sampleBody = { beep: 'boop' };
  var getSetup;
  var postSetup;
  var putSetup;
  var deleteSetup;

  beforeEach(function() {
    serviceRequest = serviceClient(host);
  });

  // =====================================
  // Testing requests with HTTP verbs
  // =====================================
  getSetup = [
    'get',
    undefined,
    { serviceName: serviceName, endpoint: endpoint }
  ];

  postSetup = [
    'post',
    function(body) { return isEqual(body, sampleBody); },
    {
      serviceName: serviceName,
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
      endpoint: endpoint,
      method: 'PUT',
      body: sampleBody
    }
  ];

  deleteSetup = [
    'delete',
    undefined,
    { serviceName: serviceName, endpoint: endpoint, method: 'DELETE' }
  ];

  withData({
    'GET verb': getSetup,
    'POST verb': postSetup,
    'PUT verb': putSetup,
    'DELETE verb': deleteSetup
  }, function(verb, bodyValidateFn, requestConfig) {
    it('should make service request', function(done) {
      var address = 'test.service.com';
      var port = 4242;
      var serviceUrl = 'http://' + address + ':' + port;
      var serviceResponse = { foo: 'bar' };

      // Health check call responds with one healthy service.
      nock(hostUrl)
        .get('/v1/health/service/' + requestConfig.serviceName + '?passing')
        .reply(200, [{Service: {Address: address, Port: port}}]);

      // Service call
      nock(serviceUrl)
        [verb]('/' + requestConfig.endpoint, bodyValidateFn)
        .reply(200, serviceResponse);

      serviceRequest(requestConfig)
        .then(function(response) {
          assert.deepEqual(response.body, serviceResponse);
          done();
        });
    });
  });

  // =====================================
  // Testing service instances not found.
  // =====================================
  it('should throw an error if no healthy services are found', function(done) {
    // Return empty array from service health check call
    nock(hostUrl)
      .get('/v1/health/service/' + serviceName + '?passing')
      .reply(200, []);

    // Results in an error, "no service instances available"
    serviceRequest({
      serviceName: serviceName
    }).catch(function(err) {
      assert.equal(err.message, 'no service instances available');
      done();
    });
  });
});
