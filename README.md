[![Build Status](https://secure.travis-ci.org/aleafs/httpha.png?branch=master)](http://travis-ci.org/aleafs/httpha)
[![Coverage Status](https://coveralls.io/repos/aleafs/httpha/badge.png)](https://coveralls.io/r/aleafs/httpha)

## About

`httpha` is a simple client-side load balance and HA module.

## Usage

```javascript

var httpha = require('httpha');

var ha = httpha.create({
  'interval' : 1000,
}, httpha.httpStatusChecker('/status', {
  'timeout' : 1000,
}));

ha.add({'hostname' : '127.0.0.1', 'port' : 8080});
ha.add({'hostname' : '127.0.0.2', 'port' : 8080});
ha.add({'hostname' : '127.0.0.1', 'port' : 8081});

console.log(ha.fetch());
console.log(ha.fetch());

```

## License

MIT

