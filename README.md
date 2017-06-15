# Oddity

## Required

pm2 installed globally

## Startup
npm install

pm2 start server.js --name oddity -x -- config.json

# Working with templates

Using Nunjucks we build XML to be placed in an ODT. For now we are only generating the content.xml file.

To see more about the ODT document spec, see https://www.oasis-open.org/committees/download.php/6037/office-spec-1.0-cd-1.pdf
