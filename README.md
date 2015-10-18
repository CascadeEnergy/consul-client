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

## Upgrade Path 3.0.0 to 4.0.0

The `3.0.0` version of `consul-client` depended on a module called `got-promise` which returned promises backed by the
expanded `bluebird` API for promises. The `got-promise` module is now deprecated because `got` supports promises by
default now. Version `4.0.0` of `consul-client` now depends directly on `got`, but because `got` uses `pinkie-promise`
as a Promise polyfill instead of `bluebird`, any code which used version `3.0.0` of `consul-client` and took advantage
of any features of `bluebird` promises will now not work. To fix this issue you can either not use any of the cool
features of `bluebird` or you can explicitly wrap all of your calls to `consul-client` manually with `Bluebird.resolve`.

```javascript
import Bluebird from 'bluebird';
import consulClient from 'consul-client';

function consulRequestBluebirdDecorator(consulRequest) {
  return function(config) {
    return Bluebird.resolve(consulRequest(config));
  }
}

const consulHost = 'my.consul.com'; // e.g 172.x.x.x:8500
const consulRequest = consulRequestBluebirdDecorator(consulClient(consulHost));

// Discovers an instance of the users service
// and POSTs body to it's /users/login route.
consulRequest(config)
    .map(console.log) // USE BLUEBIRD!!! map and log successes
    .catch(console.log); // catch and log all errors
```

For convenience this wrapper is provided for you, just change
all of your `require('consul-client')` to `require('consul-client/bluebird')`.
