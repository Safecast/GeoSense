#!/usr/bin/env sh
scripts/flush-db.sh geosense_test
if [ -z "$1" ] 
	then
		DB_URI="mongodb://localhost/geosense_test" mocha geogoose/test/ test/  --globals toGeoJSON,finalState --timeout 30000
	else
		DB_URI="mongodb://localhost/geosense_test" mocha $1 --timeout 10000
fi
