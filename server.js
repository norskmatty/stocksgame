var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var config = require('./config');
var User = require('./models/user-model');

var app = express();
var jsonParser = bodyParser.json();

app.use(express.static('public'));
app.use(bodyParser.json());

var runServer = function(callback) {
    mongoose.connect(config.DATABASE_URL, function(err) {
        if(err && callback) {
            return callback(err);
        }
        
        app.listen(config.PORT, function() {
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
    
    User.create({
        username : username,
        password : password
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












exports.app = app;
exports.runServer = runServer;