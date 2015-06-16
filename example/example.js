'use strict';

var serviceClient = require('../index');

var consulHost = 'my.consul.com'; // e.g 172.x.x.x:8500
var serviceRequest = serviceClient(consulHost);

var config = {
  serviceName: 'users',
  endpoint: 'users/login',
  method: 'POST',
  body: {
    username: 'will',
    password: 'p@ssword'
  }
};

// Discovers an instance of the users service
// and POSTs user data to it's /users route.
serviceRequest(config)
  .then(console.log) // log successes
  .catch(console.log); // catch and log all errors
