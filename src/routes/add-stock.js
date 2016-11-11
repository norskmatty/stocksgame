module.exports = function (app, User, events, unirest) {
    
"use strict";    
    
    var getFromApi = function (args) {   
    var emitter = new events.EventEmitter ();
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
    
    app.post ('/stocks/', function (req, res) {
    User.find(
        {_id: req.session.passport.user}, 
            function (err, doc) {
                if (err) {
                    return res.json (err);
                }
            
                doc[0].stocks.forEach ((item) => {
                    if (req.body.ticker == item.ticker) {
                        return res.json ({
                            response: 'error',
                            message: 'You already own this stock'
                        }); 
                    }
                });
    
                var query = req.body.exchange + '%3A' + req.body.ticker;
                var searchReq = getFromApi (query);
        
                searchReq.on ('error', function (item) {
                    return res.json ({
                        response: 'error',
                        message: 'Please enter a valid stock ticker for the chosen exchange'
                    });
                });
        
                searchReq.on ('end', function(item) {
                    var stock = item.replace('//', ' ');
                    stock = stock.trim();
                    var parsed = JSON.parse (stock);
                    const tempshares = req.body.shares;
                    const tempticker = parsed[0].t;
                    const tempexchange = parsed[0].e;
                    const tempprice = parsed[0].l_fix;
                    const moneyspent = parseFloat (tempprice * tempshares).toFixed(2);
    
                    User.find(
                        {_id: req.session.passport.user}, 
                            function (err, doc) {
                                if (err) {
                                    return res.json (err);
                        }
            
                    const moneyHad = parseFloat(doc[0].money);
                    const moneyHave = (parseFloat (moneyHad) - parseFloat (moneyspent)).toFixed(2);
                        if(moneyHave < 0) {
                            return res.json ({
                                response: 'error',
                                message: 'You do not have enough money to complete this buy'
                            });
                        }
                        else {
                            User.update (
                                {_id: req.session.passport.user},
                                    {
                                        $push: {
                                            stocks: {
                                                ticker : tempticker,
                                                exchange : tempexchange,
                                                price : tempprice,
                                                shares : tempshares,
                                                moneyspent : moneyspent
                                            }
                                        },
                                        $set: {
                                            money : moneyHave
                                        }
                                }, 
                                function (err, doc) {
                                    if (err) {
                                        return res.json (err);
                                    }
                
                                    User.find (
                                        {_id: req.session.passport.user}, 
                                            function (err, doc) {
                                                if (err) {
                                                    return res.json (err);
                                                }
                                                return res.json ({
                                                    response: parsed[0],
                                                    money: moneyHave
                                                });
                                        });
                                    }
                                );
                            }
                        }
                    );
                });
            }
        );
    });        
};