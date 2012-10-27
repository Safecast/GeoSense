#!/bin/bash

node ./manage.js import --url https://api.safecast.org/system/measurements.csv --converter safecast
node ./manage.js import --path ./public/data/earthquakes.csv --converter earthquakes
node ./manage.js import --path ./public/data/reactors.csv --converter reactors
./scripts/run-reduce-points.sh