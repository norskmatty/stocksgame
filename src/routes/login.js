module.exports = function(app, passport) {
    app.post('/login', passport.authenticate('local'), function(req, res) {
        
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
        
        if(req.response == "error") {
            return res.json(req);
        }
        else {
            console.log('/login', req.session);
            console.log('req.session.passport.user', req.session.passport.user);
            var sendUser = req.user;
            return res.json(sendUser);
        }
        
    });
};