'use strict';

const AWS = require('aws-sdk');
const uuid = require('uuid');

// const dynamoDb = new AWS.DynamoDB.DocumentClient();
const dynamodb = new AWS.DynamoDB();

module.exports.create = async event => {
    const timestamp = new Date().getTime();
    // const data = JSON.parse(event.body);

    const params = {
        TableName: process.env.DB_TABLE_NAME,
        Item: {
            _id: uuid.v1(),
            sku: 'asd1ds',
            name: 'asd name',
            createdAt: timestamp,
            updatedAt: timestamp
        },
    };

    dynamodb.putItem(params, (err, data) => {
        if (err) {
            console.log(err, err.stack);
            return { statusCode: 400 };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(
                {
                    message: 'success put item',
                    data: data
                }
            )
        }

    });
};