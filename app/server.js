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

    app.listen(port, function () {
        console.log('Node server running at localhost:' + port);
    });

    app.get('/', function (request, response) {
        const renderedContentXml = nunjucks.render('board_resolution.njk', testData);

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

const testData = {
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
