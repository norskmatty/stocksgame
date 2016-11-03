global.DATABASE_URL = 'mongodb://localhost/stocks-test';

var chai = require('chai');
var chaiHttp = require('chai-http');

var server = require('../server.js');
var User = require('../src/models/user-model.js');

var should = chai.should();
var app = server.app;
var expect = require('chai').expect;

chai.use(chaiHttp);

describe ('Front Page', function() {
    
    before(function(done) {
        server.runServer(function() {
            User.create({
                _id: '12345',
                username: 'test',
                password: '$2a$10$/eFyhAfsxWOji9HGrNrkL.jN6HoupBUF3myPpJnPPq4LM6j926WUu',
                money: '90000.00',
                stocks: [
                    {
                        ticker: 'AAPL',
                        price: '100.00',
                        exchange: 'NASDAQ',
                        shares: 50
                    },
                    {
                        ticker: 'SBUX',
                        price: '50.00',
                        exchange: 'NASDAQ',
                        shares: 25
                    }
                ]
            },
            function() {
                done();
            });
        });
    });
    
    after(function(done) {
        User.remove(function() {
            done();
        });
    });
    
    it('should have status 200', function(done) {
        chai.request(app)
        .get('/')
        .end(function(err, res) {
            should.equal(err,null);
            res.should.have.status(200);
            done();
        });
    });
    
    it('should create a new user', function(done) {
        chai.request(app)
        .post('/new-user')
        .send({
            username: 'newUser',
            password: 'password'
        })
        .end(function(err, res) {
            should.equal(err,null);
            res.should.have.status(201);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('username');
            res.body.should.have.property('password');
            res.body.should.have.property('money');
            res.body.should.have.property('stocks');
            res.body.username.should.be.a('string');
            res.body.username.should.equal('newUser');
            res.body.password.should.be.a('string');
            res.body.password.should.not.equal('password');
            res.body.money.should.be.a('string');
            res.body.money.should.equal('100000');
            res.body.stocks.should.be.a('array');
            done();
        });
    });
    
    it('should not create a new user with same username', function(done) {
        chai.request(app)
        .post('/new-user')
        .send({
            username: 'newUser',
            password: 'password'
        })
        .end(function(err, res) {
            res.should.be.json;
            res.body.should.have.property('response');
            res.body.should.have.property('message');
            res.body.response.should.equal('error');
            res.body.message.should.equal('Username already exists');
            done();
        });
    });
    
    it('should not create a new user with no username', function(done) {
        chai.request(app)
        .post('/new-user')
        .send({
            username: '',
            password: 'password'
        })
        .end(function(err, res) {
            res.should.be.json;
            res.should.have.status(200);
            res.body.should.have.property('response');
            res.body.should.have.property('message');
            res.body.response.should.equal('error');
            res.body.message.should.equal('Incorrect field length: username');
            done();
        });
    });
    
        it('should not create a new user with no password', function(done) {
        chai.request(app)
        .post('/new-user')
        .send({
            username: 'john',
            password: ''
        })
        .end(function(err, res) {
            res.should.be.json;
            res.should.have.status(200);
            res.body.should.have.property('response');
            res.body.should.have.property('message');
            res.body.response.should.equal('error');
            res.body.message.should.equal('Incorrect field length: password');
            done();
        });
    });
    
    it('should log in an existing user', function(done) {
        chai.request(app)
        .post('/login')
        .send({
            username: 'newUser',
            password: 'password'
        })
        .end(function(err, res) {
            should.equal(err,null);
            res.should.have.status(200);
            res.should.be.a('object');
            res.body.should.have.property('username');
            res.body.should.have.property('password');
            res.body.should.have.property('money');
            res.body.should.have.property('stocks');
            res.body.username.should.equal('newUser');
            res.body.username.should.be.a('string');
            res.body.password.should.be.a('string');
            res.body.password.should.not.equal('password');
            res.body.money.should.be.a('string');
            res.body.money.should.equal('100000');
            res.body.stocks.should.be.a('array');
            res.body.stocks.should.have.length('0');
            done();
        });
    });
    
    it('should not log in user that does not exist', function(done) {
        chai.request(app)
        .post('/login')
        .send({
            username: 'doesNotExist',
            password: 'password'
        })
        .end(function(err, res) {
            res.should.have.status(401);
            done();
        })
    })
    
    it('should buy a new stock', function(done) {
        var agent = chai.request.agent(app);
        agent
        .post('/login')
        .send({
            username: 'newUser',
            password: 'password'
        })
        .then(function(res) {
            expect(res).to.have.cookie('session');
            return agent.put('/stocks/add')
            .send({
                exchange: 'NASDAQ',
                ticker: 'GOOG',
                shares: 10
            })
            .then(function(res) {
                expect(res).to.be.a('object');
                done();
            });
        });
        done();
    });
    
});


