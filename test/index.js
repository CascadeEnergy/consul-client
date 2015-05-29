'use strict';

var assert = require('assert');
var Bluebird = require('bluebird');
var sinon = require('sinon');

describe('index', function() {
  var serviceFactory;
  var service;
  var httpClient = {
    getAsync: sinon.stub(),
    postAsync: sinon.stub()
  };

  beforeEach(function() {
    serviceFactory = require('../index');
    service = serviceFactory(
      'http://discovery/%s.url',
      httpClient
    );
  });

  afterEach(function() {
    httpClient.getAsync.reset();
    httpClient.postAsync.reset();
  });

  describe('service', function() {
    beforeEach(function() {
      httpClient.getAsync.returns(Bluebird.resolve([
        {statusCode: 200},
        [{Service: {Address: 'service.url', Port: 8000}}]
      ]));
    });

    it('should discover and call service', function(done) {
      service('serviceName')
        .then(function() {
          assert(httpClient.getAsync.calledTwice);
          assert.deepEqual(
            httpClient.getAsync.args[0], [{
              url: 'http://discovery/serviceName.url',
              json: true
            }]
          );
          assert.deepEqual(httpClient.getAsync.args[1], [
            {
              url: 'http://service.url:8000',
              json: true
            }
          ]);
          done();
        });
    });

    it('should append endpoint', function(done) {
      service('serviceName', {endpoint: 'resource'})
        .then(function() {
          assert.deepEqual(httpClient.getAsync.args[1], [
            {
              url: 'http://service.url:8000/resource',
              json: true
            }
          ]);
          done();
        });
    });

    it('should support POST with data', function(done) {
      var data = {};
      httpClient.postAsync.returns(Bluebird.resolve([{statusCode: 200}]));

      service('serviceName', {method: 'post', payload: data})
        .then(function() {
          assert(httpClient.getAsync.calledOnce);
          assert.deepEqual(httpClient.postAsync.args[0], [
            {
              url: 'http://service.url:8000',
              body: data,
              json: true
            }
          ]);
          done();
        });
    });

    it('should throw error if no service name is provided', function(done) {
      service()
        .catch(function(e) {
          assert.equal(e.message, 'service name required');
          done();
        });
    });

    it('should throw error method is unsupported', function(done) {
      service('serviceName', {method: 'asdf'})
        .catch(function(e) {
          assert.equal(e.message, 'unsupported method');
          done();
        });
    });

    it(
      'should throw error if service discovery returns an empty array',
      function(done) {
        httpClient.getAsync.returns(Bluebird.resolve([
          {statusCode: 200},
          []
        ]));

        service('serviceName')
          .catch(function(e) {
            assert.equal(e.message, 'no service instances available');
            done();
          });
      }
    );

    it(
      'should throw status code if response is bad',
      function(done) {
        httpClient.getAsync.returns(Bluebird.resolve([
          {statusCode: 400}
        ]));

        service('serviceName')
          .catch(function(e) {
            assert.equal(e.message, 'Status Code: 400');
            done();
          });
      }
    );

    it(
      'should throw data.message if services return bad status',
      function(done) {
        httpClient.getAsync.returns(Bluebird.resolve([
          {statusCode: 400},
          {message: 'Bad Request'}
        ]));

        service('serviceName')
          .catch(function(e) {
            assert.equal(e.message, 'Bad Request');
            done();
          });
      }
    );
  });
});
