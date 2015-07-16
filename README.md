# consul-client [![Build Status](https://travis-ci.org/CascadeEnergy/consul-client.svg)](https://travis-ci.org/CascadeEnergy/consul-client)
Client code for service discovery and invocation

## Example

```javascript
'use strict';

var consulClient = require('consul-client');

var consulHost = 'my.consul.com'; // e.g 172.x.x.x:8500
var consulRequest = consulClient(consulHost);

var config = {
  serviceName: 'users',
  version: '1.0.0',
  endpoint: 'users/login',
  method: 'POST',
  body: {
    username: 'will',
    password: 'p@ssword'
  }
};

// Discovers an instance of the users service
// and POSTs body to it's /users/login route.
consulRequest(config)
  .then(console.log) // log successes
  .catch(console.log); // catch and log all errors
```
