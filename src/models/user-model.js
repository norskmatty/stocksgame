var mongoose = require('mongoose');

var mongodbUri = 'heroku_4b97q3b3:545gsgbdm0ud92evb3btcq7015@ds151927.mlab.com:51927/heroku_4b97q3b3/db';

mongoose.connect(mongodbUri);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function callback () {

var UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    money: {
        type: String,
        required: true
    },
    stocks: {
        type: Array,
        required: false
    }
});


var bcrypt = require('bcryptjs');

UserSchema.methods.validatePassword = function(password, callback) {
    bcrypt.compare(password, this.password, function(err, isValid) {
        if(err) {
            callback(err);
            return;
        }
        callback(null, isValid);
    });
};

var User = mongoose.model('User', UserSchema);

module.exports = User;

});
