'use strict';

const AWS = require('aws-sdk');
const uuid = require('uuid');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

function checkBeforePut(body) {
    return new Promise((resolve) => {
        if (!body.sku || !body.name) {
            resolve(false);
        }

        resolve(true);
    });
}
function putDynamo(params) {
    return new Promise((resolve, reject) => {
        dynamoDb.put(params, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
module.exports.create = async event => {
    const data = JSON.parse(event.body || {});
    const isValidate = await checkBeforePut(data);

    if (!isValidate) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'required', validate: isValidate }),
        }
    }

    const timestamp = new Date().getTime();
    const params = {
        TableName: process.env.DB_TABLE_NAME,
        Item: {
            _id: uuid.v1(),
            sku: data.sku,
            name: data.name,
            qty: 1,
            createdAt: timestamp,
            updatedAt: timestamp
        },
    };

    try {
        await putDynamo(params);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'ok' }),
        }
    } catch (err) {
        return {
            statusCode: 500,
            body: err.message
        }
    }
};

// get specifi by _id and sku (should follow db KeySchema)
const getDynamo = params => {
    return new Promise((resolve, reject) => {
        dynamoDb.get(params, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
}
module.exports.read = async () => {
    const params = {
        TableName: process.env.DB_TABLE_NAME,
        Key: {
            "_id": '08083de0-ff82-11e9-8dcd-65fa6d58a1c4',
            "sku": 'asd1ds',
        }
    }

    try {
        const item = await getDynamo(params);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'ok', item: item }),
        }
    } catch (err) {
        return {
            statusCode: 500,
            body: err.message
        }
    }
}

const setScanFilter = event => {
    return new Promise((resolve) => {
        const res = {
            status: false,
            filter: {},
        };

        if (event.queryStringParameters) {
            for (let key in event.queryStringParameters) {
                res.filter[key] = {
                    ComparisonOperator: 'EQ',
                    AttributeValueList: [event.queryStringParameters[key]]
                }
            }
            res.status = true;
        }

        resolve(res);
    });
}
const getAllDynamo = params => {
    return new Promise((resolve, reject) => {
        dynamoDb.scan(params, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
}
module.exports.readAll = async event => {
    const params = {
        TableName: process.env.DB_TABLE_NAME,
    }
    const checkQuery = await setScanFilter(event);

    if (checkQuery.status) {
        params.ScanFilter = checkQuery.filter;
    }

    try {
        const items = await getAllDynamo(params);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'ok', items: items }),
        }
    } catch (err) {
        return {
            statusCode: 500,
            body: err.message
        }
    }
}

const checkBeforeUpdate = (event, body) => {
    return new Promise(resolve => {
        const { _id, sku } = event.pathParameters;
        
        if (!_id || !sku) resolve(false);

        if (!body.name || !body.qty) resolve(false);

        resolve(true);
    });
}
const updateDynamo = params => {
    return new Promise((resolve, reject) => {
        dynamoDb.update(params, (err, data) => {
            console.log('err:', err);
            console.log('data:', data);
            if (err) reject(err);
            else resolve(data);
        })
    });
}
module.exports.update = async event => {
    const data = JSON.parse(event.body || {});
    const isValidate = await checkBeforeUpdate(event, data);
    
    if (!isValidate) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'required' }),
        }
    }

    const timestamp = new Date().getTime();
    const { name, qty } = data;
    const params = {
        TableName: process.env.DB_TABLE_NAME,
        Key: {
            _id: event.pathParameters._id,
            sku: event.pathParameters.sku,
        },
        ExpressionAttributeNames: {
            '#name_prod': 'name',
        },
        ExpressionAttributeValues: {
            ':name': name,
            ':qty': qty,
            ':updatedAt': timestamp,
        },
        UpdateExpression: 'SET #name_prod = :name, qty = :qty, updatedAt = :updatedAt',
        ReturnValues: 'ALL_NEW',
    }

    try {
        const item = await updateDynamo(params);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'ok', item: item.attributes })
        }
    } catch(err) {
        return {
            statusCode: 400,
            body: err.message
        }
    }
}