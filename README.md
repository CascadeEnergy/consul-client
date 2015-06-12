# service-client
Client code for service discovery and invocation

## Example

```javascript
var serviceClient = require('service-client');

var consulHost = 'my.consul.com'; // e.g 172.x.x.x:8500
var consul = serviceClient(consulHost);

var config = {
  serviceName: 'users',
  endpoint: 'users',
  method: 'POST',
  body: {
    username: 'foo',
    password: 'bar'
  }
};

// Discovers an instance of the users service
// and POSTs user data to it's /users route.
consul(config)
  .then(console.log) // log successes
  .catch(console.log); // catch and log all errors
```
