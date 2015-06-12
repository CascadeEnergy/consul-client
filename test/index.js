var assert = require('assert');
var isEqual = require('lodash/lang/isEqual');
var nock = require('nock');
var serviceClient = require('../index');

var host = 'my.service.discovery.host.com';

describe('service-client', function() {
  var serviceRequest;

  beforeEach(function() {
    serviceRequest = serviceClient(host);
  });

  it('should throw an error if no healthy services are found', function(done) {
    var serviceName = 'testService';

    // Return empty array from service health check call
    nock('http://' + host)
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

  it('should make service request', function(done) {
    var serviceName = 'testService';
    var address = 'test.service.com';
    var port = 1234;
    var endpoint = 'testEndpoint';

    // Health check call responds with one healthy service.
    nock('http://' + host)
      .get('/v1/health/service/' + serviceName + '?passing')
      .reply(200, [{Service: {Address: address, Port: port}}]);

    // Service is then called.
    nock('http://' + address + ':' + port)
      .get('/'+ endpoint)
      .reply(200, {foo: 'bar'});

    serviceRequest({
      serviceName: serviceName,
      endpoint: endpoint
    }).then(function(response) {
      assert.deepEqual(response.body, {foo: 'bar'});
      done();
    });
  });

  it('should accept POST body as plain javascript object', function(done) {
    var serviceName = 'testService';
    var address = 'test.service.com';
    var port = 1234;
    var endpoint = 'testEndpoint';

    // Health check call responds with one healthy service.
    nock('http://' + host)
      .get('/v1/health/service/' + serviceName + '?passing')
      .reply(200, [{Service: {Address: address, Port: port}}]);

    // Service is then called.
    nock('http://' + address + ':' + port)
      .post('/'+ endpoint, function(body) {
        return isEqual(body, { beep: 'boop' });
      })
      .reply(200, {foo: 'bar'});

    serviceRequest({
      serviceName: serviceName,
      endpoint: endpoint,
      method: 'POST',
      body: { beep: 'boop' }
    }).then(function(response) {
      assert.deepEqual(response.body, {foo: 'bar'});
      done();
    });
  });
});
