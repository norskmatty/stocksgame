module.exports = function(app, User, events, unirest) {
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
    
    app.delete('/stocks/remove', function(req, res) {
    var tempStock = req.body.stock;
    var tempExchange = '';
    var tempStocks = 0;
    var tempMoneyHad = 0;
    User.find({_id: req.session.passport.user}, function(err, doc) {
        if(err) {
            res.json(err);
        }
        for (var i=0; i<doc[0].stocks.length; i++) {
            if(tempStock == doc[0].stocks[i].ticker) {
                tempExchange = doc[0].stocks[i].exchange;
                tempStocks = doc[0].stocks[i].shares;
                tempMoneyHad = doc[0].money;
            }
        }
        var query = tempExchange + '%3A' + tempStock;
        var searchReq = getFromApi(query);
    
        searchReq.on('end', function(item) {
            var stock = item.replace('//', ' ');
            stock = stock.trim();
            var parsed = JSON.parse(stock);
            var newPrice = parsed[0].l_fix;
            var tempMoneyGained = parseFloat(newPrice) * parseFloat(tempStocks);
            var moneyHave = (parseFloat(tempMoneyHad) + parseFloat(tempMoneyGained)).toFixed(2);
        
            User.update(
                {_id: req.session.passport.user},
                    {
                        $pull: {
                            stocks: {
                                ticker : tempStock
                            }
                        },
                        $set: {
                            money : moneyHave
                        }
                    },
                    function(err, doc) {
                        if(err) {
                            return console.err(err);
                        }
            
                        User.find(
                            {_id: req.session.passport.user}, function(err, doc) {
                                if(err) {
                                    return console.err(err);
                                }
                                return res.json(doc);
                            });
                        }
                    );
            });
        });
    });
};