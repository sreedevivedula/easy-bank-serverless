'use strict';

const co = require("co");
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

const defaultResults = process.env.defaultResults || 8;
const tableName = process.env.mutualfunds_table;

function* getRestaurants(count) {
    let req = {
        TableName: tableName,
        Limit: count
    };
    let resp = yield dynamodb.scan(req).promise();
    return resp.Items;
};

module.exports.handler = co.wrap(function * (event, context) {
    let restaurants = yield getRestaurants(defaultResults);
    return {
        statusCode: 200,
        body: JSON.stringify(restaurants)
    }
});