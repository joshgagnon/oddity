var express = require('express');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));
const nunjucks = require('nunjucks');
var JSZip = require("jszip");
const path = require('path');
const nunjucksEnvFactory = require('./nunjucksEnvFactory');
const fetch = require('node-fetch');
const FormData = require('form-data')

var app = express();
app.use(bodyParser.json());

const nunjucksEnviroments = {
    gc: nunjucksEnvFactory('good-companies-templates')
};


const DEFAULT_BASE_DOCUMENT_NAME = 'default.odt';

module.exports = function(config) {
    const port = config.server_port || 3000;

    app.listen(port, function () {
        console.log('Node server running at localhost:' + port);
    });

    app.post('/render', function (req, res) {
        let env;

        if (!!req.body.goodCompaniesTemplate) {
            env = nunjucksEnviroments.gc;
        }

        if (env) {
            const renderedContentXml = env.nunjucks.render(req.body.formName + '.njk', req.body.values);
            const filetype = req.body.values.fileType;
            const filename = !!req.body.values.filename ? req.body.values.filename : req.body.formName;

            const baseDocPath = path.join(env.baseDocsDir, DEFAULT_BASE_DOCUMENT_NAME);

            packZip(baseDocPath, renderedContentXml).then((odt) => {
                if (filetype != 'odt') {
                    // File needs converted
                    convert(odt, filename, filetype)
                        .then((response) => {
                            res.set('Content-Type', response.headers.get('Content-Type'));
                            res.set('Content-Disposition', response.headers.get('Content-Disposition'));

                            response.body
                                .on('data', chunk => res.write(chunk))
                                .on('end', chunk => res.end());
                        })
                        .catch(e => {
                            res.serverError(e);
                        });
                } else {
                    // User wants ODT, so file doesn't need converted
                    res.set('Content-Type', 'application/odt');
                    res.set('Content-Disposition', 'attachment; filename=' + filename + '.odt');
                    res.end(zip, 'binary');
                }
            });
        } else {
            res.set('Content-Type', 'application/json');
            res.status(400);
            res.end('Error: unknown service');
        }
    });

    function convert(file, filename, filetype) {
        let form = new FormData();

        form.append('fileType', filetype);
        form.append('file', file, {filename: filename + '.odt'});

        return fetch(config.convert_url, {
            method: 'POST',
            header: {
                'Accept': '*/*',
                'Content-type': 'multipart/form-data'
            },
            body: form
        });
    }

    function packZip(baseDocPath, contentXml) {
        return fs.readFileAsync(baseDocPath)
            .then((odt) => {
                return JSZip.loadAsync(odt)
                    .then((zip) => {
                        zip.file('content.xml', contentXml);
                        return zip.generateAsync({type: 'nodebuffer'});
                    });
            })
            .catch(error => console.log(error));
    }
}
