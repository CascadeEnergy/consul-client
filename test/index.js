var nock = require('nock');
var serviceClient = require('../index');

var host = 'my.service.discovery.host.com';

describe('service-client', function() {
  var serviceRequest;

  beforeEach(function() {
    serviceRequest = serviceClient(host)
  });

  it('should throw an error if no healthy services are found', function(done) {
    var serviceName = 'testService';
    nock('http://' + host)
      .get('/v1/health/service/' + serviceName + '?passing')
      .reply(200, {body: []});

    serviceRequest()
  });
});
