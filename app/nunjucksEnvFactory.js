const path = require('path');
const nunjucks = require('nunjucks')

function filterise(env) {
    const date = function(date) {
        return moment(date, 'YYYY-MM-DD').format('D MMM YYYY');
    }

    const timestampToDate = function(date) {
        return moment(date, 'YYYY-MM-DD').format('D MMM YYYY');
    }

    const timestampToTime = function(date) {
        return moment(date, 'YYYY-MM-DD').format('D MMM YYYY');
    }

    // Take a list of items and format them in a string
    // item one
    // item one and item two
    // item one, item two, and item three
    const joinAnd = function(items, attribute) {
        let result = '';

        // If two items, just return them with the word and in-between
        if (items.length == 2) {
            return items[0] + ' and ' + items[1];
        }

        items.map((item, index) => {
            item = attribute ? item[attribute] : item;

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
    env.addFilter('exists', exists);

    return env;
}

module.exports = function(directory) {
    const dir = path.join(__dirname + '../node_modules/', directory, '/templates/');
    const baseDocsDir = path.join(dir, 'base_documents/');

    const envLoader = new nunjucks.FileSystemLoader(dir, { autoescape: true });
    let env = new nunjucks.Environment(envLoader);
    env = filterise(env);
    
    return { baseDocsDir, dir, nunjucks: env };
}
