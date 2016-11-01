global.DATABASE_URL = 'mongodb://localhost/stocks-test';

var chai = require('chai');
var chaiHttp = require('chai-http');

var server = require('../server.js');
var main = require('../public/main.js');
var User = require('../models/user.js');

var should = chai.should();
var app = server.app;
var runServer = server.runServer;

chai.use(chaiHttp);

describe ('Front Page', function() {
    it('should have status 200', function(done) {
        chai.request(app)
        .get('/')
        .end(function(err, res) {
            res.should.have.status(200);
            done();
        });
    });
    
    
});
