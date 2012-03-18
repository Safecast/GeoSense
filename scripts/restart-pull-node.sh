#!/bin/bash

cd /www/
git pull

if [ ! -d log ]; then 
  mkdir log
fi

npm install

pkill -f 'nodemon server.js'
NODE_ENV=production PORT=80 nohup nodemon server.js >> log/node.log &