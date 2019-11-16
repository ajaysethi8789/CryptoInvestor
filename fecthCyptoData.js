'use strict';
var request = require("request");
const args = require('yargs').argv;
const date = require('date-and-time');

var cryptoCompare;
var usdValues;

// function to get the latest portfolio value per token in USD
var getLatestValPerTokenInUSD = function () {
    return new Promise(function (resolve) {
        
        var output = [];

        var btcOutputArr = { "token": "BTC", "amount": 0, "timestamp": 0 };
        var ethOutputArr = { "token": "ETH", "amount": 0, "timestamp": 0 };
        var xrpOutputArr = { "token": "XRP", "amount": 0, "timestamp": 0 };

        var lineReader = require('readline').createInterface({
            input: require('fs').createReadStream('transactions.csv')
        });

        lineReader.on('line', function (line) {

            var jsonFromLine = {};
            var lineSplit = line.split(',');

            jsonFromLine.timestamp = lineSplit[0];
            jsonFromLine.transaction_type = lineSplit[1];
            jsonFromLine.token = lineSplit[2];
            jsonFromLine.amount = lineSplit[3];

            if (jsonFromLine.token === 'ETH') {
                if (jsonFromLine.timestamp > ethOutputArr.timestamp) {
                    ethOutputArr.amount = jsonFromLine.amount;
                    ethOutputArr.timestamp = jsonFromLine.timestamp;
                }
            }
            else if (jsonFromLine.token === 'BTC') {

                if (jsonFromLine.timestamp > btcOutputArr.timestamp) {
                    btcOutputArr.amount = jsonFromLine.amount;
                    btcOutputArr.timestamp = jsonFromLine.timestamp

                }
            }
            else if (jsonFromLine.token === 'XRP') {

                if (jsonFromLine.timestamp > xrpOutputArr.timestamp) {
                    xrpOutputArr.amount = jsonFromLine.amount;
                    xrpOutputArr.timestamp = jsonFromLine.timestamp;
                }
            }
        }

        );
        lineReader.on('close', function (line) {

            cryptoCompare = getUSDValues();

            cryptoCompare.then(function (result) {
                usdValues = result;
                ethOutputArr.amount = ethOutputArr.amount * usdValues.ETH.USD;
                btcOutputArr.amount = btcOutputArr.amount * usdValues.ETH.USD;
                xrpOutputArr.amount = xrpOutputArr.amount * usdValues.ETH.USD;

                output.push(ethOutputArr);
                output.push(btcOutputArr);
                output.push(xrpOutputArr);
                resolve(output);
            }, function (err) {
                console.log(err);
            })

        });
    });
}
//function to get the portfolio value per token in USD
var getPortfolioValPerToken = function () {
    console.log("cyptoLatest-->getPortfolioValPerToken");
    console.log("Date",args.date);
    return new Promise(function (resolve) {
        
        var output = [];

        var btcOutputArr = [];
        var ethOutputArr = [];
        var xrpOutputArr = [];

        var lineReader = require('readline').createInterface({
            input: require('fs').createReadStream('transactions.csv')
        });

        lineReader.on('line', function (line) {

            var jsonFromLine = {};
            var lineSplit = line.split(',');

            jsonFromLine.timestamp = lineSplit[0];
            jsonFromLine.transaction_type = lineSplit[1];
            jsonFromLine.token = lineSplit[2];
            jsonFromLine.amount = lineSplit[3];

            //converting date from timestamp
            var d = new Date(jsonFromLine.timestamp * 1000);
            var dateFromCSV = d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear();
            
                if(jsonFromLine.token === 'ETH'){
                    if(args.date === dateFromCSV){
                        ethOutputArr.push({"token":jsonFromLine.token,"amount":jsonFromLine.amount * usdValues.ETH.USD})
                    }
                } else if (jsonFromLine.token === 'BTC'){
    
                    if(args.date === dateFromCSV){
                        btcOutputArr.push({"token":jsonFromLine.token,"amount":jsonFromLine.amount * usdValues.ETH.USD})
                    }
                }
                else if (jsonFromLine.token === 'XRP'){
    
                    if(args.date === dateFromCSV){
                        xrpOutputArr.push({"token":jsonFromLine.token,"amount":jsonFromLine.amount * usdValues.ETH.USD})
                    }
                }//end
        }

        )
    ;
        lineReader.on('close', function (line) {
                output.push(ethOutputArr);
                output.push(btcOutputArr);
                output.push(xrpOutputArr);
                resolve(output);

        });
        
    });
}

// function to fetch the USD Values from CryptoCompare
function getUSDValues() {

    var cryptoURL = 'https://min-api.cryptocompare.com/data/pricemulti?fsyms=ETH,DASH&tsyms=BTC,USD,EUR&api_key=3789ea397be622354552b3ab2a826e4379b5da952de997d3cff964ed4f0786ee';

    var options = {
        url: cryptoURL,
        headers: {
            'User-Agent': 'request'
        }
    };
    // Return new promise 
    return new Promise(function (resolve, reject) {
        // Do async job
        request.get(options, function (err, resp, body) {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(body));
            }
        })
    })

}

function filterByProperty(array, prop, value){
    var filtered = [];
    for(var i = 0; i < array.length; i++){

        var obj = array[i];

        for(var key in obj){
            if(typeof(obj[key] == "object")){
                var item = obj[key];
                if(item[prop] == value){
                    filtered.push(item);
                }
            }
        }

    }    

    return filtered;

}

// based on the type of the parameters we pass as cmd, corresponding function will be called
if(args.token === undefined && args.date === undefined){
    console.log("Given no parameters, return the latest portfolio value per token in USD");
  getLatestValPerTokenInUSD().then(function (result) { console.log(result); });
}
else if (args.token != undefined && args.date === undefined){
    console.log("Given a token, return the latest portfolio value for that token in USD");
    getLatestValPerTokenInUSD().then(function (result) { 
        var resultPerToken =  result.filter(function(record) {
            return record.token === args.token;
            })
            console.log(resultPerToken);
     });
}
else if (args.date != undefined && args.token === undefined){
    console.log("Given a date, return the portfolio value per token in USD on that date");
    cryptoCompare = getUSDValues();
    cryptoCompare.then(function (result) {
     usdValues = result;
     getPortfolioValPerToken().then(function (result) { console.log(result); });
 }, function (err) {
     console.log(err);
 })
    
}
else if (args.token != undefined && args.date != undefined){
    console.log("Given a date and a token, return the portfolio value of that token in USD on that date");
    cryptoCompare = getUSDValues();
    cryptoCompare.then(function (usdVal) {
    usdValues = usdVal;
     getPortfolioValPerToken().then(function (result) { 
         
        var resultPerToken =  filterByProperty(result,"token",args.token);
            console.log(resultPerToken); 
        });
 }, function (err) {
     console.log(err);
 })
}

// Instructions, to run the command line program, install the below dependencies

// npm install request 
// npm install promise
// npm install parser
// npm install await
// npm install yargs



//Given a date and a token, return the portfolio value of that token in USD on that date
//node .\fecthCyptoData.js --date=4/3/2018 --token=BTC

//Given a date, return the portfolio value per token in USD on that date
//node .\fecthCyptoData.js --date=4/3/2018


//Given a token, return the latest portfolio value for that token in USD
//node .\fecthCyptoData.js --token=BTC

//Given no parameters, return the latest portfolio value per token in USD
//node .\fecthCyptoData.js