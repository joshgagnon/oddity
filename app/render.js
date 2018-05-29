const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));
const JSZip = require("jszip");
const nunjucks = Promise.promisifyAll(require('nunjucks'));
const sanitize = require("sanitize-filename")
const path = require('path');


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

    function packZip(formName, baseDocPath, contentXml, images, namedImages, env) {
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
                        try{
                            zip.file('styles.xml', env.nunjucks.render('styles/' + formName + '.njk'));
                        }
                        catch(e) {
                            // no style file
                        }
                        zip.file('content.xml', contentXml);

                        return zip.generateAsync({
                            type: 'nodebuffer',
                            platform: "UNIX",
                            compression: "DEFLATE"
                        });
                    });
            })
            .catch(error => {
                console.log(error);
                throw error;
            });
    }

module.exports = function render(env, body){
    const embedMetadata = body.embedMetadata || false;
    const logo = (body.metadata || {}).logo;
    const namedImages = logo ? [{name: 'logo', data: fromBase64(logo)}] : null;
    Ancillary.add(env.nunjucks, embedMetadata);
    const formName = sanitize(body.formName);
    let baseDoc = env.defaultBaseDocPath;

    console.log("rendering: ", formName)
    let defaultBaseDocPath = env.defaultBaseDocPath;
    let mappings = {};
    return fs.readFileAsync(path.join(env.schemaDir, formName + '.json'))
        .then((file) => {
            const schema = JSON.parse(file);
            if(schema.baseDoc){
                defaultBaseDocPath = path.join(env.baseDocsDir, schema.baseDoc);
            }
            mappings = schema.mappings || {};
        })
        .catch(e => {})
        .then(() => {
            console.log('using base doc', defaultBaseDocPath);
            return env.nunjucks.renderAsync(formName + '.njk', Object.assign({}, body.values, {metadata: body.metadata, mappings: mappings}) )
       })
        .then(renderedContentXml => {
            const ancillary = Ancillary.get();
            if(embedMetadata &&  ancillary.images.length){
                return Promise.all(ancillary.images.map(encodeImage))
                    .then((images) => {
                        return packZip(formName, defaultBaseDocPath, renderedContentXml, images, namedImages, env)
                    })
            }

            return packZip(formName, defaultBaseDocPath, renderedContentXml, null, namedImages, env)
        })
}