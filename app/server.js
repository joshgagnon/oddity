var express = require('express');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));
const nunjucks = require('nunjucks')
var JSZip = require("jszip");

var app = express();
app.use(bodyParser.json());

nunjucks.configure('templates', { autoescape: true });

const DEFAULT_BASE_DOCUMENT = 'base_documents/default.odt';

module.exports = function(config) {
    const port = config.server_port || 3000;

    app.get('/', function (request, response) {
        response.end('done\n');
    });

    app.get('/test', function (request, response) {
        

        packZip(renderTemplate());

        // var templateOdt = new AdmZip('./template_odt.odt');



        // var zip = new AdmZip();
        // const zipEntries = zip.getEntries();

        // zip.addFile('contents.xml', new Buffer('inner content of the file'), 'entry comment goes here');
        // const completeFile = zip.toBuffer((buffer) => console.log(buffer), (error) => console.log(error));
        // // zip.writeZip('./done.odt');

        response.end('done\n');
    });

    app.listen(port, function () {
        console.log('Node server running at localhost:' + port);
    });
}

function packZip(contentXml) {
    return fs.readFileAsync(DEFAULT_BASE_DOCUMENT)
        .then((odt) => {
            return JSZip.loadAsync(odt)
                .then((zip) => {
                    zip.file('content.xml', contentXml);

                    return zip.generateAsync({type: 'nodebuffer'})
                        .then((odtBuffer) => {
                            fs.writeFileSync('test.odt', odtBuffer);
                        });
                });
        })
        .catch(error => console.log(error));
}

function renderTemplate() {
    const data = {
        company: {
            companyName: "CATALEX LIMITED",
            companyNumber: 366352
        },
        resolutionOptions: {
            resolutionType: 'Resolution at Board Meeting',
            dateOfMinute: '2015-10-08',
            chairperson: {
                name: 'Testing Chairperson Name'
            }
        },
        resolution: {
            dateOfBoardMeeting: '2015-09-31'
        },
        resolutions: [{
            individualResolutionType: 'Custom',
            resolutionOptions: {
                text: 'testing testing testing one two three'
            }
        },{
            individualResolutionType: 'Change Company Name',
            resolutionOptions: {
                newCompanyName: 'NEW COMPANY NAME',
                effectiveDate: '2016-05-04'
            }
        },{
            individualResolutionType: 'Records in Good Companies'
        },{
            individualResolutionType: 'Agent for Company Changes',
            resolutionOptions: {
                nameOfAuthorisedAgent: 'Paddy Moran'
            }
        }],
        notes: [
            'one two three four',
            'lorem ipsum'
        ]
    };

    return nunjucks.render('board_resolution.njk', data);
}
