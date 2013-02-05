## What is GeoSense?

GeoSense is an open publishing platform for visualization, social sharing, and analysis of geospatial data. It aims to simplify the process of turning large 
data collections into beautiful, interactive online maps.

## How to install GeoSense on your development machine

The project is built on top of [Node.js](http://nodejs.org/) and uses 
[mongoDB](http://www.mongodb.org/) as database. Please install Node.js with 
NPM and mongoDB on your system first. There are installers and packages 
available for many operating systems. For instance, if you are using OS X
you might want to look into installing the above requirements with 
[Homebrew](http://mxcl.github.com/homebrew/), to name just one option. This 
[tutorial](http://dreamerslab.com/blog/en/how-to-setup-a-node-js-development-environment-on-mac-osx-lion/) is a starting point.

To get the GeoSense code, you can either download it from 
[GitHub](https://github.com/Safecast/GeoSense) and extract it to a folder on
your hard drive, or clone the repository using [Git](http://git-scm.com/). 
The latter is recommended so you can easily update to newer versions at a 
later point):

	$ git clone git://github.com/Safecast/GeoSense.git

Next, change into the GeoSense folder and install the dependencies using NPM:

	$ cd GeoSense
	$ npm install

You should now be ready to run the GeoSense development server.


## Running the development server

Before you run the development server, make sure to start mongoDB, either in 
its own terminal window:

	$ mongod

or as a background service:

	$ mongod --fork --logpath /var/log/mongodb.log

You can then run the development server using the following command from the 
GeoSense folder:

	$ node server.js NODE_ENV=development node server.js

You should get a success message such as `Web server running at 
http://0.0.0.0:3000/`. You'll now be able to open GeoSense in your web
browser by typing `http://localhost:3000` in the location field.


## Command-line interface

In addition to the Graphical User Interface running in your web browser, 
GeoSense comes with a Command-Line Interface (CLI) that enables you to script 
certain tasks and perform them without user interaction. CLI actions include
data import and aggregation into map grids.

To run the CLI, run the following command from the GeoSense folder:

	$ node manage.js

This will display a list of available CLI actions, such as `import`. For 
example, to display a list of all existing point collections in the database, 
type:

	$ node manage.js list-collections

To receive more information about a specific action, pass `help` followed by 
the action name to the CLI, for instance:

	$ node manage.js help import


### The `import` action

Usage: `node manage.js import [import-params]`

Imports records from a URL or a file into a new point collection.

For example, to import a new data file from scratch, type:

	$ node ./manage.js import --url https://api.safecast.org/system/measurements.csv --format csv --converter safecast

*or*

	$ node ./manage.js import --path path/to/file.csv --format csv --converter safecast

Later, after the initial import, you might want to re-fetch the source file and sync your local data:

	$ node ./manage.js sync <collectionId> [options]

This basically runs the import command again, with the same arguments. You can override these by passing options to the command, for instance the following would sync the collection with data from a *different* URL>:

	$ node ./manage.js sync <collectionId> --url https://api.safecast.org/api/<incremental-dump>


### The `mapreduce` action

TODO: document most important CLI actions.


## Building the project for deployment

GeoSense utilizes [RequireJS](http://requirejs.org/) to create an optimized 
build for faster page load times. To create a build, run the following command 
from the GeoSense folder:

	$ node r.js -o public/libs/app.build.js

You now have an optimized copy of the `public/` folder ready for deployment 
under `public-build`.
