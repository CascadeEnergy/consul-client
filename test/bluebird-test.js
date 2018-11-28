const assert = require("assert");
const { format } = require("util");
const { isEqual } = require("lodash");
const nock = require("nock");
const { withData } = require("leche");
const consulClientBluebird = require("../bluebird");

describe("consul-client/bluebird", () => {
  const host = "my.service.discovery.host.com";
  const hostUrl = `http://${host}`;
  const serviceName = "testService";
  const endpoint = "testEndpoint";
  const version = "1.0.0";
  const sampleBody = { beep: "boop" };
  let consulRequest;

  beforeEach(() => {
    consulRequest = consulClientBluebird(host);
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
        const serviceResponse = { foo: "bar" };
        const healthUrl = format("/v1/health/service/%s?passing", requestConfig.serviceName);

        // Health check call responds with one healthy service.
        nock(hostUrl)
          .get(healthUrl)
          .reply(200, [{ Service: { Tags: ["1.0.0"], Address: address, Port: port } }]);

        // Service call
        nock(serviceUrl)
          [verb](`/${requestConfig.endpoint}`, bodyValidateFn)
          .reply(200, serviceResponse);

        consulRequest(requestConfig)
          .then(response => {
            assert.deepEqual(response.body, serviceResponse);
            // Something to send through bluebird.map()
            return ["foo", "bar"];
          })
          .map(
            result =>
              // bazify each item in the result set
              `${result}baz`
          )
          .then(arr => {
            assert.deepEqual(arr, ["foobaz", "barbaz"]);
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
});
