/**
 * Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. 
 *
 * @requires OpenLayers/SingleFile.js
 */

OpenLayers.Animation=function(e){function s(e,t,s){t=t>0?t:Number.POSITIVE_INFINITY;var o=++r,u=+(new Date);return i[o]=function(){i[o]&&+(new Date)-u<=t?(e(),i[o]&&n(i[o],s)):delete i[o]},n(i[o],s),o}function o(e){delete i[e]}var t=!!(e.requestAnimationFrame||e.webkitRequestAnimationFrame||e.mozRequestAnimationFrame||e.oRequestAnimationFrame||e.msRequestAnimationFrame),n=function(){var t=e.requestAnimationFrame||e.webkitRequestAnimationFrame||e.mozRequestAnimationFrame||e.oRequestAnimationFrame||e.msRequestAnimationFrame||function(t,n){e.setTimeout(t,16)};return function(n,r){t.apply(e,[n,r])}}(),r=0,i={};return{isNative:t,requestFrame:n,start:s,stop:o}}(window);