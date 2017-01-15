var express = require('express');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));
const nunjucks = require('nunjucks')
var JSZip = require("jszip");
const moment = require('moment');

var app = express();
app.use(bodyParser.json());

var env = nunjucks.configure('templates', { autoescape: true });

env.addFilter('date', function(date) {
    return moment(date, 'YYYY-MM-DD').format('D MMM YYYY');
});

// Take a list of items and format them in a string
// item one
// item one and item two
// item one, item two, and item three
env.addFilter('join_and', function(items) {
    let result = '';

    // If two items, just return them with the word and in-between
    if (items.length == 2) {
        return items[0] + ' and ' + items[1];
    }

    items.map((item, index) => {
        // Last item needs an 'and' before it
        if (index == 0) {
            result = item;
        } if ((index - 1) != items.length) {
            result += ', ' + item;
        } else {
            result += ', and ' + item;
        }
    });

    return result;
});

// Take a list of objects and turn flatten it based on a single attribute
// flatten([{name: 'Tom'}, {name: 'Dick'}, {name: 'Harry'}], 'name')
// == ['Tom', 'Dick', 'Harry']
env.addFilter('flatten', function(list, attribute) {
    list.reduce((a, b) => {
        if (a[attribute]) {
            return [a[attribute]].concat(b[attribute]);
        }

        return a.concat(b[attribute]);
    });
});

env.addFilter('exists', function(list, attribute, value) {
    for (let index = 0; index < list.length; index++) {
        if (item[index][attribute] && item[index][attribute] == value) {
            return true;
        }
    }

    return false;
});

const DEFAULT_BASE_DOCUMENT = 'base_documents/default.odt';

const templates = [
    'board_resolution',
    'directors_certificate',
    'notice_of_meeting',
    'resignation_of_director'
];

module.exports = function(config) {
    const port = config.server_port || 3000;

    app.listen(port, function () {
        console.log('Node server running at localhost:' + port);
    });

    app.get('/', function (request, response) {
        if (templates.indexOf(request.query.template) == -1) {
            response.set('Content-Type', 'application/json');
            response.status(400);
            response.end('Error: unknown template');
        } else {
            const renderedContentXml = nunjucks.render(request.query.template, request.body);

            packZip(renderedContentXml).then((zip) => {
                response.set('Content-Type', 'application/zip');
                response.set('Content-Disposition', 'attachment; filename=file.zip');
                response.end(zip, 'binary');
            });
        }
    });
}

function packZip(contentXml) {
    return fs.readFileAsync(DEFAULT_BASE_DOCUMENT)
        .then((odt) => {
            return JSZip.loadAsync(odt)
                .then((zip) => {
                    zip.file('content.xml', contentXml);
                    return zip.generateAsync({type: 'nodebuffer'});
                });
        })
        .catch(error => console.log(error));
}
