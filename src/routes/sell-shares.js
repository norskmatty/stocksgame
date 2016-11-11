module.exports = function (app, User, events, unirest) {
    
"use strict";
    
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
        
    app.put ('/stocks/sell', function (req, res) {
    const tempStock = req.body.stock;
    const tempNumber = req.body.updateAmount;
    let tempStocks = 0;
    let tempMoneySpent = 0;
    let tempExchange = '';
    
    User.find(
        {_id: req.session.passport.user}, 
            function (err, doc) {
                if (err) {
                    return console.log (err);
                }
                doc[0].stocks.forEach((item) => {
                    if (tempStock == item.ticker) {
                        tempExchange = item.exchange;
                        tempStocks = item.shares - tempNumber;
                        if (tempStocks < 1) {
                            return res.json ({
                                response: 'error',
                                message: 'Please enter a valid number of shares'
                            });
                        }
                        tempMoneySpent = item.price * tempStocks;
                    }
                });
            
                var query = tempExchange + '%3A' + tempStock;
                var searchReq = getFromApi (query);
    
    
                searchReq.on ('end', function (item) {
                    var stock = item.replace('//', ' ');
                    stock = stock.trim();
                    var parsed = JSON.parse(stock);
                    const newPrice = parsed[0].l_fix;
                    const moneyObtained = (parseFloat(newPrice) * parseFloat(tempNumber)).toFixed(2);
                    const newMoney = (parseFloat(doc[0].money) + parseFloat(moneyObtained)).toFixed(2);
            
                    User.update(
                        {
                            _id: req.session.passport.user, 
                            'stocks.ticker' : tempStock
                            
                        },
                        {
                            $set: {
                                money: newMoney,
                                'stocks.$.shares' : tempStocks,
                                'stocks.$.moneyspent' : tempMoneySpent
                        }
                    },
                    function (err, doc) {
                        if (err) {
                            return console.err (err);
                        }
            
                        User.find(
                            {_id: req.session.passport.user}, 
                                function (err, doc) {
                                    if (err) {
                                        return console.err(err);
                                    }
                                    return res.json (doc);
                                });
                            }
                        );
                    });
                }    
        );
    });   
}; 