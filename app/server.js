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
app.use(bodyParser.json({limit: '50mb'}));

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



function fromBase64(b64string){
    let buf;
    try{
        buf = Buffer.from(b64string, 'base64'); // Ta-da
    }catch(e){
        // older Node versions
        buf = new Buffer(b64string, 'base64'); // Ta-da
    }
    return buf;
}

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
            const embedMetadata = req.body.embedMetadata || false;
            const logo = req.body.metadata.logo;
            const namedImages = logo ? [{name: 'logo', data: fromBase64(logo)}] : null;
            const filetype = req.body.fileType || 'pdf';
            const filename = !!req.body.filename ? req.body.filename : req.body.formName;
            Ancillary.add(env.nunjucks, embedMetadata);
            env.nunjucks.renderAsync(req.body.formName + '.njk', Object.assign({}, req.body.values, {metadata: req.body.metadata}) )
            .then(renderedContentXml => {
                const ancillary = Ancillary.get();
                if(embedMetadata &&  ancillary.images.length){
                    return Promise.all(ancillary.images.map(encodeImage))
                        .then((images) => {
                            return packZip(env.defaultBaseDocPath, renderedContentXml, images, namedImages, env)
                        })
                }

                return packZip(env.defaultBaseDocPath, renderedContentXml, null, namedImages, env)
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

    function packZip(baseDocPath, contentXml, images, namedImages, env) {
        return fs.readFileAsync(baseDocPath)
            .then((odt) => {
                return JSZip.loadAsync(odt)
                    .then((zip) => {
                        if(images){
                            images.map((image, i) => zip.file('Pictures/'+i+'.png', image));
                            zip.file('META-INF/manifest.xml', env.nunjucks.render('manifest.njk', {images: images.map((image, i) => i)}));
                        }
                        if(namedImages){
                            namedImages.map((image) => zip.file('Pictures/'+image.name+'.png', image.data));
                            zip.file('META-INF/manifest.xml', env.nunjucks.render('manifest.njk', {images: namedImages.map((image, i) => image.name)}));
                        }

                        zip.file('content.xml', contentXml);
                        return zip.generateAsync({type: 'nodebuffer'});
                    });
            })
            .catch(error => console.log(error));
    }
}
