#!/usr/bin/env sh
scripts/flush-db.sh geosense_test
DB_URI="mongodb://localhost/geosense_test" mocha geogoose/test/ test/  --globals toGeoJSON,finalState --timeout 10000
