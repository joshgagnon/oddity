const express = require('express');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));

const JSZip = require("jszip");
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data')
const getEnvironments = require('./getEnvironments');
const render = require('./render')
let app = express(), nunjucksEnviroments;

app.use(bodyParser.json({limit: '50mb'}));


module.exports = function(config) {
    const port = config.server_port || 3000;


    app.get('/status', function(req, res) {
        res.sendFile(__dirname + "/static/" + "status.html");
    })

    app.post('/render', function (req, res) {
        let env;
        // paddy, fix this
        if (!!req.body.goodCompaniesTemplate) {
            env = nunjucksEnviroments.gc;
        }
        else {
            env = nunjucksEnviroments.el;
        }
        const filetype = req.body.fileType || 'pdf';
        const filename = !!req.body.filename ? req.body.filename : req.body.formName;
        if (env) {
            return render(env, req.body)
            .then((odt) => {
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
                            console.log(e);
                            res.status(500).send({message: 'failed to render', error: e});
                        });
                } else {
                    // User wants ODT, so file doesn't need converted
                    res.set('Content-Type', 'application/odt');
                    res.set('Content-Disposition', 'attachment; filename=' + filename + '.odt');
                    res.end(odt, 'binary');
                }
            })
            .catch((e) => {
                console.log(e);
                res.status(500).send({message: 'failed to render', error: e});
            })
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
                'Content-Type': 'multipart/form-data'
            },
            body: form
        });
    }

    function encodeImage(data) {
        return fetch(config.encode_url, {
            method: 'POST',
            header: {
                'Accept': '*/*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(res => {
            return res.buffer()
        })

    }



    Promise.all([getEnvironments()])
        .spread((envs) => {
            nunjucksEnviroments = envs;
            app.listen(port, function () {
                console.log('Node server running at localhost:' + port);
            });
        });
}
