git pull
rm -r node_modules/good-companies-templates/
rm -r node_modules/court-costs-templates/
rm -r node_modules/el-templates/
rm -r node_modules/anthony-harper-templates/
npm install
pm2 restart oddity_production
