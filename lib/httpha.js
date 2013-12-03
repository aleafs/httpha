/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var http = require('http');

exports.create = function (options) {

  var _options = {
    'statusurl' : '/status.ok',
    'mininterval' : 5000,
    'maxinterval' : 300000,
  };
  for (var i in options) {
    if (options[i]) {
      _options[i] = options[i];
    }
  }

  _options.mininterval = _options.mininterval - 0;
  _options.maxinterval = _options.maxinterval - 0;
  if ('/' !== _options.statusurl.substring(0, 1)) {
    _options.statusurl = '/' + _options.statusurl;
  }

  var _backup = [];

  var _online = [];

  var _reqnum = -1;

  var _interval = _options.mininterval;

  /* {{{ function heartbeat() */
  var heartbeat = function (one) {

    var options = {
      'hostname' : one.hostname,
      'port' : one.port,
      'path' : _options.statusurl,
      'method' : 'HEAD',
    };

    var next = function () {
      setTimeout(function () {
        heartbeat(one);
      }, _interval);

      if (_interval < _options.maxinterval) {
        _interval = Math.min(2 * _interval, _options.maxinterval);
      }
    };

    var req = http.request(options, function (res) {
      var ret = res.statusCode - 0;
      var pos = _online.indexOf(one);
      if (ret >= 200 && ret < 300) {
        if (pos < 0) {
          _online.push(one);
        }
      } else {
        if (pos > -1) {
          _online = _online.filter(function (x, p) {
            return p !== pos;
          });
        }
      }

      next();
    });

    req.on('error', function (err) {
      next();
    });

    req.end();
  };
  /* }}} */

  var _me = {};

  _me.addserver = function (host, port) {
    var one = {
      'hostname' : host, 
      'port' : port
    };
    _backup.push(one);
    heartbeat(one);
  };

  _me.fetch = function () {
    _reqnum++;
    if (_interval > _options.mininterval) {
      _interval = Math.max(_options.mininterval, parseInt(_interval / 2, 10));
    }
    if (_online.length > 0) {
      return _online[_reqnum % _online.length];
    }

    if (_backup.length > 0) {
      return _backup[_reqnum % _backup.length];
    }

    throw new Error('EmptyServerListException');
  };

  return _me;
};

