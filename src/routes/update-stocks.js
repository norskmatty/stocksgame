module.exports = function (socket, app, User, events, unirest) {

"use strict";    
    
    socket.on ('update', function (sentData) {
        var getFromApi = function (args) {   
        var emitter = new events.EventEmitter();
        unirest.get ('http://finance.google.com/finance/info?client=ig&q=' + args)
            .end (function (res) {
                if (res.ok) {
                    emitter.emit ('end', res.body);
                }
                else {
                    emitter.emit ('error', res.code);
                }
            });
            return emitter;
        };
        
        let stocksQuery = sentData.stocks[0].ticker;
        
        sentData.stocks((item) => {
            stocksQuery += ',' + item.ticker;
        });
        
        var searchReq = getFromApi (stocksQuery);
        
        searchReq.on ('end', function (item) {
            var stock = item.replace ('//', ' ');
            stock = stock.trim();
            var parsed = JSON.parse (stock);
            let trimmed = [];
            for (let i = 0; i < parsed.length; i++) {
                let temp = {
                    exchange: parsed[i].e,
                    ticker: parsed[i].t,
                    price: parsed[i].l_fix,
                    shares: sentData.stocks[i].shares,
                    moneyspent: sentData.stocks[i].moneyspent
                };
                trimmed[i] = temp;
            }
            User.find(
                {username: sentData.username}, 
                    function (err, doc) {
                    if (err) {
                        return console.err (err);
                    }
                    socket.emit ('returnUpdate', trimmed, doc);
                });
            });
    
            searchReq.on ('error', function (code) {
                socket.emit ('returnUpdate', code);
            });
        
    });
};