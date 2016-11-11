module.exports = function (app, User) {
    app.get ('/users', function (req, res) {
        User.find (function (err, users) {
            if (err) {
                res.json (err);
            }
            return res.status (201) .json (users);
        });
    });
};