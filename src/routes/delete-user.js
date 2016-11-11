module.exports = function (app, User) {
    app.delete ('/users/:name', function (req, res) {
        User.findOneAndRemove ({
            username: req.params.name
        }, 
            function (err, username) {
                if (err) {
                    return res.status(500).json({
                        Message: "Internal server error"
                    });
                }

                if( {username: req.params.name} == null) {
                    return res.status(422).json ({
                        Message: 'User ' + req.params.name + ' doesn\'t exist!'
                    });
                }
                return res.status(201).json ({
                    Message: "user " + req.params.name + " deleted!"
                });
            });
    });
};