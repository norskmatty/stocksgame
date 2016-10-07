var socket_io = require('socket.io');
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var config = require('./config');
var unirest = require('unirest');
var events = require('events');
var User = require('./models/user-model');
var bcrypt = require('bcryptjs');
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var http = require('http');
var session = require('express-session');



var app = express();
var jsonParser = bodyParser.json();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(session ({
    secret: 'secret',
    saveUninitialized: false,
    resave: false
}));

var server = http.Server(app);
var io = socket_io(server);

var strategy = new BasicStrategy(function(username, password, callback) {
    User.findOne({
        username: username
    }, function(err, user) {
        if(err) {
            callback(err);
            return;
        }
        
        if(!user) {
            return callback(null, false, {
                message: 'Incorrect username.'  
            });
        }
        
        user.validatePassword(password, function(err, isValid) {
            if(err) {
                return callback(err);
            }
            
            if(!isValid) {
                return callback(null, false, {
                    message: 'Incorrect password'
                });
            }
            return callback(null, user);
        });
    });
});

passport.use(strategy);
app.use(passport.initialize());

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
    
        
        User.create({
            username : "Test",
            password: "test",
            stocks: [
        {
            "exchange" : "NASDAQ",
            "ticker" : "SBUX",
            "price" : "54.10",
            "shares" : "1000",
            "moneyspent" : "54100"
        },
        {
            "exchange" : "NASDAQ",
            "ticker" : "AAPL",
            "price" : "116.34",
            "shares" : "500",
            "moneyspent" : "58170"
        },
        {
            "exchange" : "NYSE",
            "ticker" : "T",
            "price" : "40.00",
            "shares" : "750",
            "moneyspent" : "30000"
        },
        {
            "exchange" : "NYSE",
            "ticker" : "SSW",
            "price" : "13.50",
            "shares" : "1200",
            "moneyspent" : "16200"
        }]
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

// GET, POST, PUT, DELETE

app.delete('/users/:name', function(req, res) {
    User.findOneAndRemove({username: req.params.name}, function(err, username) {
        if(err) {
            return res.status(500).json({
                Message: "Internal server error"
            });
        }
        
        if({username: req.params.name}==undefined) {
            return res.status(422).json({
                Message: 'User ' + req.params.name + ' doesn\'t exist!'
            });
        }
        return res.status(201).json({
            Message: "user " + req.params.name + " deleted!"
        });
    });
})
app.put('/users/:id')

app.get('/users/:id')

app.get('/users', function(req, res) {
    User.find(function(err, users) {
        return res.status(201).json(users);
    })
    
    console.log('GET users') 
});

//USER LOGS IN

app.get('/hidden', passport.authenticate('basic', {session: false}), function(req, res) {
    console.log(res.req.username);
    var sendUser = res.req.user;
    return res.json(sendUser);
});

app.get('/users/:username', function(req, res) {

    User.find({username: req.params.username}, function(err, doc) {
        if(err) {
            return console.err(err);
        }
            
        return res.json(doc);  
    });
    
        
});

app.post('/users', function(req, res) {
    if(!req.body) {
        return res.status(400).json({
            message: "no request"
        });
    }
    
    if(!('username' in req.body)) {
        return res.status(422).json({
            message: "Username missing"
        });
    }
    
    var username = req.body.username;
    console.log(username);
    
    if (typeof username !== 'string') {
        return res.status(422).json({
            message: 'Incorrect username field type'
        });
    }
    
    username = username.trim();
    
    if (username === '') {
        return res.status(422).json({
            message: 'Incorrect field length: username'
        });
    }
    
    if (!('password' in req.body)) {
        return res.status(422).json({
            message: 'Password missing'
        });
    }
    
    var password = req.body.password;
    console.log(password);
    
    if(typeof password !== 'string') {
        return res.status(422).json({
            message: 'Incorrect password field type'
        });
    }
    
    password = password.trim();
    
    if(password === '') {
        return res.status(422).json ({
            message: 'Incorrect field length: password'
        });
    }
    
    bcrypt.genSalt(10, function(err, salt) {
        if (err) {
            return res.status(500).json({
                message: 'Internal server error'
            });
        }
        
        bcrypt.hash(password, salt, function(err, hash) {
            if(err) {
                return res.status(500).json({
                    message: 'Internal server error'
                });
            }
            
            User.create({
                username : username,
                password : hash
                }, function(err, user) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Internal Server Error'
                        });
                    }
                    console.log(user);
                    return res.status(201).json(user);
            });
        });
    });
});

// API

var getFromApi = function(args) {
    var emitter = new events.EventEmitter();
    console.log(args);
    unirest.get('http://finance.google.com/finance/info?client=ig&q=' + args)
        .end(function(res) {
            if (res.ok) {
                emitter.emit('end', res.body);
            }
            else {
                emitter.emit('error', res.code);
            }
        });
    return emitter;
};

//GET FROM STOCK API

//app.get('/getstock/:exchange/:ticker', function(req, res) {
//    var query = req.params.exchange + '%3A' + req.params.ticker;
//    var searchReq = getFromApi(query);
//    
//    searchReq.on('end', function(item) {
//        var stock = item.replace('//', ' ');
//        stock = stock.trim();
//        var parsed = JSON.parse(stock);
//        return res.json(parsed[0]);
//    });
//    
//    searchReq.on('error', function(code) {
//        res.sendStatus(code);
//   });
//});

//ADD STOCK API

app.put('/addstock/:exchange/:ticker/:username/:shares', function(req, res) {
    var query = req.params.exchange + '%3A' + req.params.ticker;
    var searchReq = getFromApi(query);
    
    searchReq.on('end', function(item) {
        var stock = item.replace('//', ' ');
        stock = stock.trim();
        var parsed = JSON.parse(stock);
        var tempshares = req.params.shares;
        console.log(tempshares);
        var currentusername = req.params.username;
        var tempticker = parsed[0].t;
        var tempexchange = parsed[0].e;
        var tempprice = parsed[0].l_fix;
        var moneyspent = tempprice * tempshares;
        console.log(moneyspent);
        console.log(parsed[0]);
    
        User.update(
            { username: currentusername },
            {
                $push: {
                    stocks: {
                        ticker : tempticker,
                        exchange : tempexchange,
                        price : tempprice,
                        shares : tempshares,
                        moneyspent : moneyspent
                    }
                }
            }, 
            function(err, doc) {
                if (err) {
                    return console.err(err);
                }
                
                User.find({username: req.params.username}, function(err, doc) {
                    if (err) {
                        return console.err(err);
                    }
                    return res.json(parsed[0]);
                });
            }
        );
    
    });
});
//LOGOUT 

app.get('/logout', function(req, res) {
    req.logOut();
    req.session.destroy();
    res.redirect('/');
});

//UPDATE USING STREAM IO

io.on('connection', function(socket) {
    
    console.log('logged in');
    
    socket.on('update', function(sentData) {
        var stocksQuery = sentData.stocks[0].ticker;
        
        for (var i = 1; i<sentData.stocks.length; i++) {
            stocksQuery += ',' + sentData.stocks[i].ticker;
        }
        
        var searchReq = getFromApi(stocksQuery);
        
        searchReq.on('end', function(item) {
            var stock = item.replace('//', ' ');
            stock = stock.trim();
            var parsed = JSON.parse(stock);
            var trimmed = [];
            for (var i = 0; i < parsed.length; i++) {
                var temp = {
                    exchange: parsed[i].e,
                    ticker: parsed[i].t,
                    price: parsed[i].l_fix,
                    shares: sentData.stocks[i].shares,
                    moneyspent: sentData.stocks[i].moneyspent
                };
                trimmed[i] = temp;
            }
            User.find({username: sentData.username}, function(err, doc) {
                if (err) {
                    return console.err(err);
                }
                console.log(doc);
                socket.emit('returnUpdate', trimmed, doc);
            });
            console.log(trimmed);
        });
    
        searchReq.on('error', function(code) {
            socket.emit('returnUpdate', code);
        });
        
    });
    
    socket.on('userData', function(userData) {
        console.log(userData);
    });
});




exports.app = app;
exports.runServer = runServer;