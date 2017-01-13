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

const DEFAULT_BASE_DOCUMENT = 'base_documents/default.odt';

const tempaltes = [
    'board_resolution',
];

module.exports = function(config) {
    const port = config.server_port || 3000;

    app.listen(port, function () {
        console.log('Node server running at localhost:' + port);
    });

    app.get('/', function (request, response) {
        console.log(request.query);
        const renderedContentXml = nunjucks.render('board_resolution.njk', request.body);

        packZip(renderedContentXml).then((zip) => {
            response.set('Content-Type', 'application/zip')
            response.set('Content-Disposition', 'attachment; filename=file.zip');
            response.end(zip, 'binary');
        });
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
