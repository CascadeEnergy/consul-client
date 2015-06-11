'use strict';

var serviceClient = require('../index');

var config = {
  host: 'my.consul.com', // e.g 172.x.x.x:8500
  serviceName: 'users',
  endpoint: 'users',
  method: 'POST',
  body: {
    username: 'foo',
    password: 'bar'
  }
};

// Discovers an instance of the users service
// and POSTs a new user to it's /users route.
serviceClient(config)
  .then(console.log) // log successes
  .catch(console.log); // catch and log all errors
