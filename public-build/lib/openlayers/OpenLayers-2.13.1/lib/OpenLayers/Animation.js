/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Animation=function(e){function o(e,t,n){t=t>0?t:Number.POSITIVE_INFINITY;var o=++i,u=+(new Date);return s[o]=function(){s[o]&&+(new Date)-u<=t?(e(),s[o]&&r(s[o],n)):delete s[o]},r(s[o],n),o}function u(e){delete s[e]}var t=OpenLayers.Util.vendorPrefix.js(e,"requestAnimationFrame"),n=!!t,r=function(){var n=e[t]||function(t,n){e.setTimeout(t,16)};return function(t,r){n.apply(e,[t,r])}}(),i=0,s={};return{isNative:n,requestFrame:r,start:o,stop:u}}(window);