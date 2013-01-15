## What's GeoSense?

An open publishing platform for visualization, social sharing, and data analysis of geospatial data.

## Building

Step 1: Run "node r.js -o public/libs/app.build.js" from project root
Step 2: Overwrite public with public-optimized before pushing to Heroku

## Management commands

# Importing a new file from scratch:

	node ./manage.js import --url https://api.safecast.org/system/measurements.csv --format csv --converter safecast

*or*

	node ./manage.js import --path path/to/file.csv --format csv --converter safecast

# Later, after the initial import, you might want to re-fetch the source file and sync your local data:

	node ./manage.js sync <collectionId> [options]

T# his basically runs the import command again, with the same arguments. You can override these by passing options to the command, for instance the following would sync the collection with data from a *different* URL>:

	node ./manage.js sync <collectionId> --url https://api.safecast.org/api/<incremental-dump>


## Updating and re-crunching a collection

cd into project root on production server
node ./manage.js sync Safecast
mongo penny.mongohq.com:10065/app4772485 -u USER -p PASSWORD ./config.js ./scripts/reduce-points.js


## Running Dev server

	NODE_ENV=development nodemon server.js

## Mongo dumping and cloning

	mongodump -d geo -o ./dump
	mongorestore -h penny.mongohq.com:10065 -d DATABASE -u USER -p PASSWORD --drop ./dump/geo/

# For dev server:
	
	mongorestore -d geo  --drop ./dump/geo/

# For prod server:

	 mongorestore -h penny.mongohq.com:10065 -d app4772485 -u safecast -p PASSWORD --drop ./dump/geo/


## Executing reduction script

	mongo DATABASE -u USER -p SEKRET config.js scripts/reduce-points.js

# For dev server:

	mongo geo config.js scripts/reduce-points.js