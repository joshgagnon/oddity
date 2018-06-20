const path = require('path');
const nunjucks = require('nunjucks');
const moment = require('moment');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));


function filterise(env) {
    const date = function(date) {
        return moment(date, 'D MMMM YYYY').format('D MMMM YYYY');
    }

    const timestampToDate = function(date) {
        return moment(date).format('D MMMM YYYY');
    }

    const timestampToTime = function(date) {
        return moment(date).format('h:mm a');
    }

    // Get the value of an item - if there is an attribute specified, we need to use that as the key for the item
    const getValue = function (item, attribute) {
        if(Array.isArray(attribute)){
            if(attribute.length > 1){
                return getValue(item[attribute[0]], attribute.slice(1));
            }
            attribute = attribute[0];
        }
        return attribute ? item[attribute] : item;
    }

    const prepend = function(list, value) {
        return [value].concat(list);
    }

    // Take a list of items and format them in a string
    // item one
    // item one and item two
    // item one, item two, and item three
    const joinAnd = function(items, attribute, kwargs) {
        let result = '';
        const join = (kwargs && kwargs.join) || 'and';
        // If two items, just return them with the word and in-between
        if (items.length == 2) {
            return getValue(items[0], attribute) + ' '+join+' ' + getValue(items[1], attribute);
        }

        items.map((item, index) => {
            item = getValue(item, attribute);

            if (index == 0) {
                result = item;
            } else if (index < items.length - 1) {
                result += ', ' + item;
            } else {
                // Last item needs an 'and' before it
                result += ', '+join+' ' + item;
            }
        });

        return result;
    }

    const concat = function(items, attributes) {
        return items.map(item => {
            return attributes.map(attr => {
                let thisItem = item;
                if(Array.isArray(attr)){
                    attr.map(a => {
                        thisItem = thisItem[a];
                    });
                    attr = attr[attr.length - 1];
                }
                return thisItem[attr];
            }).join(' ');
        })
    }


    const exists = function(list, attribute, value) {
        for (let index = 0; index < list.length; index++) {
            if (list[index][attribute] && list[index][attribute] == value) {
                return true;
            }
        }

        return false;
    }
    const currency = function(x) {
        if(!x) {
            return '$0.00';
        }
        if(typeof x === 'string'){
            x = x.replace(/[^-0-9.]+/g, '');
        }
        x = parseFloat(x).toFixed(2);
        const parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return '$' + parts.join(".");
    }


    env.addFilter('date', date);
    env.addFilter('timestamp_to_date', timestampToDate);
    env.addFilter('timestamp_to_time', timestampToTime);
    env.addFilter('join_and', joinAnd);
    env.addFilter('concat', concat);
    env.addFilter('get_value', getValue);
    env.addFilter('exists', exists);
    env.addFilter('prepend', prepend);
    env.addFilter('currency', currency);
    return env;
}


const DEFAULT_BASE_DOCUMENT_NAME = 'default.odt';

function recurse(dir) {
    const readDir = (dir) => {
        return fs.readdirAsync(dir)
            .then(files => {
                return Promise.reduce(files, (acc, file) => {
                    return fs.statAsync(path.join(dir, file))
                        .then(stat => {
                            if(stat.isDirectory()){
                                return readDir(path.join(dir, file))
                                    .then(results => {
                                        acc = acc.concat(results);
                                        return acc;
                                    });
                            }
                            acc.push(path.join(dir, file))
                            return acc;
                        });
                    }, [])
                });
            };
        return readDir(dir);
}

function schemasAndCalculations(dir) {

    const base = dir
    const calculationPath = path.join(dir, 'calculations');
    const schemasPath = path.join(dir, 'schemas');
    const schemas = recurse(schemasPath)
        .then(files => {
            return Promise.reduce(files, (acc, file) => {
                if(file.endsWith('.json')){
                    return fs.readFileAsync(file)
                        .then(text => {
                            const json = JSON.parse(text);
                            acc[json.formName || file.replace(schemasPath+'/', '').replace('.json', '')] = json;
                            return acc;
                        });
                }
                return acc;
            }, [])
        })
        .catch(() => {})
    const calculations = recurse(calculationPath)
        .then(files => {
            return Promise.reduce(files, (acc, file) => {
                if(file.endsWith('.js')){
                    const js =  require(file);
                    acc[file.replace(calculationPath + '/', '').replace('.js', '')] = js;
                }
                return acc;
            }, {})
        })
        .catch((e) => {console.log(e);})
    return Promise.all([schemas, calculations])
        .spread((schemas, calculations) => {
            return {schemas, calculations};
        })
        .catch(e => {

            return {schemas: {}, calculations: {}}
        })
}

module.exports = function(directory) {
    const base = path.join(__dirname + '/../node_modules/', directory);
    const dir = path.join(base, '/templates/');
    const baseDocsDir = path.join(dir, '../base_documents/');
    const schemaDir = path.join(dir, '../schemas/');
    const calculationDir = path.join(dir, '../schemas/');
    let defaultBaseDocPath = path.join(baseDocsDir, DEFAULT_BASE_DOCUMENT_NAME);
    let envWithFilters;
    return Promise.all([schemasAndCalculations(base),
                       new nunjucks.FileSystemLoader(dir)])
        .spread(({schemas = {}, calculations = {}}, envLoader) => {
            const env = new nunjucks.Environment(envLoader);
            envWithFilters = filterise(env);
            return { baseDocsDir, schemaDir, defaultBaseDocPath, dir, nunjucks: envWithFilters, schemas, calculations };
        })

}
