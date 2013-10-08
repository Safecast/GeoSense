/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Date={toISOString:function(){if("toISOString"in Date.prototype)return function(e){return e.toISOString()};function e(e,t){var n=e+"";while(n.length<t)n="0"+n;return n}return function(t){var n;return isNaN(t.getTime())?n="Invalid Date":n=t.getUTCFullYear()+"-"+e(t.getUTCMonth()+1,2)+"-"+e(t.getUTCDate(),2)+"T"+e(t.getUTCHours(),2)+":"+e(t.getUTCMinutes(),2)+":"+e(t.getUTCSeconds(),2)+"."+e(t.getUTCMilliseconds(),3)+"Z",n}}(),parse:function(e){var t,n=e.match(/^(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:(?:T(\d{1,2}):(\d{2}):(\d{2}(?:\.\d+)?)(Z|(?:[+-]\d{1,2}(?::(\d{2}))?)))|Z)?$/);if(n&&(n[1]||n[7])){var r=parseInt(n[1],10)||0,i=parseInt(n[2],10)-1||0,s=parseInt(n[3],10)||1;t=new Date(Date.UTC(r,i,s));var o=n[7];if(o){var u=parseInt(n[4],10),a=parseInt(n[5],10),f=parseFloat(n[6]),l=f|0,c=Math.round(1e3*(f-l));t.setUTCHours(u,a,l,c);if(o!=="Z"){var h=parseInt(o,10),p=parseInt(n[8],10)||0,d=-1e3*(60*h*60+p*60);t=new Date(t.getTime()+d)}}}else t=new Date("invalid");return t}};