STOCKS GAME

API

POST /new-user/
 Creates a new user account, with password, to buy and sell stocks with. 
 
POST /login/
 A previously created user can login with their username and password
 
GET /logout/
 For users that are already logged in, they can end their session and logout, requiring entry of the password to access the account again

POST /stocks/ 
 Adds a new, previously unowned stock to the list of stocks
 
PUT /stocks/buy
 Adds additional shares to an already owned stock
 
DELETE /stocks/
 Sells and removes all shares of a purchased stock
 
PUT /stocks/sell
 Sells shares of an existing stock up to all but one (to sell all of a stock, use the DELETE /stocks/ API)
 
SOCKET.IO update
 Gets an update on currently owned stocks by using the Google Finance API for real-time prices
 
SUMMARY
The user can create a new account or login to an already existing account. New users get $100,000 to spend on whatever stocks they would like to own (US stocks only at this time). 

Users can buy and sell stocks at the real-time price (provided through the Google Finance Stock API), with the goal to see how much money they can obtain. 

At any time, users can get a real-time update of the prices of the stocks they own, and compare them to what they were originally purchased at

TECHNOLOGY

The backend is built with node.js, using a REST API and socket.io to communicate between the server and the clients. 
Passport is used to enable to login strategy.
The front end is built with HTML, CSS and Javascript/JQuery
