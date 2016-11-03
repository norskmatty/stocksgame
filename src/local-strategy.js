var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user-model');

module.exports = new LocalStrategy(function(username, password, callback) {
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
                message: 'Incorrect username'  
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