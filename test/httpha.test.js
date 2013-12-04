/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

/* jshint immed: false */

"use strict";

var http = require('http');
var should = require('should');
var httpha = require('../');

describe('httpha interface', function () {

  /* {{{ should_basic_round_robin_works_fine() */
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

    setTimeout(function () {
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
      }, 100);
    }, 30);
  });
  /* }}} */

  it('should_all_server_done_works_fine', function (done) {
    var map = {'online' : false, 'offline' : false};
    var _me = httpha.create({
      'interval' : [10, 0],
    }, function (one, callback) {
      process.nextTick(function () {
        callback(null, map[one]);
      });
    });

    _me.add('online');
    _me.add('offline');

    _me.fetch().should.eql('online');
    _me.fetch().should.eql('offline');
    setTimeout(function () {
      _me.fetch().should.eql('online');
      _me.fetch().should.eql('offline');
      done();
    }, 30);
  });

});

describe('http status checker', function () {

  var S = http.createServer(function (req, res) {

    if ('/timeout' === req.url) {
      setTimeout(function () {
        res.end('timeout');
      }, 30);
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

    /* {{{ function wait() */
    var all = {};
    var wait = function (idx, cb) {
      all[idx] = true;
      
      var _fn = httpha.httpStatusChecker(idx, 20);
      _fn({'hostname' : '127.0.0.1', 'port' : P}, function (err, yes) {
        cb(err, yes);
        all[idx] = null;

        process.nextTick(function () {
          for (var i in all) {
            if (all[i]) {
              return;
            }
          }
          done();
        });
      });
    };
    /* }}} */

    wait('status', function (err, yes) {
      should.ok(!err);
      yes.should.eql(true);
    });

    wait('/timeout', function (err, yes) {
      err.should.have.property('name', 'RequestTimeout');
      err.message.should.eql('HeartBeat request "/timeout" timeout after 20ms');
      should.ok(!yes);
    });

    wait('/404', function (err, yes) {
      should.ok(!err);
      yes.should.eql(false);
    });
  });
});

