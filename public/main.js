var user = '';
var userData = {};
var updatedData = {};
var totalValue = 0;
var tempTotalValue = 0;
var noStocks = false;

function getStockUpdate(callback) {
    setTimeout(function() {callback(updatedData)}, 100);
}

function displayStocks(data) {
    $('#user-stocks').empty();
    for (var i in data.stocks) {
        var newdiv = data.stocks[i].ticker;
        var oldPrice = parseFloat(userData.stocks[i].price);
        var newPrice = parseFloat(data.stocks[i].price);
        var priceDiff = comparePrices(oldPrice, newPrice);
        var percentIncrease = percentageIncrease(priceDiff, oldPrice);
        var money = parseFloat(userData.stocks[i].moneyspent);
        var newValue = getNewValue(percentIncrease, money);
        tempTotalValue += parseFloat(newValue);
        totalValue = tempTotalValue.toFixed(2);
        console.log("totalValue: " + totalValue);
        var picture = "";
        var theColor = "";
        if (priceDiff >= 0 ) {
            picture = "greenarrow.png";
        }
        else {
            picture = "redarrow.png";
        }
        $('#user-stocks').append('<div id="' + newdiv + '"> <ul> <li class="ticker">' + data.stocks[i].ticker + '</li> <li class="shares">' + userData.stocks[i].shares + '</li> <li class="newprice">' + data.stocks[i].price + '</li> <li class="pricediff">' + priceDiff + '</li> <li class="increase">' + percentIncrease + '%</li> <li class="arrow"> <img src="../images/' + picture + '"> </li> <li class="newvalue"> $' + newValue + '</li> </ul> </div>');
    }
    $('#user-stocks').append('<div id="lastline"> <ul> <li class="ticker"> </li> <li class="shares"> </li> <li class="newprice"> </li> <li class="pricediff"> </li> <li class="increase"> </li> <li class="arrow"> </li> <li class="newvalue"> $' + totalValue + '</li> </ul> </div>');
    totalValue = 0;
    tempTotalValue = 0;
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
        })
    })
    
    $('#stockadd').click(function() {
        var exchange = 'NASDAQ';
        var ticker = $('#addstock').val();
        var shares = parseInt($('#number-of-shares').val());
        var ajax = $.ajax('/addstock/' + exchange + '/' + ticker + '/' + user + '/' + shares, {
            type: 'PUT',
            datatype: 'JSON'
        });
        ajax.done(function(res){
            console.log(res);
            var tempMoney = shares * res.l_fix;
            var temp = {
                exchange : res.e,
                ticker : res.t,
                price : res.l_fix,
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
            updatedData.stocks[i] = temp;
            getAndDisplayStocks();
            noStocks = false;
        });
    });
    
    $('#accept').click(function() {
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
            userData = res;
            updatedData = res;
            user = userData.username;
            console.log("user " + user + " logged in!");
            getAndDisplayStocks();
        });
        
        
        $('#login').hide();
        $('#stocks').show();
    });
    
    $('#signup').click(function() {
        // https://api.jquery.com/jquery.post/
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
            console.log("user " + res.username + " created!");
            noStocks = true;
            user = res.username;
            userData = res;
            updatedData = res;
            console.log (userData);
        });
        
        console.log(user);
            
        $('#newuser').hide();
        $('#stocks').show();
    });
    
    $('#account').click(function() {
        $('#login').hide();
        $('#newuser').show();
    });
    
    $('#update').click(function() {
        socket.emit('update', updatedData);
    });
    
    socket.on('returnUpdate', function(updatedStockdata, returnedOriginal) {
        console.log(returnedOriginal);
        userData = returnedOriginal[0];
        console.log(userData);
        updatedData.stocks = updatedStockdata;
        getAndDisplayStocks();
    });
    
    $('#logout-click').click(function() {
        var ajax = $.ajax('/logout', {
            type: 'GET'
        });
        ajax.done(function(res) {
            window.location.reload(true);
        })
    });
    
    $('#get2').click(function() {
        socket.emit('userData', userData);
    });
    
    $('#trash').click(function() {
        var stockToDelete = $('#deletestock').val();
        console.log(stockToDelete);
        var ajax = $.ajax('/remove/' + stockToDelete + '/' + user, {
            type: 'DELETE',
            dataType: 'JSON'
        });
        ajax.done(function(res){
            updatedData = res[0];
            socket.emit('update', updatedData);
        });
    });
    
    $('#stockupdatedown').click(function() {
        var stockToUpdate = $('#updatestockdown').val();
        var updateAmount = parseInt($('#share-updatedown-number').val());
        var ajax = $.ajax('/updatedown/' + stockToUpdate + '/' + updateAmount + '/' + user, {
            type: 'PUT',
            dataType: 'JSON'
        });
        ajax.done(function(res) {
            updatedData = res[0];
            socket.emit('update', updatedData);
        });
    });
    
    $('#stockupdateup').click(function() {
        var stockToUpdate = $('#updatestockup').val();
        var updateAmount = parseInt($('#share-updateup-number').val());
        var ajax = $.ajax('/updateup/' + stockToUpdate + '/' + updateAmount + '/' + user, {
            type: 'PUT',
            dataType: 'JSON'
        });
        ajax.done(function(res) {
            updatedData = res[0];
            socket.emit('update', updatedData);
        });
    });
});


