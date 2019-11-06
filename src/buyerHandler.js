'use strict';

const AWS = require('aws-sdk');
const uuid = require('uuid');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const checkBeforePut = event => {
    return new Promise((resolve) => {
        if (!event.body) resolve(false);

        const body = JSON.parse(event.body);

        if (!body.name || body.items.length < 1) resolve(false);

        resolve(body);
    });
}
const getPurchItems = items => {
    return new Promise((resolve, reject) => {
        const keys = [];
        const params = { RequestItems: {} };

        for (let i = 0; i < items.length; i++) {
            const tmpObj = {
                _id: items[i]._id,
                sku: items[i].sku,
            };
            keys.push(tmpObj);
        }

        params.RequestItems[process.env.DB_PRODUCT] = {
            Keys: keys
        }
        
        dynamoDb.batchGet(params, (err, data) => {
            if (err) reject(err);

            resolve(data);
        });
    });
}
const updateQty = (batchItems, items) => {
    return new Promise((resolve, reject) => {
        const retvItems = batchItems.Responses[process.env.DB_PRODUCT];
        const timestamp = new Date().getTime();
        const params = { RequestItems: {} };
        const batchRequest = [];

        if (retvItems.length != items.length) reject({ message: 'There is some item not valid' });

        for (let i = 0; i < items.length; i++) {
            const found = retvItems.find((item) => {
                return item._id == items[i]._id;
            });

            if (found.qty <= 0) reject({ message: 'Item is out of stock' });

            if (found.qty - items[i].qty < 0) reject({ message: 'Stock item is not enough' });

            const tmpObj = {
                PutRequest: {
                    Item: {
                        ...found,
                        qty: found.qty - items[i].qty,
                        updatedAt: timestamp,
                    }
                }
            };
            batchRequest.push(tmpObj);
        }

        params.RequestItems[process.env.DB_PRODUCT] = batchRequest;

        dynamoDb.batchWrite(params, (err, data) => {
            if (err) reject(err);

            resolve(data);
        });
    });
}
const putDynamo = params => {
    return new Promise((resolve, reject) => {
        dynamoDb.put(params, (err) => {
            if (err) reject(err)

            resolve();
        });
    });
}
module.exports.newBuy = async event => {
    const isValidate = await checkBeforePut(event);

    if (!isValidate) {
        return {
            statusCode: 500,
            body: 'required'
        }
    }

    const timestamp = new Date().getTime();
    const { name, items } = isValidate;
    const params = {
        TableName: process.env.DB_BUYER,
        Item: {
            _id: uuid.v1(),
            name: name,
            items: items,
            createdAt: timestamp,
            updatedAt: timestamp,
        },
    };

    try {
        const batchItems = await getPurchItems(items);
        await putDynamo(params);
        await updateQty(batchItems, items);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'ok',
                test: batchItems,
            }),
        }
    } catch(err) {
        return {
            statusCode: 400,
            body: err.message
        }
    }
}

const scanDynamo = params => {
    return new Promise((resolve, reject) => {
        dynamoDb.scan(params, (err, data) => {
            if (err) reject(err)

            resolve(data);
        });
    });
}
module.exports.invoiceList = async event => {
    const params = {
        TableName: process.env.DB_BUYER,
    };

    try {
        const items = await scanDynamo(params);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'ok', data: items }),
        }
    } catch(err) {
        return {
            statusCode: 400,
            body: err.message
        }
    }
}