module.exports = function(app, passport, User, bcrypt) {

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
                        req.login(user, function(err) {
                            if(err) {
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
            }
        });
    });
};