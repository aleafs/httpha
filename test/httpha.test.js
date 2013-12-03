/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

/* jshint immed: false */

"use strict";

var http = require('http');
var should = require('should');
var httpha = require('../');

describe('httpha interface', function () {

  var onlines = {};
  var servers = [];

  var _kfirst = function (o) {
    for (var i in o) {
      return i;
    }
  }

  var _handle = function (req, res) {
    res.writeHead(onlines[this.address().port]);
    res.end('hello world');
  };

  /* {{{ private function before() */
  before(function (done) {
    var N = 2;
    var next = function () {
      if (0 === (--N)) {
        done();
      }
    };

    onlines = {};
    servers = [];
    for (var i = 0; i < N; i++) {
      var S = http.createServer(_handle);
      S.listen(0, function (err) {
        should.ok(!err);
        onlines[this.address().port] = 200;
        next();
      });
      servers.push(S);
    }
  });
  /* }}} */

  /* {{{ private function after() */
  after(function (done) {
    servers.forEach(function (s) {
      s.close();
    });
    servers = [];
    onlines = {};
    done();
  });
  /* }}} */

  /* {{{ should_basic_api_works_fine() */
  it('should_basic_api_works_fine', function (done) {
    var _me = httpha.create({
      'mininterval' : 10,
      'maxinterval' : 50,
    });

    Object.keys(onlines).forEach(function (p) {
      _me.addserver('127.0.0.1', p);
    });

    var res = {};
    for (var i = 0; i < 100; i++) {
      var p = _me.fetch().port;
      if (!res[p]) {
        res[p] = 1;
      } else {
        res[p]++;
      }
    }

    Object.keys(onlines).forEach(function (p) {
      res[p].should.eql(50);
    });

    onlines[_kfirst(onlines)] = 302;
    setTimeout(function () {
      var res = {};
      for (var i = 0; i < 100; i++) {
        var p = _me.fetch().port;
        if (!res[p]) {
          res[p] = 1;
        } else {
          res[p]++;
        }
      }

      should.not.exists(res[_kfirst(onlines)]);
      Object.keys(onlines).forEach(function (p) {
        if (p !== _kfirst(onlines)) {
          res[p].should.eql(100);
        }
      });

      done();
    }, 100);
  });
  /* }}} */

  /* {{{ should_all_server_done_works_fine() */
  it('should_all_server_done_works_fine', function () {
    var _me = httpha.create({
      'mininterval' : 10,
      'maxinterval' : 50,
      'statusurl' : 'if_online',
    });

    (function () {
      _me.fetch();
    }).should.throw('EmptyServerListException');

    Object.keys(onlines).forEach(function (p) {
      onlines[p] = 404;
      _me.addserver('127.0.0.1', p);
    });

    var res = {};
    for (var i = 0; i < 100; i++) {
      var p = _me.fetch().port;
      if (!res[p]) {
        res[p] = 1;
      } else {
        res[p]++;
      }
    }

    Object.keys(onlines).forEach(function (p) {
      res[p].should.eql(50);
    });

  });
  /* }}} */

});

