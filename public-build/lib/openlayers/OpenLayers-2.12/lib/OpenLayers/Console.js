/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Console={log:function(){},debug:function(){},info:function(){},warn:function(){},error:function(){},userError:function(e){alert(e)},assert:function(){},dir:function(){},dirxml:function(){},trace:function(){},group:function(){},groupEnd:function(){},time:function(){},timeEnd:function(){},profile:function(){},profileEnd:function(){},count:function(){},CLASS_NAME:"OpenLayers.Console"},function(){var e=document.getElementsByTagName("script");for(var t=0,n=e.length;t<n;++t)if(e[t].src.indexOf("firebug.js")!=-1&&console){OpenLayers.Util.extend(OpenLayers.Console,console);break}}();