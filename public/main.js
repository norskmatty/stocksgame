var mock_stocks = {
    "stocks" : [
        {
            "exchange" : "NASDAQ",
            "ticker" : "SBUX",
            "price" : "54.10",
            "time" : "Aug 10, 4:00 EST"
        },
        {
            "exchange" : "NASDAQ",
            "ticker" : "AAPL",
            "price" : "116.34",
            "time" : "Aug 10, 3:59 EST"
        },
        {
            "exchange" : "NYSE",
            "ticker" : "T",
            "price" : "40.00",
            "time" : "Aug 10, 3:59 EST"
        },
        {
            "exchange" : "NYSE",
            "ticker" : "SSW",
            "price" : "13.50",
            "time" : "Aug 10, 4:00 EST"
        }]
};

function getStockUpdate(callback) {
    setTimeout(function() {callback(mock_stocks)}, 100);
}

function displayStocks(data) {
    for (var i in data.stocks) {
        $('body').append('<p>' + data.stocks[i].exchange + '</p> <p>' + data.stocks[i].ticker + '</p> <p>' + data.stocks[i].price + '</p> <p>' + data.stocks[i].time + '</p> <p></p>');
    }
}

function getAndDisplayStocks() {
    getStockUpdate(displayStocks);
}

$(function() {
    getAndDisplayStocks();
})