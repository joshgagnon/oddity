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
        return attribute ? item[attribute] : item;
    }

    // Take a list of items and format them in a string
    // item one
    // item one and item two
    // item one, item two, and item three
    const joinAnd = function(items, attribute) {
        let result = '';

        // If two items, just return them with the word and in-between
        if (items.length == 2) {
            return getValue(items[0]) + ' and ' + getValue(items[1]);
        }

        items.map((item, index) => {
            item = getValue(item);

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

    const exists = function(list, attribute, value) {
        for (let index = 0; index < list.length; index++) {
            if (list[index][attribute] && list[index][attribute] == value) {
                return true;
            }
        }

        return false;
    }

    env.addFilter('date', date);
    env.addFilter('timestamp_to_date', timestampToDate);
    env.addFilter('timestamp_to_time', timestampToTime);
    env.addFilter('join_and', joinAnd);
    env.addFilter('get_value', getValue);
    env.addFilter('exists', exists);

    return env;
}

const DEFAULT_BASE_DOCUMENT_NAME = 'default.odt';

module.exports = function(directory) {
    const dir = path.join(__dirname + '/../node_modules/', directory, '/templates/');

    const baseDocsDir = path.join(dir, '../base_documents/');
    const defaultBaseDocPath = path.join(baseDocsDir, DEFAULT_BASE_DOCUMENT_NAME);

    const envLoader = new nunjucks.FileSystemLoader(dir, { autoescape: true });
    const env = new nunjucks.Environment(envLoader);
    const envWithFilters = filterise(env);
    
    return { baseDocsDir, defaultBaseDocPath, dir, nunjucks: envWithFilters };
}
