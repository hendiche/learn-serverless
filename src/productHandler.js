'use strict';

const AWS = require('aws-sdk');
const uuid = require('uuid');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

// return boolean of false if goes wrong, else object
function checkBeforePut(event) {
    return new Promise((resolve) => {
        if (!event.body) resolve(false);

        const body = JSON.parse(event.body);

        if (!body.sku || !body.name) resolve(false);

        resolve(body);
    });
}
function putDynamo(params) {
    return new Promise((resolve, reject) => {
        dynamoDb.put(params, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}
module.exports.create = async event => {
    const isValidate = await checkBeforePut(event);

    if (!isValidate) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'required', validate: isValidate }),
        }
    }

    const timestamp = new Date().getTime();
    const { sku, name, qty } = isValidate;
    const params = {
        TableName: process.env.DB_PRODUCT,
        Item: {
            _id: uuid.v1(),
            sku: sku,
            name: name,
            qty: qty ? qty : 1,
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
module.exports.read = async event => {
    const params = {
        TableName: process.env.DB_PRODUCT,
        Key: {
            _id: event.pathParameters._id,
            sku: event.pathParameters.sku,
        }
    }

    try {
        const data = await getDynamo(params);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'ok', item: data.item }),
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
// or called as list not readAll
module.exports.readAll = async event => {
    const params = {
        TableName: process.env.DB_PRODUCT,
    }
    const checkQuery = await setScanFilter(event);

    if (checkQuery.status) {
        params.ScanFilter = checkQuery.filter;
    }

    try {
        const items = await getAllDynamo(params);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'ok', data: items }),
        }
    } catch (err) {
        return {
            statusCode: 500,
            body: err.message
        }
    }
}

// return boolean of false if goes wrong, else object
const checkBeforeUpdate = event => {
    return new Promise(resolve => {
        if (!event.body) resolve(false)

        const body = JSON.parse(event.body);

        if (!body.name || !body.qty) resolve(false);

        resolve(body);
    });
}
const updateDynamo = params => {
    return new Promise((resolve, reject) => {
        dynamoDb.update(params, (err, data) => {
            if (err) reject(err);
            
            resolve(data);
        })
    });
}
module.exports.update = async event => {
    const isValidate = await checkBeforeUpdate(event);
    
    if (!isValidate) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'required' }),
        }
    }

    const timestamp = new Date().getTime();
    const { name, qty } = isValidate;
    const params = {
        TableName: process.env.DB_PRODUCT,
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


const deleteDynamo = params => {
    return new Promise((resolve, reject) => {
        dynamoDb.delete(params, (err) => {
            if (err) reject(err);
            
            resolve();
        })
    })
}
module.exports.delete = async event => {
    const params = {
        TableName: process.env.DB_PRODUCT,
        Key: {
            _id: event.pathParameters._id,
            sku: event.pathParameters.sku,
        },
    };

    try {
        await deleteDynamo(params);
        return {
            statusCode: 200,
            body: 'ok'
        }
    } catch(err) {
        return {
            statusCode: 500,
            body: err.message,
        }
    }
}