const chai = require('chai');
const Promise = require('bluebird');
const path = require('path');
const fs = Promise.promisifyAll(require("fs"));
const should = chai.should();


describe('Schemas are valid JSON', function() {
    let schemas;
    before('gets schemas', function() {
        return fs.readFileAsync(path.join(__dirname, '../environments.json'))
        .then(data => {
            const obj = JSON.parse(data);
            schemas = Object.keys(obj).map(key => obj[key]);
        });
    });

    it('Verifies all schemas are valid json', function () {
        return Promise.map(schemas,  (schema) => {
            const schemaPath = path.join(__dirname, '../node_modules', schema, 'schemas');
            return fs.readdirAsync(schemaPath)
                .then(files => Promise.map(files, filename =>
                    fs.readFileAsync(path.join(schemaPath, filename))
                        .then(data => ({ data, filename })))
                )
                .then(files => Promise.map(files, file => {
                    try {
                        return JSON.parse(file.data);
                    }
                    catch(e) {
                        console.log(file.filename, ' failed');
                        throw e;
                    }
                }));
            })
    });
});