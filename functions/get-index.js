const co = require("co");
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const Mustache = require("mustache");
const http = require('superagent-promise')(require('superagent'), Promise);
const aws4 = require("aws4");
const URL = require("url");

const awsRegion = process.env.AWS_REGION;
const cognitoUserPoolId = process.env.cognito_user_pool_id;
const cognitoClientId = process.env.cognito_client_id;

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const restaurantsApiRoot = process.env.mutualfunds_api;
const searchUrl = `${restaurantsApiRoot}/search`

function* loadHtml() {
    var html;
    if (!html) {
        html = yield fs.readFileAsync('static/index.html', 'utf-8');
    }
    return html;
}

function * getRestaurants() {
    let url = URL.parse(restaurantsApiRoot);
    let opts = {
        host: url.hostname,
        path: url.pathname
    };
    aws4.sign(opts);
    console.log(restaurantsApiRoot);
    console.log(opts.headers);
    return (yield http.get(restaurantsApiRoot)
    .set('Host', opts.headers['Host'])
    .set('X-Amz-Date', opts.headers['X-Amz-Date'])
    .set('Authorization', opts.headers['Authorization'])
    .set('X-Amz-Security-Token', opts.headers['X-Amz-Security-Token'])).body;
}

module.exports.handler = co.wrap(function * serveHtml(event, context) {
    console.log("Serving Html...");
    let template = yield loadHtml();
    let restaurants = yield getRestaurants();
    let dayOfWeek = days[new Date().getDay()];
    let view = {
        dayOfWeek,
        restaurants,
        awsRegion,
        cognitoUserPoolId,
        cognitoClientId,
        searchUrl
    };
    let html = Mustache.render(template, view);
    console.log("Received Html" + html);
    return {
        statusCode: 200,
        body: html,
        headers: {
            'Content-Type': 'text/html; charset=UTF-8'
        }
    };
});