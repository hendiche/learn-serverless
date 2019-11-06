'use strict';
const product = require('./src/productHandler');

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
module.exports.create = product.create;
module.exports.read = product.read;
module.exports.readAll = product.readAll; //or called as list not readAll
module.exports.update = product.update;
module.exports.delete = product.delete;