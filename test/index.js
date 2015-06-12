var assert = require('assert');
var isEqual = require('lodash/lang/isEqual');
var nock = require('nock');
var withData = require('leche').withData;
var serviceClient = require('../index');

describe('service-client', function() {
  var serviceRequest;
  var host = 'my.service.discovery.host.com';
  var hostUrl = 'http://' + host;

  beforeEach(function() {
    serviceRequest = serviceClient(host);
  });

  it('should throw an error if no healthy services are found', function(done) {
    var serviceName = 'testService';

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

  withData({
    'GET verb': [
      'get',
      undefined,
      { serviceName: 'testService', endpoint: 'testEndpoint' },
      { foo: 'bar' }
    ],
    'POST verb': [
      'post',
      function(body) {
        return isEqual(body, { beep: 'boop' });
      },
      {
        serviceName: 'testService',
        endpoint: 'testEndpoint',
        method: 'POST',
        body: { beep: 'boop' }
      },
      { foo: 'bar' }
    ],
    'PUT verb': [
      'put',
      function(body) {
        return isEqual(body, { beep: 'boop' });
      },
      {
        serviceName: 'testService',
        endpoint: 'testEndpoint',
        method: 'PUT',
        body: { beep: 'boop' }
      },
      { foo: 'bar' }
    ],
    'DELETE verb': [
      'delete',
      undefined,
      {
        serviceName: 'testService',
        endpoint: 'testEndpoint',
        method: 'DELETE'
      },
      { foo: 'bar' }
    ]
  }, function(verb, bodyValidateFn, requestConfig, serviceResponse) {
    it('should make service request', function(done) {
      var address = 'test.service.com';
      var port = 4242;
      var serviceUrl = 'http://' + address + ':' + port;

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
});
