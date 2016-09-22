var mock_stocks = {
    "stocks" : [
        {
            "exchange" : "NASDAQ",
            "ticker" : "SBUX",
            "price" : "54.10",
            "time" : "Aug 10, 4:00 EST",
            "shares" : "1000",
            "moneyspent" : "54100"
        },
        {
            "exchange" : "NASDAQ",
            "ticker" : "AAPL",
            "price" : "116.34",
            "time" : "Aug 10, 3:59 EST",
            "shares" : "500",
            "moneyspent" : "58170"
        },
        {
            "exchange" : "NYSE",
            "ticker" : "T",
            "price" : "40.00",
            "time" : "Aug 10, 3:59 EST",
            "shares" : "750",
            "moneyspent" : "30000"
        },
        {
            "exchange" : "NYSE",
            "ticker" : "SSW",
            "price" : "13.50",
            "time" : "Aug 10, 4:00 EST",
            "shares" : "1200",
            "moneyspent" : "16200"
        }]
};

var mock_stocks_update = {
    "stocks" : [
        {
            "exchange" : "NASDAQ",
            "ticker" : "SBUX",
            "price" : "56.20",
            "time" : "Aug 12, 4:00 EST"
        },
        {
            "exchange" : "NASDAQ",
            "ticker" : "AAPL",
            "price" : "110.34",
            "time" : "Aug 12, 3:59 EST"
        },
        {
            "exchange" : "NYSE",
            "ticker" : "T",
            "price" : "39.15",
            "time" : "Aug 12, 3:59 EST"
        },
        {
            "exchange" : "NYSE",
            "ticker" : "SSW",
            "price" : "14.10",
            "time" : "Aug 12, 4:00 EST"
        }]
};

function getStockUpdate(callback) {
    setTimeout(function() {callback(mock_stocks_update)}, 100);
}

function displayStocks(data) {
    for (var i in data.stocks) {
        var newdiv = data.stocks[i].ticker;
        var oldPrice = parseFloat(mock_stocks.stocks[i].price);
        var newPrice = parseFloat(data.stocks[i].price);
        var priceDiff = comparePrices(oldPrice, newPrice);
        var percentIncrease = percentageIncrease(priceDiff, oldPrice);
        var money = parseFloat(mock_stocks.stocks[i].moneyspent);
        var newValue = getNewValue(percentIncrease, money);
        var picture = "";
        var theColor = "";
        if (priceDiff >= 0 ) {
            picture = "greenarrow.png";
        }
        else {
            picture = "redarrow.png";
        }
        $('#stocks').append('<div id="' + newdiv + '"> <ul> <li class="ticker">' + data.stocks[i].ticker + '</li> <li class="shares">' + mock_stocks.stocks[i].shares + '</li> <li class="newprice">' + data.stocks[i].price + '</li> <li class="pricediff">' + priceDiff + '</li> <li class="increase">' + percentIncrease + '%</li> <li class="arrow"> <img src="../images/' + picture + '"> </li> <li class="newvalue"> $' + newValue + '</li> </ul> </div>');
    }
    
}

function comparePrices(oldPrice, newPrice) {
    return (newPrice - oldPrice).toFixed(2);
}

function percentageIncrease(priceDiff, oldPrice) {
    return ((priceDiff / oldPrice) * 100).toFixed(1);
}

function getNewValue(percentIncrease, money) {
    var convertPercent = percentIncrease / 100;
    return ((convertPercent * money) + money).toFixed(2);
}

function getAndDisplayStocks() {
    getStockUpdate(displayStocks);
}

$(function() {
    getAndDisplayStocks();
    
    $('#accept').click(function() {
        $('#login').hide();
        $('#stocks').show();
    });
    
    $('#signup').click(function() {
        $('#newuser').hide();
        $('#stocks').show();
    });
    
    $('#account').click(function() {
        $('#login').hide();
        $('#newuser').show();
    });
});

