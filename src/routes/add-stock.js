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
    
    app.post('/stocks/', function(req, res) {
    User.find(
        {_id: req.session.passport.user}, function(err, doc) {
            if(err) {
                return res.json(err);
            }
            
            for (var i=0; i<doc[0].stocks.length; i++) {
                if(req.body.ticker == doc[0].stocks[i].ticker) {
                   return res.json({
                       response: 'error',
                       message: 'You already own this stock'
                   }); 
                }
            }

            var query = req.body.exchange + '%3A' + req.body.ticker;
            var searchReq = getFromApi(query);
        
            searchReq.on('error', function(item) {
                return res.json({
                    response: 'error',
                    message: 'Please enter a valid stock ticker for the chosen exchange'
                });
            });
    
            searchReq.on('end', function(item) {
                var stock = item.replace('//', ' ');
                stock = stock.trim();
                var parsed = JSON.parse(stock);
                var tempshares = req.body.shares;
                var tempticker = parsed[0].t;
                var tempexchange = parsed[0].e;
                var tempprice = parsed[0].l_fix;
                var moneyspent = parseFloat(tempprice * tempshares).toFixed(2);
    
                User.find(
                    {_id: req.session.passport.user}, function(err, doc) {
                        if(err) {
                            return res.json(err);
                        }
            
                    var moneyHad = parseFloat(doc[0].money);
                    console.log('moneyHad: ' + doc[0].money);
                    var moneyHave = (parseFloat(moneyHad) - parseFloat(moneyspent)).toFixed(2);
                        if(moneyHave < 0) {
                            return res.json({
                                response: 'error',
                                message: 'You do not have enough money to complete this buy'
                            });
                        }
                        else {
                            User.update(
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
                                function(err, doc) {
                                    if (err) {
                                        return res.json(err);
                                    }
                
                                    User.find({_id: req.session.passport.user}, function(err, doc) {
                                        if (err) {
                                            return res.json(err);
                                        }
                                        return res.json({
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