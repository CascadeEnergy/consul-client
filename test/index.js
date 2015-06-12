var assert = require('assert');
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

  it()
});
