#!/usr/bin/env sh
scripts/flush-db.sh geosense_test
DB_PATH="mongodb://localhost/geosense_test" mocha geogoose/test/ test/  --globals toGeoJSON --timeout 10000