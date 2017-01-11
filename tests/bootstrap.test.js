var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
const getDB = require('../app/db').getDB;

before(() => {
    return fs.readFileAsync('./config.json', 'utf8')
        .then(function(config){
            // Get the database for the first time, so we can open a database connection with the config details
            config = JSON.parse(config);
            getDB(config);
        })

});
