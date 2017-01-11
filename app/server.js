const moment = require('moment');
var express = require('express');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
var path = require('path');
const fs = Promise.promisifyAll(require("fs"));
const nunjucks = require('nunjucks')

var app = express();
app.use(bodyParser.json());

module.exports = function(config) {
    const port = config.server_port || 3000;

    app.get('/', function (request, response) {
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

        nunjucks.configure('templates', { autoescape: true });
        const xml = nunjucks.render('board_resolution.njk', data);

        fs.writeFileSync('./tmp/out.xml', xml, 'utf8');
        response.end('done\n');
    });

    app.listen(port, function () {
        console.log('Node server running at localhost:' + port);
    });
}
