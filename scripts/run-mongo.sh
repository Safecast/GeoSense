#!/bin/bash

for i in /usr/local/Cellar/mongodb/*
do
	latest=$i
done

mongod run -v --config $latest/mongod.conf
