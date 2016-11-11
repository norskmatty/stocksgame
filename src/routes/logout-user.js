module.exports = function (app) {
    app.get ('/logout', function (req, res) {
        req.logOut();
        req.session.destroy();
        res.redirect('/');
    });
};