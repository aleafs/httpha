/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

/* jshint immed: false */

"use strict";

var http = require('http');
var should = require('should');
var httpha = require('../');

describe('httpha interface', function () {

  it('should_basic_round_robin_works_fine', function (done) {

    var map = {'online' : true, 'offline' : true};
    var _me = httpha.create({
      'interval' : 10,
    }, function (one, callback) {
      process.nextTick(function () {
        callback(null, map[one]);
      });
    });

    (function () {
      _me.fetch();
    }).should.throw('EmptyServerListException');

    _me.add('online');
    _me.add('offline');

    var res = {'online' : 0, 'offline' : 0};
    for (var i = 0; i < 100; i++) {
      res[_me.fetch()]++;
    }
    res.should.eql({
      'online' : 50, 'offline' : 50,
    });

    map.offline = false;
    setTimeout(function () {
      var res = {'online' : 0, 'offline' : 0};
      for (var i = 0; i < 100; i++) {
        res[_me.fetch()]++;
      }
      res.should.eql({
        'online' : 100, 'offline' : 0,
      });
      done();
    }, 30);
  });

});

describe('http status checker', function () {

  var S = http.createServer(function (req, res) {

    if ('/timeout' === req.url) {
      setTimeout(function () {
        res.end('timeout');
      }, 100);
    } 
    else if ('/404' === req.url) {
      res.writeHead(404);
      res.end();
    }
    else {
      res.writeHead(200);
      res.end();
    }
  });

  var P = null;
  before(function(done) {
    S.listen(0, function (err) {
      should.ok(!err);
      P = this.address().port;
      done();
    });
  });

  after(function () {
    P = null;
    S.close();
  });

  it('should_http_status_checker_works_fine', function (done) {

    var _fn = httpha.httpStatusChecker('status', 20);
    _fn({'hostname' : '127.0.0.1', 'port' : P}, function (err, yes) {
      should.ok(!err);
      yes.should.eql(true);
      done();
    });
  });
});

