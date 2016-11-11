module.exports = function(app, User, events, unirest) {
    
"use strict";
    
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
    
    app.put('/stocks/buy', function(req, res) {
    if(!('stock' in req.body)) {
        return res.json({
            response: 'error',
            message: 'No stock entered'
        });
    }
    
    if(!('updateAmount' in req.body)) {
        return res.json({
            response: 'error',
            message: 'Please enter number of stocks to buy'
        });
    }
    
    const tempStock = req.body.stock;
    const tempNumber = req.body.updateAmount;
    let tempStocks = 0;
    let tempMoneySpent = 0;
    let tempprice = 0;
    let originalMoneySpent = 0;
    let tempNewMoneySpent = 0;
    let newCostAveragedPrice = 0;
    let newMoney = 0;
    
    User.find(
        {_id: req.session.passport.user}, function(err, doc) {
            if(err) {
                return console.log(err);
            }
            doc[0].stocks.forEach((item) => {
                if(tempStock == item.ticker) {
                    tempStocks = parseInt(item.shares) + parseInt(tempNumber);
                    if(tempStocks < 1) {
                        return console.err(err);
                    }
                    var query = item.exchange + '%3A' + tempStock;
                    originalMoneySpent = parseFloat(item.moneyspent);
                    var searchReq = getFromApi(query);
    
                    searchReq.on('end', function(item) {
                        var stock = item.replace('//', ' ');
                        stock = stock.trim();
                        var parsed = JSON.parse(stock);
                        tempprice = parsed[0].l_fix;
                        tempNewMoneySpent = parseFloat(tempNumber * tempprice).toFixed(2);
                        tempMoneySpent = (parseFloat(originalMoneySpent) + parseFloat(tempNewMoneySpent)).toFixed(2);
                        newCostAveragedPrice = (parseFloat(tempMoneySpent) / parseFloat(tempStocks)).toFixed(2);
                        newMoney = (parseFloat(doc[0].money) - parseFloat(tempNewMoneySpent)).toFixed(2);
                        if(newMoney < 0) {
                            return res.json ({
                                response: 'error',
                                message: 'You do not have enough money to buy these shares'
                            });
                        }
                        
                        User.update(
                            {_id: req.session.passport.user, "stocks.ticker" : tempStock},
                                {
                                    $set: {
                                        money : newMoney,
                                        "stocks.$.shares" : tempStocks,
                                        "stocks.$.price" : newCostAveragedPrice,
                                        "stocks.$.moneyspent" : tempMoneySpent
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
                                        query = '';
                                        return res.json(doc);
                                        
                                    });
                                }
                            );
                        });
                    }
                });
            }        
        );
    });
};