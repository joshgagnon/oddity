const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));
const path = require('path');
const nunjucksEnvFactory = require('./nunjucksEnvFactory');

module.exports = function getEnvironments() {
    return fs.readFileAsync(path.join(__dirname, '../environments.json'))
        .then((data) => {
            const obj =JSON.parse(data);
            return Promise.reduce(Object.keys(obj), (acc, key) => {
                console.log('Loading ', obj[key])
                return nunjucksEnvFactory(obj[key])
                    .then(result => {
                        acc[key] = result;
                        return acc;
                    });
            }, {});
        })
}
