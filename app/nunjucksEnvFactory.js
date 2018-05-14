const path = require('path');
const nunjucks = require('nunjucks');
const moment = require('moment');

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
    const joinAnd = function(items, attribute) {
        let result = '';

        // If two items, just return them with the word and in-between
        if (items.length == 2) {
            return getValue(items[0], attribute) + ' and ' + getValue(items[1], attribute);
        }

        items.map((item, index) => {
            item = getValue(item, attribute);

            if (index == 0) {
                result = item;
            } else if (index < items.length - 1) {
                result += ', ' + item;
            } else {
                // Last item needs an 'and' before it
                result += ', and ' + item;
            }
        });

        return result;
    }

    const concat = function(items, attributes) {
        return items.map(item => {
            return attributes.map(attr => {
                return item[attr]
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
            return '$0';
        }
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

module.exports = function(directory) {
    const dir = path.join(__dirname + '/../node_modules/', directory, '/templates/');
    const baseDocsDir = path.join(dir, '../base_documents/');
    const schemaDir = path.join(dir, '../schemas/');
    const defaultBaseDocPath = path.join(baseDocsDir, DEFAULT_BASE_DOCUMENT_NAME);

    const envLoader = new nunjucks.FileSystemLoader(dir, { autoescape: true });
    const env = new nunjucks.Environment(envLoader);
    const envWithFilters = filterise(env);

    return { baseDocsDir, schemaDir, defaultBaseDocPath, dir, nunjucks: envWithFilters };
}
