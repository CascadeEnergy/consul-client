const assert = require("assert");
const { format } = require("util");
const { isEqual } = require("lodash");
const nock = require("nock");
const { withData } = require("leche");
const consulClient = require("../index");

describe("consul-client", () => {
  const host = "my.service.discovery.host.com";
  const hostUrl = `http://${host}`;
  const serviceName = "testService";
  const endpoint = "testEndpoint";
  const version = "1.0.0";
  const sampleBody = { beep: "boop" };
  let consulRequest;

  beforeEach(() => {
    consulRequest = consulClient(host);
  });

  // =====================================
  // Testing requests with HTTP verbs
  // =====================================
  const getSetup = ["get", undefined, { serviceName, version, endpoint }];

  const postSetup = [
    "post",
    body => isEqual(body, sampleBody),

    {
      serviceName,
      version,
      endpoint,
      method: "POST",
      body: sampleBody,
    },
  ];

  const putSetup = [
    "put",
    body => isEqual(body, sampleBody),
    {
      serviceName,
      version,
      endpoint,
      method: "PUT",
      body: sampleBody,
    },
  ];

  const deleteSetup = [
    "delete",
    undefined,
    {
      serviceName,
      version,
      endpoint,
      method: "DELETE",
    },
  ];

  withData(
    {
      "GET verb": getSetup,
      "POST verb": postSetup,
      "PUT verb": putSetup,
      "DELETE verb": deleteSetup,
    },
    (verb, bodyValidateFn, requestConfig) => {
      it("should make consul request", done => {
        const address = "test.service.com";
        const port = 4242;
        const serviceUrl = `http://${address}:${port}`;
        const serviceResponse = { body: [{ Service: { Tags: ["1.0.0"] } }] };
        const healthUrl = format("/v1/health/service/%s?passing", requestConfig.serviceName);

        // Health check call responds with one healthy service.
        nock(hostUrl)
          .get(healthUrl)
          .reply(200, [{ Service: { Tags: ["1.0.0"], Address: address, Port: port } }]);

        // Service call
        nock(serviceUrl)
          [verb](`/${requestConfig.endpoint}`, bodyValidateFn)
          .reply(200, serviceResponse);

        consulRequest(requestConfig).then(response => {
          assert.deepEqual(response.body, serviceResponse);
          done();
        });
      });
    }
  );

  // =====================================
  // Testing service instances not found.
  // =====================================
  it("should throw an error if no healthy services are found", done => {
    const healthUrl = format("/v1/health/service/%s?passing", serviceName);

    // Return empty array from service health check call
    nock(hostUrl)
      .get(healthUrl)
      .reply(200, []);

    // Results in an error, "no service instances available"
    consulRequest({
      serviceName,
      version,
    }).catch(err => {
      assert.equal(err.message, "No service instances available");
      done();
    });
  });

  // ======================================
  // Testing version string issues.
  // ======================================
  it("should throw an error if the version string provided is invalid", done => {
    const healthUrl = format("/v1/health/service/%s?passing", serviceName);
    const serviceResponse = { body: [{ Service: { Tags: ["1.0.0"] } }] };

    // Return empty array from service health check call
    nock(hostUrl)
      .get(healthUrl)
      .reply(200, serviceResponse);

    consulRequest({
      serviceName,
      version: "foo-invalid-version",
    }).catch(err => {
      assert.equal(err.message, "Invalid version supplied");
      done();
    });
  });

  it("should throw an error if the version provided matches no running services", done => {
    const healthUrl = format("/v1/health/service/%s?passing", serviceName);
    const serviceResponse = [{ Service: { Tags: ["0-1-0"] } }];

    nock(hostUrl)
      .get(healthUrl)
      .reply(200, serviceResponse);

    consulRequest({
      serviceName,
      version: "1.0.0",
    }).catch(err => {
      assert.equal(err.message, "No services matching requested version were found");
      done();
    });
  });
});
