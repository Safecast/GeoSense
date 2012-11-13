#!/bin/bash

#node ./manage.js import --url https://api.safecast.org/system/measurements.csv --converter safecast
node ./manage.js import --path ~/tmp/measurements.csv --converter safecast 
node ./manage.js import --path ./public/data/earthquakes.csv --converter earthquakes 
node ./manage.js import --path ./public/data/reactors.csv --converter reactors
mongo geo ./scripts/safecast_defaults.js
./scripts/run-reduce-points.sh