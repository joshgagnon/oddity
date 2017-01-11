cd ./tmp/repack_work_area
cp ../out.xml ./content.xml

rm .DS_Store # IMPORTANT - ODT will be corrupt if one of these exists
zip -r ../finished.odt * -x mimetype # -r = recursive, -x mimetype = exclude mimetype file
