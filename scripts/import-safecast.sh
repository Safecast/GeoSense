#!/bin/bash

node manage.js import --url https://api.safecast.org/system/measurements.csv --format csv --converter safecast --incremental
#scripts/reduce-points.sh