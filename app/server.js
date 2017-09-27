var express = require('express');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));
const nunjucks = Promise.promisifyAll(require('nunjucks'));
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

const Ancillary = new function() {
    let _ancillary = {
        images: []
    }

    function addAncillary(env, use){
        _ancillary = {
            images:[]
        }
        env.addGlobal('useDataImage', () => {
            return use;
        });
        env.addGlobal('addDataImage', (data) => {
            const index = _ancillary.images.length;
            _ancillary.images.push(data);
            return index;
        });
    }

    function getAncillary(){
        return _ancillary;
    }
    this.add = addAncillary;
    this.get = getAncillary;
 }()



module.exports = function(config) {
    const port = config.server_port || 3000;

    app.listen(port, function () {
        console.log('Node server running at localhost:' + port);
    });

    app.get('/status', function(req, res) {
        res.sendFile(__dirname + "/static/" + "status.html");
    })

    app.post('/render', function (req, res) {
        let env;

        if (!!req.body.goodCompaniesTemplate) {
            env = nunjucksEnviroments.gc;
        }

        if (env) {
            const embedMetadata = req.body.embedMetadata;

            const filetype = req.body.values.fileType;
            const filename = !!req.body.values.filename ? req.body.values.filename : req.body.formName;
            Ancillary.add(env.nunjucks, embedMetadata);


            env.nunjucks.renderAsync(req.body.formName + '.njk', req.body.values )
            .then(renderedContentXml => {
                const ancillary = Ancillary.get();
                if(embedMetadata &&  ancillary.images.length){
                    return Promise.all(ancillary.images.map(encodeImage))
                        .then((images) => {
                            return packZip(env.defaultBaseDocPath, renderedContentXml, images, env)
                        })
                }
                return packZip(env.defaultBaseDocPath, renderedContentXml)
            })
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
                            res.serverError(e);
                        });
                } else {
                    // User wants ODT, so file doesn't need converted
                    res.set('Content-Type', 'application/odt');
                    res.set('Content-Disposition', 'attachment; filename=' + filename + '.odt');
                    res.end(odt, 'binary');
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

    function packZip(baseDocPath, contentXml, images, env) {
        return fs.readFileAsync(baseDocPath)
            .then((odt) => {
                return JSZip.loadAsync(odt)
                    .then((zip) => {
                        if(images){
                            images.map((image, i) => zip.file('Pictures/'+i+'.png', image));
                            zip.file('META-INF/manifest.xml', env.nunjucks.render('manifest.njk', {images: images.map((image, i) => i)}));
                        }
                        zip.file('content.xml', contentXml);
                        return zip.generateAsync({type: 'nodebuffer'});
                    });
            })
            .catch(error => console.log(error));
    }
}
