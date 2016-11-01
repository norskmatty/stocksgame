var user = '';
var userData = {};
var updatedData = {};
var totalValue = 0;
var tempTotalValue = 0;
var totalCurrentValue = 0;
var tempTotalCurrentValue = 0;
var noStocks = false;
/*global $*/

function getStockUpdate(callback) {
    setTimeout(function() {callback(updatedData)}, 100);
}

function displayStocks(data) {
    $('#user-stocks').empty();
    $('#total-money').html('Cash: $<span id="insert-money"> ' + userData.money + '</span>');
    for (var i in data.stocks) {
        var newdiv = data.stocks[i].ticker;
        var oldPrice = parseFloat(userData.stocks[i].price).toFixed(2);
        var newPrice = parseFloat(data.stocks[i].price);
        var priceDiff = comparePrices(oldPrice, newPrice);
        var percentIncrease = percentageIncrease(priceDiff, oldPrice);
        var money = parseFloat(userData.stocks[i].moneyspent);
        var oldValue = parseFloat(userData.stocks[i].moneyspent).toFixed(2);
        tempTotalCurrentValue += parseFloat(oldValue);
        totalCurrentValue = tempTotalCurrentValue.toFixed(2);
        var newValue = getNewValue(percentIncrease, money);
        tempTotalValue += parseFloat(newValue);
        totalValue = tempTotalValue.toFixed(2);
        console.log("totalValue: " + totalValue);
        var totalGainorLoss = (parseFloat(totalValue) - parseFloat(totalCurrentValue)).toFixed(2);
        var percentTotalGainorLoss = ((parseFloat(totalGainorLoss) / parseFloat(totalCurrentValue)) * 100).toFixed(2);
        var picture = "";
        var theColor = "";
        if (priceDiff >= 0 ) {
            picture = "greenarrow.png";
        }
        else {
            picture = "redarrow.png";
        }
        if(totalValue > totalCurrentValue) {
            $('#lastline').children('.stocks-list').children('.newvalue').hasClass('green')
        }
        else if(totalValue < totalCurrentValue) {
            $('#lastline').children('.stocks-list').children('.newvalue').hasClass('red');
        }
        $('#user-stocks').append('<div id="' + newdiv + '"> <ul class="stocks-list"> <li class="ticker">' + data.stocks[i].ticker + '</li> <li class="shares">' + userData.stocks[i].shares + '</li> <li class="oldprice">' + oldPrice + '</li> <li class="newprice">' + data.stocks[i].price + '</li> <li class="pricediff">' + priceDiff + '</li> <li class="increase">' + percentIncrease + '%</li> <li class="arrow"> <img src="../images/' + picture + '"> </li> <li class="oldvalue"> $' + oldValue + '</li> <li class="newvalue"> $' + newValue + '</li> <li class="trashcan"> <input title="Click to sell all shares this stock" class="trash-can" type="submit" value=" "> </li> <li class="buy-more-shares"> <input title="Click to buy more shares of this stock" class="buy-b" type="submit" value=" "> </li> <li class="sell-shares"> <input title="Click to sell shares of this stock" class="sell-s" type="submit" value=" "> </li> </ul> </div>');
    }
    $('#user-stocks').append('<div id="lastline"> <ul class="stocks-list"> <li class="ticker"> Totals </li> <li class="shares"> </li> <li class="oldprice"> </li> <li class="newprice"> </li> <li class="pricediff"> </li> <li class="increase"> </li> <li class="arrow"> </li> <li class="oldvalue"> $' + totalCurrentValue + '</li> <li class="newvalue"> $' + totalValue + '</li> </ul> </div>');
    $('#user-stocks').append('<div id="total-gain"> <ul class="stocks-list"> <li class="totals"> Total Gain / Loss: </li> <li class="shares"> </li> <li class-"oldprice">$' + totalGainorLoss + '</li> <li class="pricediff"> </li> <li class="increase">' + percentTotalGainorLoss + '%</li> </ul> </div)')
    totalValue = 0;
    tempTotalValue = 0;
    totalCurrentValue = 0;
    tempTotalCurrentValue = 0;
}

function comparePrices(oldPrice, newPrice) {
    return (newPrice - oldPrice).toFixed(2);
}

function percentageIncrease(priceDiff, oldPrice) {
    return ((priceDiff / oldPrice) * 100).toFixed(1);
}

function getNewValue(percentIncrease, money) {
    var convertPercent = percentIncrease / 100;
    return parseFloat(((convertPercent * money) + money)).toFixed(2);
}

function getAndDisplayStocks() {
    getStockUpdate(displayStocks);
}

$(function() {
    
    $('#click-to-login').click(function() {
        $('#newuser').hide();
        $('#login').show();
    });
    
    $('#click-to-create-account').click(function() {
        $('#newuser').show();
        $('#login').hide();
    });
    
    $('#click-to-logout').click(function() {
        var ajax = $.ajax('/logout', {
            type: 'GET'
        });
        ajax.done(function(res) {
            window.location.reload(true);
        });
    });

// Front end screen for adding a new stock, entering the ticker and number of shares, and allowing the user to cancel back to the main screen    
    $('#click-to-add-stock').click(function() {
        $('#temp-add-stock-error').hide();
        $('#stocks').hide();
        $('#user-stocks').hide();
        $('#add-stock').show();
        $('#stockadd').click(function(event) {
            event.preventDefault();
            $('#temp-add-stock-error').hide();
            var exchange = $('#exchanges').val();
            var ticker = $('#addstock').val();
            var shares = parseInt($('#number-of-shares').val());
            if(ticker == '') {
                $('#temp-add-stock-error').show();
                $('#temp-add-stock-error').html('Please enter a stock ticker');
                return;
            }
            else if(shares <= 0 || isNaN(shares)) {
                $('#temp-add-stock-error').show();
                $('#temp-add-stock-error').html('Please enter a valid number of shares');
                return;
            }
            var item = {
                'exchange' : exchange,
                'ticker' : ticker,
                'shares' : shares
            };
            var ajax = $.ajax('/stocks/add', {
                type: 'PUT',
                data: JSON.stringify(item),
                datatype: 'JSON',
                contentType: 'application/json'
            });
            ajax.done(function(res){
                console.log(res);
                if(res.response == "error") {
                    $('#temp-add-stock-error').show();
                    $('#temp-add-stock-error').html(res.message);
                    return;
                }
                else {
                    var tempMoney = shares * res.response.l_fix;
                    var temp = {
                        exchange : res.response.e,
                        ticker : res.response.t,
                        price : res.response.l_fix,
                        shares : shares,
                        moneyspent: tempMoney
                    };
                    console.log(temp);
                    if (noStocks == true) {
                        var i = 0;
                    }
                    else {
                        var i = userData.stocks.length;
                    }
                    userData.stocks[i] = temp;
                    userData.money = res.money;
                    updatedData.stocks[i] = temp;
                    getAndDisplayStocks();
                    noStocks = false;
                    $('#add-stock').hide();
                    $('#stocks').show();
                    $('#user-stocks').show();
                    $('#temp-add-stock-error').hide();
                }
            });
        });
        $('#stock-add-cancel').click(function() {
            $('#addstock').val('');
            $('#number-of-shares').val('');
            $('#stocks').show();
            $('#user-stocks').show();
            $('#add-stock').hide();
            $('#stockadd').off();
        });
    });
    
    
    $(document).on('click', ".trash-can", function(event) {
        event.preventDefault();
        var stockToDelete = $(this).parent().parent().parent().attr('id');
        $('#stocks').hide();
        $('#user-stocks').hide();
        $('#sell-all-shares-confirm-screen').show();
        $('#stock-to-sell-all-shares').html('<h4>' + stockToDelete + '</h4>');
        $('#confirm-no').on('click', function() {
            $('#stocks').show();
            $('#user-stocks').show();
            $('#sell-all-shares-confirm-screen').hide();
            $('#stock-to-sell-all-shares').html('');
            $('#confirm-no').off();
            $('#confirm-yes').off();
        });
        $('#confirm-yes').on('click', function() {
            var item = {
                'stock' : stockToDelete
            };
                var ajax = $.ajax('/stocks/remove', {
                type: 'DELETE',
                data: JSON.stringify(item),
                dataType: 'JSON',
                contentType : 'application/json'
            });
            ajax.done(function(res){
                updatedData = res[0];
                socket.emit('update', updatedData);
                $('#stocks').show();
                $('#user-stocks').show();
                $('#sell-all-shares-confirm-screen').hide();
                $('#stock-to-sell-all-shares').html('');
                $('#confirm-no').off();
                $('#confirm-yes').off();
            });
        });
    });
    
    $(document).on('click', ".sell-s", function(event) {
        event.preventDefault();
        $('#temp-sell-stock-error').hide();
        var stockToUpdate = $(this).parent().parent().parent().attr('id');
        $('#stocks').hide();
        $('#user-stocks').hide();
        $('#sell-stocks-screen').show();
        $('#stock-to-sell').html('<h4>' + stockToUpdate +'</h4>');
        $('#stockupdatedown').on('click', function() {
            var updateAmount = parseInt($('#share-updatedown-number').val());
            if(updateAmount <= 0 || isNaN(updateAmount)) {
                $('#temp-sell-stock-error').show();
                $('#temp-sell-stock-error').html('Please enter a valid amount');
                return;
            }
            var item = {
                'stock' : stockToUpdate,
                'updateAmount' : updateAmount
            };
            var ajax = $.ajax('/stocks/sell', {
                type: 'PUT',
                data: JSON.stringify(item),
                dataType: 'JSON',
                contentType: 'application/json'
            });
            ajax.done(function(res) {
                console.log(res);
                if(res.response == 'error') {
                    $('#temp-sell-stock-error').show();
                    $('#temp-sell-stock-error').html(res.message);
                    return;
                }
                else {
                    updatedData = res[0];
                    socket.emit('update', updatedData);
                    $('#sell-stocks-screen').hide();
                    $('#stocks').show();
                    $('#user-stocks').show();
                    $('#stock-to-sell').html('');
                    $('#share-updatedown-number').val('');
                }
            });
        });
        $('#stock-sell-cancel').click(function() {
            $('#share-updatedown-number').val(' ');
            $('#stocks').show();
            $('#user-stocks').show();
            $('#sell-stocks-screen').hide();
        });
    });
    
    $(document).on('click', ".buy-b", function(event) {
        event.preventDefault();
        $('#temp-buy-stock-error').hide();
        var stockToUpdate = $(this).parent().parent().parent().attr('id');
        $('#stocks').hide();
        $('#user-stocks').hide();
        $('#buy-stocks-screen').show();
        $('#stock-to-buy').html('<h4>' + stockToUpdate +'</h4>');
        $('#stockupdateup').on('click', function() {
            var updateAmount = parseInt($('#share-updateup-number').val());
            if(updateAmount <= 0 || isNaN(updateAmount)){
                $('#temp-buy-stock-error').show();
                $('#temp-buy-stock-error').html('Please enter a valid number of shares');
                return;
            }
            var item = {
                'stock' : stockToUpdate,
                'updateAmount' : updateAmount
            };
            var ajax = $.ajax('/stocks/buy', {
                type: 'PUT',
                data: JSON.stringify(item),
                dataType: 'JSON',
                contentType: 'application/json'
            });
            ajax.done(function(res) {
                if(res.response == 'error') {
                    $('#temp-buy-stock-error').show();
                    $('#temp-buy-stock-error').html(res.message);
                    return;
                }
                else {
                    updatedData = res[0];
                    socket.emit('update', updatedData);
                    $('#buy-stocks-screen').hide();
                    $('#stocks').show();
                    $('#user-stocks').show();
                    $('#stock-to-buy').html('');
                    $('#share-updateup-number').val('');
                }
            });
        });
        $('#stock-buy-cancel').click(function() {
            $('#share-updateup-number').val(' ');
            $('#stocks').show();
            $('#user-stocks').show();
            $('#buy-stocks-screen').hide();
            $('#temp-buy-stock-error').hide();
        });
    });
    
    var socket = io();
    
    $('#getUsers').click(function() {
        var ajax = $.ajax('/users', {
            type: 'GET',
            datatype: JSON
        });
        ajax.done(function(res) {
            for(var i=0; i<res.length; i++) {
                console.log(res[i].username);
            }
        });
    });
    
    $('#del').click(function() {
        var userToDelete = $('#delete-user').val();
        var ajax = $.ajax('/users/' + userToDelete, {
            type: 'DELETE',
            datatype: 'JSON',
        });
        ajax.done(function(res) {
            console.log(res.Message);
        });
    });

    
    $('#accept').click(function(event) {
        event.preventDefault();
        $('#temp-error').hide();
        var existingUsername = $('#username').val();
        var existingPassword = $('#password').val();
        var item = {'username' : existingUsername, 'password' : existingPassword};
        
        var ajax = $.ajax('/login', {
            type: 'POST',
            data: JSON.stringify(item),
            dataType: 'json',
            contentType: 'application/json'
        });
        ajax.done(function(res) {
            if(res.response == 'error') {
                $('#login').append('<div id="temp-error">' + res.message + '</div>');
                return;
            }
            else {
                userData = res;
                updatedData = res;
                user = userData.username;
                console.log("user " + user + " logged in!");
                getAndDisplayStocks();
                $('#login').hide();
                $('#stocks').show();
                $('#nav-open').hide();
                $('#nav-logged-in').show();
                $('#total-money').show();
                $('#total-money').html('Cash: $<span id="insert-money"> ' + userData.money + '</span>');
            }
        });
    });
    
    $('#signup').click(function(event) {
        event.preventDefault();
        $('#temp-error').hide();
        var newUsername = $('#new-user').val();
        var newPassword = $('#new-pass').val();
        console.log(newUsername);
        console.log(newPassword);
        var item = {'username' : newUsername, 'password' : newPassword};
        
        var ajax = $.ajax('/users', {
            type: 'POST',
            data: JSON.stringify(item),
            dataType: 'json',
            contentType: 'application/json'
        });
        ajax.done(function(res) {
            if(res.response == 'error') {
                $('#newuser').append('<div id="temp-error">' + res.message + '</div>');
                return;
            }
            else {
                console.log("user " + res.username + " created!");
                noStocks = true;
                user = res.username;
                userData = res;
                updatedData = res;
                console.log (userData);
                console.log(user);
            
                $('#newuser').hide();
                $('#stocks').show();
                $('#nav-open').hide();
                $('#nav-logged-in').show();
                $('#total-money').show();
                $('#total-money').html('Cash: $<span id="insert-money"> ' + userData.money + '</span>');
            }    
        });
        

    });
    
    $('#update-stocks').click(function() {
        socket.emit('update', updatedData);
    });
    
    socket.on('returnUpdate', function(updatedStockdata, returnedOriginal) {
        console.log(returnedOriginal);
        userData = returnedOriginal[0];
        console.log(userData);
        updatedData.stocks = updatedStockdata;
        getAndDisplayStocks();
    });
    
    
    $('#get2').click(function() {
        socket.emit('userData', userData);
    });
    

    

    

});



