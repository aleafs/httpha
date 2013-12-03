/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

/* jshint immed: false */

"use strict";

var http = require('http');
var should = require('should');
var httpha = require('../');

describe('httpha interface', function () {

  var S = http.createServer(function (req, res) {
  });

  before(function (done) {
    done();
  });

  it('should_basic_api_works_fine', function (done) {
    var _me = httpha.create();
    _me.addserver('www.baidu.com', '80');
    _me.fetch().should.eql({
      'hostname' : 'www.baidu.com',
      'port' : 80,
    });

    setTimeout(done, 1000);
  });

});

