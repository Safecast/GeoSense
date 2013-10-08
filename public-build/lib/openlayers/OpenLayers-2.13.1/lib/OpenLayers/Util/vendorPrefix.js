/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Util=OpenLayers.Util||{},OpenLayers.Util.vendorPrefix=function(){function i(e){return e?e.replace(/([A-Z])/g,function(e){return"-"+e.toLowerCase()}).replace(/^ms-/,"-ms-"):null}function s(e){if(n[e]===undefined){var t=e.replace(/(-[\s\S])/g,function(e){return e.charAt(1).toUpperCase()}),r=u(t);n[e]=i(r)}return n[e]}function o(t,n){if(r[n]===undefined){var i,s=0,o=e.length,u,a=typeof t.cssText!="undefined";r[n]=null;for(;s<o;s++){u=e[s],u?(a||(u=u.toLowerCase()),i=u+n.charAt(0).toUpperCase()+n.slice(1)):i=n;if(t[i]!==undefined){r[n]=i;break}}}return r[n]}function u(e){return o(t,e)}var e=["","O","ms","Moz","Webkit"],t=document.createElement("div").style,n={},r={};return{css:s,js:o,style:u,cssCache:n,jsCache:r}}();