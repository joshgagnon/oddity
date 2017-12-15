const chai = require('chai');
const Promise = require('bluebird');
const path = require('path');
const fs = Promise.promisifyAll(require("fs"));
const should = chai.should();
const getEnvironments = require('../app/getEnvironments');
const render = require('../app/render');


describe('Test rendering for schemas with test data', function() {
    let envs, schemas, schemaMap;
    before('prep nunjucks and schemas', function() {
       return getEnvironments()
        .then(_envs => {
            envs = _envs;
            return fs.readFileAsync(path.join(__dirname, '../environments.json'))
        })
        .then(data => {
            const obj = JSON.parse(data);
            schemas = Object.keys(obj).map(key => obj[key]);
            schemaMap = Object.keys(obj).reduce((acc, key) => {
                acc[obj[key]] = key;
                return acc;
            }, {})
        });
    });

    it('reads test files', function () {
        return Promise.map(schemas,  (schema) => {
            const testPath = path.join(__dirname, '../node_modules', schema, 'test_data');
            return fs.readdirAsync(testPath)
                .then(schemaFolders => Promise.map(schemaFolders, folder =>
                    fs.readdirAsync(path.join(testPath, folder))
                    .then(files =>  Promise.map(files, filename =>
                        fs.readFileAsync(path.join(testPath, folder, filename))
                            .then(_data => {
                                data = JSON.parse(_data)
                                return render(envs[schemaMap[schema]], {values: data, formName: folder})
                            })
                        )
                    )
                ))
            })
    });
});