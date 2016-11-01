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
        
    app.put('/stocks/sell', function(req, res) {
    var tempStock = req.body.stock;
    var tempNumber = req.body.updateAmount;
    var tempStocks = 0;
    var tempMoneySpent = 0;
    var tempExchange = '';
    
    User.find(
        {_id: req.session.passport.user}, function(err, doc) {
            if(err) {
                return console.log(err);
            }
            for (var i=0; i<doc[0].stocks.length;i++) {
                if(tempStock == doc[0].stocks[i].ticker) {
                    tempExchange = doc[0].stocks[i].exchange;
                    tempStocks = doc[0].stocks[i].shares - tempNumber;
                    if(tempStocks < 1) {
                        return res.json({
                            response: 'error',
                            message: 'Please enter a valid number of shares'
                            });
                    }
                    tempMoneySpent = doc[0].stocks[i].price * tempStocks;
                }
            }
            
            var query = tempExchange + '%3A' + tempStock;
            var searchReq = getFromApi(query);
    
    
            searchReq.on('end', function(item) {
                var stock = item.replace('//', ' ');
                stock = stock.trim();
                var parsed = JSON.parse(stock);
                var newPrice = parsed[0].l_fix;
                var moneyObtained = (parseFloat(newPrice) * parseFloat(tempNumber)).toFixed(2);
                var newMoney = (parseFloat(doc[0].money) + parseFloat(moneyObtained)).toFixed(2);
                console.log('newMoney on sell: ' + newMoney);
            
                User.update(
                    {_id: req.session.passport.user, "stocks.ticker" : tempStock},
                        {
                            $set: {
                                money: newMoney,
                                "stocks.$.shares" : tempStocks,
                                "stocks.$.moneyspent" : tempMoneySpent
                        }
                    },
                    function(err, doc) {
                    if(err) {
                        return console.err(err);
                    }
            
                    User.find(
                        {_id: req.session.passport.user}, function(err, doc) {
                            tempStocks = 0;
                            tempMoneySpent = 0;
                            tempNumber = 0;
                            tempStocks = '';
                            query = '';
                            if(err) {
                                return console.err(err);
                            }
                            return res.json(doc);
                            });
                        }
                    );
                });
            }    
        );
    });   
}; 