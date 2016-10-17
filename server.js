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
var LocalStrategy = require('passport-local').Strategy;
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

var strategy = new LocalStrategy(function(username, password, callback) {
    User.findOne({
        username: username
    }, function(err, user) {
        if(err) {
            callback(err);
            return;
        }
    
        if(!user) {
            return callback(null, false, {
                response: 'error',
                message: 'Incorrect username.'  
            });
        }
    
        user.validatePassword(password, function(err, isValid) {
            if(err) {
                return callback(err);
            }
        
            if(!isValid) {
                return callback(null, false, {
                    response: 'error',
                    message: 'Incorrect password'
                });
            }
            return callback(null, user);
        });
    });
});

passport.use(strategy);
app.use(passport.initialize());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

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

// DELETE A USER

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


app.get('/users', function(req, res) {
    User.find(function(err, users) {
        if(err) {
            res.json(err);
        }
        return res.status(201).json(users);
    })
    
    console.log('GET users') 
});


//LOCAL STRATEGY USER LOGIN

/**
 * 1) passport.authenticate('local') should be used as 2nd argument of the function
 *    app.get(..) so you'd rather have app.get('/login', passport..., function(req, res) { ... })
 * 
 * 2) passort.authenticate() will rather not have a callback here - it'll be in the config -
 *    take a look at the line 32 when you have basic auth strategy - it's actually the same 
 *    with the local strategy in case of the code architecture
 */
app.post('/login', passport.authenticate('local'), function(req, res) {
    if(req.response == "error") {
        return res.json(req);
    }
    else {
        var sendUser = req.user;
        return res.json(sendUser);
    }
    
});

//GET A LIST OF USERS IN THE CONSOLE

app.get('/users/:username', function(req, res) {

    User.find({username: req.params.username}, function(err, doc) {
        if(err) {
            return console.err(err);
        }
            
        return res.json(doc);  
    });
    
        
});

//CREATE NEW ACCOUNT

app.post('/users', function(req, res) {
    if(!req.body) {
        return res.status(400).json({
            response: 'error',
            message: "no request"
        });
    }
    
    if(!('username' in req.body)) {
        return res.status(422).json({
            response: 'error',
            message: "Username missing"
        });
    }
    
    var username = req.body.username;
    console.log(username);
    
    if (typeof username !== 'string') {
        return res.status(422).json({
            response: 'error',
            message: 'Incorrect username field type'
        });
    }
    
    username = username.trim();
    
    if (username === '') {
        return res.status(422).json({
            response: 'error',
            message: 'Incorrect field length: username'
        });
    }
    
    User.find({username: username}, function(err, doc) {
        if(err) {
            return console.err(err);
        }
        if(doc.length > 0) {
            return res.json({
            response: 'error',
            message: 'Username already exists'
            });
        }
        else {
            
            if (!('password' in req.body)) {
                return res.status(422).json({
                    response: 'error',
                    message: 'Password missing'
                });
            }
    
            var password = req.body.password;
            console.log(password);
    
            if(typeof password !== 'string') {
                return res.status(422).json({
                    response: 'error',
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
                    password : hash,
                    money : 100000.00
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
        }
    });
});

// API

var getFromApi = function(args) {
    var emitter = new events.EventEmitter();
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

//ADD STOCK

app.put('/stocks/add', function(req, res) {
    User.find(
        {username: req.body.user}, function(err, doc) {
            if(err) {
                return res.json(err);
            }
            
            for (var i=0; i<doc[0].stocks.length; i++) {
                if(req.body.ticker == doc[0].stocks[i].ticker) {
                   return res.json({
                       response: 'error',
                       message: 'You already own this stock'
                   }); 
                }
            }

            var query = req.body.exchange + '%3A' + req.body.ticker;
            var searchReq = getFromApi(query);
        
            searchReq.on('error', function(item) {
                return res.json({
                    response: 'error',
                    message: 'Please enter a valid stock ticker for the chosen exchange'
                });
            });
    
            searchReq.on('end', function(item) {
                var stock = item.replace('//', ' ');
                stock = stock.trim();
                var parsed = JSON.parse(stock);
                var tempshares = req.body.shares;
                var currentusername = req.body.user;
                var tempticker = parsed[0].t;
                var tempexchange = parsed[0].e;
                var tempprice = parsed[0].l_fix;
                var moneyspent = parseFloat(tempprice * tempshares).toFixed(2);
    
                User.find(
                    {username: currentusername}, function(err, doc) {
                        if(err) {
                            return res.json(err);
                        }
            
                    var moneyHad = parseFloat(doc[0].money);
                    console.log('moneyHad: ' + doc[0].money);
                    var moneyHave = (parseFloat(moneyHad) - parseFloat(moneyspent)).toFixed(2);
                        if(moneyHave < 0) {
                            return res.json({
                                response: 'error',
                                message: 'You do not have enough money to complete this buy'
                            });
                        }
                        else {
                            User.update(
                                {username: currentusername},
                                    {
                                        $push: {
                                            stocks: {
                                                ticker : tempticker,
                                                exchange : tempexchange,
                                                price : tempprice,
                                                shares : tempshares,
                                                moneyspent : moneyspent
                                            }
                                        },
                                        $set: {
                                            money : moneyHave
                                        }
                                }, 
                                function(err, doc) {
                                    if (err) {
                                        return res.json(err);
                                    }
                
                                    User.find({username: currentusername}, function(err, doc) {
                                        if (err) {
                                            return res.json(err);
                                        }
                                        return res.json({
                                            response: parsed[0],
                                            money: moneyHave
                                        });
                                    });
                                }
                            );
                        }
                    }
                );
            });
        }
    );
});        

    

//LOGOUT 

app.get('/logout', function(req, res) {
    req.logOut();
    req.session.destroy();
    res.redirect('/');
});

//REMOVE STOCK

app.delete('/stocks/remove', function(req, res) {
    var tempStock = req.body.stock;
    var tempExchange = '';
    var tempStocks = 0;
    var tempMoneyHad = 0;
    User.find({username: req.body.user}, function(err, doc) {
        if(err) {
            res.json(err);
        }
        for (var i=0; i<doc[0].stocks.length; i++) {
            if(tempStock == doc[0].stocks[i].ticker) {
                tempExchange = doc[0].stocks[i].exchange;
                tempStocks = doc[0].stocks[i].shares;
                tempMoneyHad = doc[0].money;
            }
        }
        var query = tempExchange + '%3A' + tempStock;
        var searchReq = getFromApi(query);
    
        searchReq.on('end', function(item) {
            var stock = item.replace('//', ' ');
            stock = stock.trim();
            var parsed = JSON.parse(stock);
            var newPrice = parsed[0].l_fix;
            var tempMoneyGained = parseFloat(newPrice) * parseFloat(tempStocks);
            var moneyHave = (parseFloat(tempMoneyHad) + parseFloat(tempMoneyGained)).toFixed(2);
        
            User.update(
                {username: req.body.user},
                    {
                        $pull: {
                            stocks: {
                                ticker : tempStock
                            }
                        },
                        $set: {
                            money : moneyHave
                        }
                    },
                    function(err, doc) {
                        if(err) {
                            return console.err(err);
                        }
            
                        User.find(
                            {username: req.body.user}, function(err, doc) {
                                if(err) {
                                    return console.err(err);
                                }
                                return res.json(doc);
                        });
                    }
                
                );
        });
    });
    
    
});

//SELLING PARTIAL STOCK

app.put('/stocks/sell', function(req, res) {
    var tempStock = req.body.stock;
    var tempNumber = req.body.updateAmount;
    var tempStocks = 0;
    var tempMoneySpent = 0;
    var tempExchange = '';
    
    User.find(
        {username: req.body.user}, function(err, doc) {
            if(err) {
                return console.log(err);
            }
            for (var i=0; i<doc[0].stocks.length;i++) {
                if(tempStock == doc[0].stocks[i].ticker) {
                    tempExchange = doc[0].stocks[i].exchange;
                    tempStocks = doc[0].stocks[i].shares - tempNumber;
                    if(tempStocks < 1) {
                        return res.json(err);
                    }
                    tempMoneySpent = doc[0].stocks[i].price * tempStocks;
                }
            }
            
            var query = tempExchange + '%3A' + tempStock;
            var searchReq = getFromApi(query);
    
    
            searchReq.on('end', function(item) {
                var stock = item.replace('//', ' ');
                stock = stock.trim();
                var parsed = JSON.parse(stock);
                var newPrice = parsed[0].l_fix;
                var moneyObtained = (parseFloat(newPrice) * parseFloat(tempNumber)).toFixed(2);
                var newMoney = (parseFloat(doc[0].money) + parseFloat(moneyObtained)).toFixed(2);
                console.log('newMoney on sell: ' + newMoney);
            
                User.update(
                    {username: req.body.user, "stocks.ticker" : tempStock},
                        {
                            $set: {
                                money: newMoney,
                                "stocks.$.shares" : tempStocks,
                                "stocks.$.moneyspent" : tempMoneySpent
                        }
                    },
                    function(err, doc) {
                    if(err) {
                        return console.err(err);
                    }
            
                    User.find(
                        {username: req.body.user}, function(err, doc) {
                            tempStocks = 0;
                            tempMoneySpent = 0;
                            tempNumber = 0;
                            tempStocks = '';
                            query = '';
                            if(err) {
                                return console.err(err);
                            }
                            return res.json(doc);
                        });
                    }
                );
            });
        }    
    );
});

//BUYING ADDITIONAL SHARES

/**
 
    app.get('/shares/')
    app.get('/shares/:id')
    app.delete('/shares/:id')
    app.post('/shares', function(req, res) {})
    app.put('/shares/:id', function(req, res) {})

*/

app.put('/stocks/buy', function(req, res) {
    if(!('stock' in req.body)) {
        return res.json({
            response: 'error',
            message: 'No stock entered'
        });
    }
    
    if(!('updateAmount' in req.body)) {
        return res.json({
            response: 'error',
            message: 'Please enter number of stocks to buy'
        });
    }
    
    var tempStock = req.body.stock;
    var tempNumber = req.body.updateAmount;
    var tempStocks = 0;
    var tempMoneySpent = 0;
    var tempprice = 0;
    var originalMoneySpent = 0;
    var tempNewMoneySpent = 0;
    var currentuser = req.body.user;
    var newCostAveragedPrice = 0;
    var newMoney = 0;
    
    User.find(
        {username: currentuser}, function(err, doc) {
            if(err) {
                return console.log(err);
            }
            for (var i=0; i<doc[0].stocks.length;i++) {
                if(tempStock == doc[0].stocks[i].ticker) {
                    tempStocks = parseInt(doc[0].stocks[i].shares) + parseInt(tempNumber);
                    if(tempStocks < 1) {
                        return console.err(err);
                    }
                    var query = doc[0].stocks[i].exchange + '%3A' + tempStock;
                    originalMoneySpent = parseFloat(doc[0].stocks[i].moneyspent);
                    var searchReq = getFromApi(query);
    
                    searchReq.on('end', function(item) {
                        var stock = item.replace('//', ' ');
                        stock = stock.trim();
                        var parsed = JSON.parse(stock);
                        tempprice = parsed[0].l_fix;
                        tempNewMoneySpent = parseFloat(tempNumber * tempprice).toFixed(2);
                        tempMoneySpent = (parseFloat(originalMoneySpent) + parseFloat(tempNewMoneySpent)).toFixed(2);
                        newCostAveragedPrice = (parseFloat(tempMoneySpent) / parseFloat(tempStocks)).toFixed(2);
                        newMoney = (parseFloat(doc[0].money) - parseFloat(tempNewMoneySpent)).toFixed(2);
                        console.log('newMoney on buy: ' + newMoney);
                        if(newMoney < 0) {
                            return res.json ({
                                response: 'error',
                                message: 'You do not have enough money to buy these shares'
                            });
                        }
                        
                        User.update(
                            {username: currentuser, "stocks.ticker" : tempStock},
                                {
                                    $set: {
                                        money : newMoney,
                                        "stocks.$.shares" : tempStocks,
                                        "stocks.$.price" : newCostAveragedPrice,
                                        "stocks.$.moneyspent" : tempMoneySpent
                                    }
                                },
                                function(err, doc) {
                                    if(err) {
                                        return console.err(err);
                                    }
            
                                User.find(
                                    {username: currentuser}, function(err, doc) {
                                        if(err) {
                                            return console.err(err);
                                        }
                                        query = '';
                                        return res.json(doc);
                                        
                                });
                            }
                        );
                    });
                }
            }
        }    
    );
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
                socket.emit('returnUpdate', trimmed, doc);
            });
        });
    
        searchReq.on('error', function(code) {
            socket.emit('returnUpdate', code);
        });
        
    });
    
    socket.on('userData', function(userData) {
        console.log(userData);
    });
    
    
    //socket.on('trash', function() {
    //    console.log('clicked');
    //})
});




exports.app = app;
exports.runServer = runServer;