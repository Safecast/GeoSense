/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Spherical=OpenLayers.Spherical||{},OpenLayers.Spherical.DEFAULT_RADIUS=6378137,OpenLayers.Spherical.computeDistanceBetween=function(e,t,n){var r=n||OpenLayers.Spherical.DEFAULT_RADIUS,i=Math.sin(Math.PI*(t.lon-e.lon)/360),s=Math.sin(Math.PI*(t.lat-e.lat)/360),o=s*s+i*i*Math.cos(Math.PI*e.lat/180)*Math.cos(Math.PI*t.lat/180);return 2*r*Math.atan2(Math.sqrt(o),Math.sqrt(1-o))},OpenLayers.Spherical.computeHeading=function(e,t){var n=Math.sin(Math.PI*(e.lon-t.lon)/180)*Math.cos(Math.PI*t.lat/180),r=Math.cos(Math.PI*e.lat/180)*Math.sin(Math.PI*t.lat/180)-Math.sin(Math.PI*e.lat/180)*Math.cos(Math.PI*t.lat/180)*Math.cos(Math.PI*(e.lon-t.lon)/180);return 180*Math.atan2(n,r)/Math.PI};