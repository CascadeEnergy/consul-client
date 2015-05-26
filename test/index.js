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
      'http://storage/%s.url',
      httpClient
    );
  });

  afterEach(function() {
    httpClient.getAsync.reset();
    httpClient.postAsync.reset();
  });

  describe('invoke', function() {
    beforeEach(function() {
      httpClient.getAsync.returns(Bluebird.resolve([
        {statusCode: 200},
        [{Service: {Address: 'service.url', Port: 8000}}]
      ]));
    });

    it('should discover and call service', function(done) {
      service.invoke('serviceName')
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
      service.invoke('serviceName', {endpoint: 'resource'})
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

      service.invoke('serviceName', {method: 'post', payload: data})
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
      service.invoke()
        .catch(function(e) {
          assert.equal(e.message, 'service name required');
          done();
        });
    });

    it('should throw error method is unsupported', function(done) {
      service.invoke('serviceName', {method: 'asdf'})
        .catch(function(e) {
          assert.equal(e.message, 'unsupported method');
          done();
        });
    });

    it(
      'should throw error if service discovery doesn\'t return 200',
      function(done) {
        httpClient.getAsync.returns(Bluebird.resolve([
          {statusCode: 500}
        ]));

        service.invoke('serviceName')
          .catch(function(e) {
            assert.equal(e.message, 'resource not found');
            done();
          });
      }
    );

    it(
      'should throw error if service discovery returns an empty array',
      function(done) {
        httpClient.getAsync.returns(Bluebird.resolve([
          {statusCode: 200},
          []
        ]));

        service.invoke('serviceName')
          .catch(function(e) {
            assert.equal(e.message, 'no service instances available');
            done();
          });
      }
    );
  });

  describe('retrieve', function() {
    it('should fetch from storage', function(done) {
        var exptectedValue = 'test value';
        var encodedValue = new Buffer(exptectedValue);

        httpClient.getAsync.returns(Bluebird.resolve([
          {statusCode: 200},
          [{Value: encodedValue}]
        ]));

        service.retrieve('key')
          .then(function(actualValue) {
            assert.equal(exptectedValue, actualValue);
            done();
          });
      }
    );

    it(
      'should throw error if storage doesn\'t return 200',
      function(done) {
        httpClient.getAsync.returns(Bluebird.resolve([
          {statusCode: 500}
        ]));

        service.retrieve('key')
          .catch(function(e) {
            assert.equal(e.message, 'resource not found');
            done();
          });
      }
    );
  });
});
