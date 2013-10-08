/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Geometry.MultiPoint=OpenLayers.Class(OpenLayers.Geometry.Collection,{componentTypes:["OpenLayers.Geometry.Point"],addPoint:function(e,t){this.addComponent(e,t)},removePoint:function(e){this.removeComponent(e)},CLASS_NAME:"OpenLayers.Geometry.MultiPoint"});