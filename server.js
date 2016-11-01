var socket_io = require('socket.io');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
var config = require('./config');
var unirest = require('unirest');
var events = require('events');
var User = require('./src/models/user-model');
var bcrypt = require('bcryptjs');
var passport = require('passport');
var http = require('http');
var session = require('express-session');
//var passportSocketIo = require('passport.socketio');
//var MongoStore = require('connect-mongo-store')(session);
//var mongoStore = new MongoStore('mongodb://localhost:8080/workspace/stocks-dev');


var app = express();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser('secret'));
app.use(session ({
    secret: 'secret',
    saveUninitialized: true,
    resave: false,
//  store: mongoStore
}));

var server = http.Server(app);
var io = socket_io(server);

//io.use(passportSocketIo.authorize({
//  key: 'connect.sid',
//  secret: process.env.SECRET_KEY_BASE,
//  passport: passport,
//  store: mongoStore,
//  cookieParser: cookieParser
//}));


var strategy = require('./src/local-strategy');  //localstrategy for login module

passport.use(strategy);
app.use(passport.initialize());
app.use(passport.session());

// SERVER
var runServer = function(callback) {
    mongoose.connect(config.DATABASE_URL, function(err) {
        if(err && callback) {
            return callback(err);
        }
        
        server.listen(config.PORT, function() {
            console.log('Listening on localhost:' + config.PORT);
            if (callback) {
                callback();
            }
        });
        
    });
};

if (require.main === module) {
    runServer(function(err){
        if (err) {
            console.error(err);
        }
    });
}

//PASSPORT SESSION SERIALIZE

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
    done(err, user);
    });
});
    
require('./src/routes/login')(app, passport);  //existing user login module
require('./src/routes/logout-user')(app);  //logout currently logged in user
require('./src/routes/new-user')(app, passport, User, bcrypt);  //new user creation module
require('./src/routes/add-stock')(app, User, events, unirest);  //add new stock to portfolio module
require('./src/routes/buy-shares')(app, User, events, unirest);  //buy additional shares of already owned stock
require('./src/routes/delete-stock')(app, User, events, unirest);  //delete and sell all shares of stock module
require('./src/routes/sell-shares')(app, User, events, unirest);  //sell partial amount of shares of stock module
require('./src/routes/delete-user')(app, User);  //delete a user from the database
require('./src/routes/get-users')(app, User);  //gets a list of users printed to the console 

//UPDATE USING STREAM IO

io.on('connection', function(socket) {
    console.log('logged in');
    require('./src/routes/update-stocks.js')(socket, app, User, events, unirest);
    socket.on('userData', function(userData) {
        console.log(userData);
    });
});

exports.app = app;
exports.runServer = runServer;