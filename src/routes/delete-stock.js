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
    
    app.delete('/stocks/', function(req, res) {
    const tempStock = req.body.stock;
    let tempExchange = '';
    let tempStocks = 0;
    let tempMoneyHad = 0;
    User.find({_id: req.session.passport.user}, function(err, doc) {
        if(err) {
            res.json(err);
        }
        doc[0].stocks.forEach ((item) => {
           if(tempStock == item.ticker) {
                tempExchange = item.exchange;
                tempStocks = item.shares;
                tempMoneyHad = doc[0].money;
           }
        });

        var query = tempExchange + '%3A' + tempStock;
        var searchReq = getFromApi(query);
    
        searchReq.on('end', function(item) {
            var stock = item.replace('//', ' ');
            stock = stock.trim();
            var parsed = JSON.parse(stock);
            const newPrice = parsed[0].l_fix;
            const tempMoneyGained = parseFloat(newPrice) * parseFloat(tempStocks);
            const moneyHave = (parseFloat(tempMoneyHad) + parseFloat(tempMoneyGained)).toFixed(2);
        
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