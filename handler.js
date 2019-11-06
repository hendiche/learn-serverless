'use strict';
const product = require('./src/productHandler');
const purchanse = require('./src/buyerHandler');

module.exports.hello = async event => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v1.0! Your function executed successfully!',
        input: event,
      },
      null,
      2
    ),
  };

// Use this code if you don't use the http event with the LAMBDA-PROXY integration
// return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

// dynamoDB ref: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html
module.exports.create = product.create;
module.exports.read = product.read;
module.exports.readAll = product.readAll; //or called as list not readAll
// dynamoDB update ref : https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStarted.NodeJs.03.html#GettingStarted.NodeJs.03.05
// there's few quick shortcut ways to handle update with dynamoDB
module.exports.update = product.update;
module.exports.delete = product.delete;

module.exports.newBuyer = purchanse.newBuy;
module.exports.invoices = purchanse.invoiceList;