module.exports = function(socket, app, User, events, unirest) {
    socket.on('update', function(sentData) {
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
};