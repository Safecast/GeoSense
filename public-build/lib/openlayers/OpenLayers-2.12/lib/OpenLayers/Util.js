/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * Function: pagePosition
 * Calculates the position of an element on the page (see
 * http://code.google.com/p/doctype/wiki/ArticlePageOffset)
 *
 * OpenLayers.Util.pagePosition is based on Yahoo's getXY method, which is
 * Copyright (c) 2006, Yahoo! Inc.
 * All rights reserved.
 * 
 * Redistribution and use of this software in source and binary forms, with or
 * without modification, are permitted provided that the following conditions
 * are met:
 * 
 * * Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 * 
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 * 
 * * Neither the name of Yahoo! Inc. nor the names of its contributors may be
 *   used to endorse or promote products derived from this software without
 *   specific prior written permission of Yahoo! Inc.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
 * POSSIBILITY OF SUCH DAMAGE.
 *
 * Parameters:
 * forElement - {DOMElement}
 * 
 * Returns:
 * {Array} two item array, Left value then Top value.
 */

/**
 * APIFunction: getScrollbarWidth
 * This function has been modified by the OpenLayers from the original version,
 *     written by Matthew Eernisse and released under the Apache 2 
 *     license here:
 * 
 *     http://www.fleegix.org/articles/2006/05/30/getting-the-scrollbar-width-in-pixels
 * 
 *     It has been modified simply to cache its value, since it is physically 
 *     impossible that this code could ever run in more than one browser at 
 *     once. 
 * 
 * Returns:
 * {Integer}
 */

OpenLayers.Util=OpenLayers.Util||{},OpenLayers.Util.getElement=function(){var e=[];for(var t=0,n=arguments.length;t<n;t++){var r=arguments[t];typeof r=="string"&&(r=document.getElementById(r));if(arguments.length==1)return r;e.push(r)}return e},OpenLayers.Util.isElement=function(e){return!!e&&e.nodeType===1},OpenLayers.Util.isArray=function(e){return Object.prototype.toString.call(e)==="[object Array]"},typeof window.$=="undefined"&&(window.$=OpenLayers.Util.getElement),OpenLayers.Util.removeItem=function(e,t){for(var n=e.length-1;n>=0;n--)e[n]==t&&e.splice(n,1);return e},OpenLayers.Util.indexOf=function(e,t){if(typeof e.indexOf=="function")return e.indexOf(t);for(var n=0,r=e.length;n<r;n++)if(e[n]==t)return n;return-1},OpenLayers.Util.modifyDOMElement=function(e,t,n,r,i,s,o,u){t&&(e.id=t),n&&(e.style.left=n.x+"px",e.style.top=n.y+"px"),r&&(e.style.width=r.w+"px",e.style.height=r.h+"px"),i&&(e.style.position=i),s&&(e.style.border=s),o&&(e.style.overflow=o),parseFloat(u)>=0&&parseFloat(u)<1?(e.style.filter="alpha(opacity="+u*100+")",e.style.opacity=u):parseFloat(u)==1&&(e.style.filter="",e.style.opacity="")},OpenLayers.Util.createDiv=function(e,t,n,r,i,s,o,u){var a=document.createElement("div");return r&&(a.style.backgroundImage="url("+r+")"),e||(e=OpenLayers.Util.createUniqueID("OpenLayersDiv")),i||(i="absolute"),OpenLayers.Util.modifyDOMElement(a,e,t,n,i,s,o,u),a},OpenLayers.Util.createImage=function(e,t,n,r,i,s,o,u){var a=document.createElement("img");e||(e=OpenLayers.Util.createUniqueID("OpenLayersDiv")),i||(i="relative"),OpenLayers.Util.modifyDOMElement(a,e,t,n,i,s,null,o);if(u){a.style.display="none";function f(){a.style.display="",OpenLayers.Event.stopObservingElement(a)}OpenLayers.Event.observe(a,"load",f),OpenLayers.Event.observe(a,"error",f)}return a.style.alt=e,a.galleryImg="no",r&&(a.src=r),a},OpenLayers.IMAGE_RELOAD_ATTEMPTS=0,OpenLayers.Util.alphaHackNeeded=null,OpenLayers.Util.alphaHack=function(){if(OpenLayers.Util.alphaHackNeeded==null){var e=navigator.appVersion.split("MSIE"),t=parseFloat(e[1]),n=!1;try{n=!!document.body.filters}catch(r){}OpenLayers.Util.alphaHackNeeded=n&&t>=5.5&&t<7}return OpenLayers.Util.alphaHackNeeded},OpenLayers.Util.modifyAlphaImageDiv=function(e,t,n,r,i,s,o,u,a){OpenLayers.Util.modifyDOMElement(e,t,n,r,s,null,null,a);var f=e.childNodes[0];i&&(f.src=i),OpenLayers.Util.modifyDOMElement(f,e.id+"_innerImage",null,r,"relative",o),OpenLayers.Util.alphaHack()&&(e.style.display!="none"&&(e.style.display="inline-block"),u==null&&(u="scale"),e.style.filter="progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+f.src+"', "+"sizingMethod='"+u+"')",parseFloat(e.style.opacity)>=0&&parseFloat(e.style.opacity)<1&&(e.style.filter+=" alpha(opacity="+e.style.opacity*100+")"),f.style.filter="alpha(opacity=0)")},OpenLayers.Util.createAlphaImageDiv=function(e,t,n,r,i,s,o,u,a){var f=OpenLayers.Util.createDiv(),l=OpenLayers.Util.createImage(null,null,null,null,null,null,null,a);return l.className="olAlphaImg",f.appendChild(l),OpenLayers.Util.modifyAlphaImageDiv(f,e,t,n,r,i,s,o,u),f},OpenLayers.Util.upperCaseObject=function(e){var t={};for(var n in e)t[n.toUpperCase()]=e[n];return t},OpenLayers.Util.applyDefaults=function(e,t){e=e||{};var n=typeof window.Event=="function"&&t instanceof window.Event;for(var r in t)if(e[r]===undefined||!n&&t.hasOwnProperty&&t.hasOwnProperty(r)&&!e.hasOwnProperty(r))e[r]=t[r];return!n&&t&&t.hasOwnProperty&&t.hasOwnProperty("toString")&&!e.hasOwnProperty("toString")&&(e.toString=t.toString),e},OpenLayers.Util.getParameterString=function(e){var t=[];for(var n in e){var r=e[n];if(r!=null&&typeof r!="function"){var i;if(typeof r=="object"&&r.constructor==Array){var s=[],o;for(var u=0,a=r.length;u<a;u++)o=r[u],s.push(encodeURIComponent(o===null||o===undefined?"":o));i=s.join(",")}else i=encodeURIComponent(r);t.push(encodeURIComponent(n)+"="+i)}}return t.join("&")},OpenLayers.Util.urlAppend=function(e,t){var n=e;if(t){var r=(e+" ").split(/[?&]/);n+=r.pop()===" "?t:r.length?"&"+t:"?"+t}return n},OpenLayers.Util.getImagesLocation=function(){return OpenLayers.ImgPath||OpenLayers._getScriptLocation()+"img/"},OpenLayers.Util.getImageLocation=function(e){return OpenLayers.Util.getImagesLocation()+e},OpenLayers.Util.Try=function(){var e=null;for(var t=0,n=arguments.length;t<n;t++){var r=arguments[t];try{e=r();break}catch(i){}}return e},OpenLayers.Util.getXmlNodeValue=function(e){var t=null;return OpenLayers.Util.Try(function(){t=e.text,t||(t=e.textContent),t||(t=e.firstChild.nodeValue)},function(){t=e.textContent}),t},OpenLayers.Util.mouseLeft=function(e,t){var n=e.relatedTarget?e.relatedTarget:e.toElement;while(n!=t&&n!=null)n=n.parentNode;return n!=t},OpenLayers.Util.DEFAULT_PRECISION=14,OpenLayers.Util.toFloat=function(e,t){return t==null&&(t=OpenLayers.Util.DEFAULT_PRECISION),typeof e!="number"&&(e=parseFloat(e)),t===0?e:parseFloat(e.toPrecision(t))},OpenLayers.Util.rad=function(e){return e*Math.PI/180},OpenLayers.Util.deg=function(e){return e*180/Math.PI},OpenLayers.Util.VincentyConstants={a:6378137,b:6356752.3142,f:1/298.257223563},OpenLayers.Util.distVincenty=function(e,t){var n=OpenLayers.Util.VincentyConstants,r=n.a,i=n.b,s=n.f,o=OpenLayers.Util.rad(t.lon-e.lon),u=Math.atan((1-s)*Math.tan(OpenLayers.Util.rad(e.lat))),a=Math.atan((1-s)*Math.tan(OpenLayers.Util.rad(t.lat))),f=Math.sin(u),l=Math.cos(u),c=Math.sin(a),h=Math.cos(a),p=o,d=2*Math.PI,v=20;while(Math.abs(p-d)>1e-12&&--v>0){var m=Math.sin(p),g=Math.cos(p),y=Math.sqrt(h*m*h*m+(l*c-f*h*g)*(l*c-f*h*g));if(y==0)return 0;var b=f*c+l*h*g,w=Math.atan2(y,b),E=Math.asin(l*h*m/y),S=Math.cos(E)*Math.cos(E),x=b-2*f*c/S,T=s/16*S*(4+s*(4-3*S));d=p,p=o+(1-T)*s*Math.sin(E)*(w+T*y*(x+T*b*(-1+2*x*x)))}if(v==0)return NaN;var N=S*(r*r-i*i)/(i*i),C=1+N/16384*(4096+N*(-768+N*(320-175*N))),k=N/1024*(256+N*(-128+N*(74-47*N))),L=k*y*(x+k/4*(b*(-1+2*x*x)-k/6*x*(-3+4*y*y)*(-3+4*x*x))),A=i*C*(w-L),O=A.toFixed(3)/1e3;return O},OpenLayers.Util.destinationVincenty=function(e,t,n){var r=OpenLayers.Util,i=r.VincentyConstants,s=i.a,o=i.b,u=i.f,a=e.lon,f=e.lat,l=n,c=r.rad(t),h=Math.sin(c),p=Math.cos(c),d=(1-u)*Math.tan(r.rad(f)),v=1/Math.sqrt(1+d*d),m=d*v,g=Math.atan2(d,p),y=v*h,b=1-y*y,w=b*(s*s-o*o)/(o*o),E=1+w/16384*(4096+w*(-768+w*(320-175*w))),S=w/1024*(256+w*(-128+w*(74-47*w))),x=l/(o*E),T=2*Math.PI;while(Math.abs(x-T)>1e-12){var N=Math.cos(2*g+x),C=Math.sin(x),k=Math.cos(x),L=S*C*(N+S/4*(k*(-1+2*N*N)-S/6*N*(-3+4*C*C)*(-3+4*N*N)));T=x,x=l/(o*E)+L}var A=m*C-v*k*p,O=Math.atan2(m*k+v*C*p,(1-u)*Math.sqrt(y*y+A*A)),M=Math.atan2(C*h,v*k-m*C*p),_=u/16*b*(4+u*(4-3*b)),D=M-(1-_)*u*y*(x+_*C*(N+_*k*(-1+2*N*N))),P=Math.atan2(y,-A);return new OpenLayers.LonLat(a+r.deg(D),r.deg(O))},OpenLayers.Util.getParameters=function(e){e=e===null||e===undefined?window.location.href:e;var t="";if(OpenLayers.String.contains(e,"?")){var n=e.indexOf("?")+1,r=OpenLayers.String.contains(e,"#")?e.indexOf("#"):e.length;t=e.substring(n,r)}var i={},s=t.split(/[&;]/);for(var o=0,u=s.length;o<u;++o){var a=s[o].split("=");if(a[0]){var f=a[0];try{f=decodeURIComponent(f)}catch(l){f=unescape(f)}var c=(a[1]||"").replace(/\+/g," ");try{c=decodeURIComponent(c)}catch(l){c=unescape(c)}c=c.split(","),c.length==1&&(c=c[0]),i[f]=c}}return i},OpenLayers.Util.lastSeqID=0,OpenLayers.Util.createUniqueID=function(e){return e==null&&(e="id_"),OpenLayers.Util.lastSeqID+=1,e+OpenLayers.Util.lastSeqID},OpenLayers.INCHES_PER_UNIT={inches:1,ft:12,mi:63360,m:39.3701,km:39370.1,dd:4374754,yd:36},OpenLayers.INCHES_PER_UNIT["in"]=OpenLayers.INCHES_PER_UNIT.inches,OpenLayers.INCHES_PER_UNIT.degrees=OpenLayers.INCHES_PER_UNIT.dd,OpenLayers.INCHES_PER_UNIT.nmi=1852*OpenLayers.INCHES_PER_UNIT.m,OpenLayers.METERS_PER_INCH=.0254000508001016,OpenLayers.Util.extend(OpenLayers.INCHES_PER_UNIT,{Inch:OpenLayers.INCHES_PER_UNIT.inches,Meter:1/OpenLayers.METERS_PER_INCH,Foot:.3048006096012192/OpenLayers.METERS_PER_INCH,IFoot:.3048/OpenLayers.METERS_PER_INCH,ClarkeFoot:.3047972651151/OpenLayers.METERS_PER_INCH,SearsFoot:.30479947153867626/OpenLayers.METERS_PER_INCH,GoldCoastFoot:.3047997101815088/OpenLayers.METERS_PER_INCH,IInch:.0254/OpenLayers.METERS_PER_INCH,MicroInch:254e-7/OpenLayers.METERS_PER_INCH,Mil:2.54e-8/OpenLayers.METERS_PER_INCH,Centimeter:.01/OpenLayers.METERS_PER_INCH,Kilometer:1e3/OpenLayers.METERS_PER_INCH,Yard:.9144018288036576/OpenLayers.METERS_PER_INCH,SearsYard:.914398414616029/OpenLayers.METERS_PER_INCH,IndianYard:.9143985307444408/OpenLayers.METERS_PER_INCH,IndianYd37:.91439523/OpenLayers.METERS_PER_INCH,IndianYd62:.9143988/OpenLayers.METERS_PER_INCH,IndianYd75:.9143985/OpenLayers.METERS_PER_INCH,IndianFoot:.30479951/OpenLayers.METERS_PER_INCH,IndianFt37:.30479841/OpenLayers.METERS_PER_INCH,IndianFt62:.3047996/OpenLayers.METERS_PER_INCH,IndianFt75:.3047995/OpenLayers.METERS_PER_INCH,Mile:1609.3472186944373/OpenLayers.METERS_PER_INCH,IYard:.9144/OpenLayers.METERS_PER_INCH,IMile:1609.344/OpenLayers.METERS_PER_INCH,NautM:1852/OpenLayers.METERS_PER_INCH,"Lat-66":110943.31648893273/OpenLayers.METERS_PER_INCH,"Lat-83":110946.25736872235/OpenLayers.METERS_PER_INCH,Decimeter:.1/OpenLayers.METERS_PER_INCH,Millimeter:.001/OpenLayers.METERS_PER_INCH,Dekameter:10/OpenLayers.METERS_PER_INCH,Decameter:10/OpenLayers.METERS_PER_INCH,Hectometer:100/OpenLayers.METERS_PER_INCH,GermanMeter:1.0000135965/OpenLayers.METERS_PER_INCH,CaGrid:.999738/OpenLayers.METERS_PER_INCH,ClarkeChain:20.1166194976/OpenLayers.METERS_PER_INCH,GunterChain:20.11684023368047/OpenLayers.METERS_PER_INCH,BenoitChain:20.116782494375872/OpenLayers.METERS_PER_INCH,SearsChain:20.11676512155/OpenLayers.METERS_PER_INCH,ClarkeLink:.201166194976/OpenLayers.METERS_PER_INCH,GunterLink:.2011684023368047/OpenLayers.METERS_PER_INCH,BenoitLink:.20116782494375873/OpenLayers.METERS_PER_INCH,SearsLink:.2011676512155/OpenLayers.METERS_PER_INCH,Rod:5.02921005842012/OpenLayers.METERS_PER_INCH,IntnlChain:20.1168/OpenLayers.METERS_PER_INCH,IntnlLink:.201168/OpenLayers.METERS_PER_INCH,Perch:5.02921005842012/OpenLayers.METERS_PER_INCH,Pole:5.02921005842012/OpenLayers.METERS_PER_INCH,Furlong:201.1684023368046/OpenLayers.METERS_PER_INCH,Rood:3.778266898/OpenLayers.METERS_PER_INCH,CapeFoot:.3047972615/OpenLayers.METERS_PER_INCH,Brealey:375/OpenLayers.METERS_PER_INCH,ModAmFt:.304812252984506/OpenLayers.METERS_PER_INCH,Fathom:1.8288/OpenLayers.METERS_PER_INCH,"NautM-UK":1853.184/OpenLayers.METERS_PER_INCH,"50kilometers":5e4/OpenLayers.METERS_PER_INCH,"150kilometers":15e4/OpenLayers.METERS_PER_INCH}),OpenLayers.Util.extend(OpenLayers.INCHES_PER_UNIT,{mm:OpenLayers.INCHES_PER_UNIT.Meter/1e3,cm:OpenLayers.INCHES_PER_UNIT.Meter/100,dm:OpenLayers.INCHES_PER_UNIT.Meter*100,km:OpenLayers.INCHES_PER_UNIT.Meter*1e3,kmi:OpenLayers.INCHES_PER_UNIT.nmi,fath:OpenLayers.INCHES_PER_UNIT.Fathom,ch:OpenLayers.INCHES_PER_UNIT.IntnlChain,link:OpenLayers.INCHES_PER_UNIT.IntnlLink,"us-in":OpenLayers.INCHES_PER_UNIT.inches,"us-ft":OpenLayers.INCHES_PER_UNIT.Foot,"us-yd":OpenLayers.INCHES_PER_UNIT.Yard,"us-ch":OpenLayers.INCHES_PER_UNIT.GunterChain,"us-mi":OpenLayers.INCHES_PER_UNIT.Mile,"ind-yd":OpenLayers.INCHES_PER_UNIT.IndianYd37,"ind-ft":OpenLayers.INCHES_PER_UNIT.IndianFt37,"ind-ch":20.11669506/OpenLayers.METERS_PER_INCH}),OpenLayers.DOTS_PER_INCH=72,OpenLayers.Util.normalizeScale=function(e){var t=e>1?1/e:e;return t},OpenLayers.Util.getResolutionFromScale=function(e,t){var n;if(e){t==null&&(t="degrees");var r=OpenLayers.Util.normalizeScale(e);n=1/(r*OpenLayers.INCHES_PER_UNIT[t]*OpenLayers.DOTS_PER_INCH)}return n},OpenLayers.Util.getScaleFromResolution=function(e,t){t==null&&(t="degrees");var n=e*OpenLayers.INCHES_PER_UNIT[t]*OpenLayers.DOTS_PER_INCH;return n},OpenLayers.Util.pagePosition=function(e){var t=[0,0],n=OpenLayers.Util.getViewportElement();if(!e||e==window||e==n)return t;var r=OpenLayers.IS_GECKO&&document.getBoxObjectFor&&OpenLayers.Element.getStyle(e,"position")=="absolute"&&(e.style.top==""||e.style.left==""),i=null,s;if(e.getBoundingClientRect){s=e.getBoundingClientRect();var o=n.scrollTop,u=n.scrollLeft;t[0]=s.left+u,t[1]=s.top+o}else if(document.getBoxObjectFor&&!r){s=document.getBoxObjectFor(e);var a=document.getBoxObjectFor(n);t[0]=s.screenX-a.screenX,t[1]=s.screenY-a.screenY}else{t[0]=e.offsetLeft,t[1]=e.offsetTop,i=e.offsetParent;if(i!=e)while(i)t[0]+=i.offsetLeft,t[1]+=i.offsetTop,i=i.offsetParent;var f=OpenLayers.BROWSER_NAME;if(f=="opera"||f=="safari"&&OpenLayers.Element.getStyle(e,"position")=="absolute")t[1]-=document.body.offsetTop;i=e.offsetParent;while(i&&i!=document.body){t[0]-=i.scrollLeft;if(f!="opera"||i.tagName!="TR")t[1]-=i.scrollTop;i=i.offsetParent}}return t},OpenLayers.Util.getViewportElement=function(){var e=arguments.callee.viewportElement;return e==undefined&&(e=OpenLayers.BROWSER_NAME=="msie"&&document.compatMode!="CSS1Compat"?document.body:document.documentElement,arguments.callee.viewportElement=e),e},OpenLayers.Util.isEquivalentUrl=function(e,t,n){n=n||{},OpenLayers.Util.applyDefaults(n,{ignoreCase:!0,ignorePort80:!0,ignoreHash:!0});var r=OpenLayers.Util.createUrlObject(e,n),i=OpenLayers.Util.createUrlObject(t,n);for(var s in r)if(s!=="args"&&r[s]!=i[s])return!1;for(var s in r.args){if(r.args[s]!=i.args[s])return!1;delete i.args[s]}for(var s in i.args)return!1;return!0},OpenLayers.Util.createUrlObject=function(e,t){t=t||{};if(!/^\w+:\/\//.test(e)){var n=window.location,r=n.port?":"+n.port:"",i=n.protocol+"//"+n.host.split(":").shift()+r;if(e.indexOf("/")===0)e=i+e;else{var s=n.pathname.split("/");s.pop(),e=i+s.join("/")+"/"+e}}t.ignoreCase&&(e=e.toLowerCase());var o=document.createElement("a");o.href=e;var u={};u.host=o.host.split(":").shift(),u.protocol=o.protocol,t.ignorePort80?u.port=o.port=="80"||o.port=="0"?"":o.port:u.port=o.port==""||o.port=="0"?"80":o.port,u.hash=t.ignoreHash||o.hash==="#"?"":o.hash;var a=o.search;if(!a){var f=e.indexOf("?");a=f!=-1?e.substr(f):""}return u.args=OpenLayers.Util.getParameters(a),u.pathname=o.pathname.charAt(0)=="/"?o.pathname:"/"+o.pathname,u},OpenLayers.Util.removeTail=function(e){var t=null,n=e.indexOf("?"),r=e.indexOf("#");return n==-1?t=r!=-1?e.substr(0,r):e:t=r!=-1?e.substr(0,Math.min(n,r)):e.substr(0,n),t},OpenLayers.IS_GECKO=function(){var e=navigator.userAgent.toLowerCase();return e.indexOf("webkit")==-1&&e.indexOf("gecko")!=-1}(),OpenLayers.CANVAS_SUPPORTED=function(){var e=document.createElement("canvas");return!!e.getContext&&!!e.getContext("2d")}(),OpenLayers.BROWSER_NAME=function(){var e="",t=navigator.userAgent.toLowerCase();return t.indexOf("opera")!=-1?e="opera":t.indexOf("msie")!=-1?e="msie":t.indexOf("safari")!=-1?e="safari":t.indexOf("mozilla")!=-1&&(t.indexOf("firefox")!=-1?e="firefox":e="mozilla"),e}(),OpenLayers.Util.getBrowserName=function(){return OpenLayers.BROWSER_NAME},OpenLayers.Util.getRenderedDimensions=function(e,t,n){var r,i,s=document.createElement("div");s.style.visibility="hidden";var o=n&&n.containerElement?n.containerElement:document.body,u=!1,a=null,f=o;while(f&&f.tagName.toLowerCase()!="body"){var l=OpenLayers.Element.getStyle(f,"position");if(l=="absolute"){u=!0;break}if(l&&l!="static")break;f=f.parentNode}u&&(o.clientHeight===0||o.clientWidth===0)&&(a=document.createElement("div"),a.style.visibility="hidden",a.style.position="absolute",a.style.overflow="visible",a.style.width=document.body.clientWidth+"px",a.style.height=document.body.clientHeight+"px",a.appendChild(s)),s.style.position="absolute",t&&(t.w?(r=t.w,s.style.width=r+"px"):t.h&&(i=t.h,s.style.height=i+"px")),n&&n.displayClass&&(s.className=n.displayClass);var c=document.createElement("div");c.innerHTML=e,c.style.overflow="visible";if(c.childNodes)for(var h=0,p=c.childNodes.length;h<p;h++){if(!c.childNodes[h].style)continue;c.childNodes[h].style.overflow="visible"}return s.appendChild(c),a?o.appendChild(a):o.appendChild(s),r||(r=parseInt(c.scrollWidth),s.style.width=r+"px"),i||(i=parseInt(c.scrollHeight)),s.removeChild(c),a?(a.removeChild(s),o.removeChild(a)):o.removeChild(s),new OpenLayers.Size(r,i)},OpenLayers.Util.getScrollbarWidth=function(){var e=OpenLayers.Util._scrollbarWidth;if(e==null){var t=null,n=null,r=0,i=0;t=document.createElement("div"),t.style.position="absolute",t.style.top="-1000px",t.style.left="-1000px",t.style.width="100px",t.style.height="50px",t.style.overflow="hidden",n=document.createElement("div"),n.style.width="100%",n.style.height="200px",t.appendChild(n),document.body.appendChild(t),r=n.offsetWidth,t.style.overflow="scroll",i=n.offsetWidth,document.body.removeChild(document.body.lastChild),OpenLayers.Util._scrollbarWidth=r-i,e=OpenLayers.Util._scrollbarWidth}return e},OpenLayers.Util.getFormattedLonLat=function(e,t,n){n||(n="dms"),e=(e+540)%360-180;var r=Math.abs(e),i=Math.floor(r),s=(r-i)/(1/60),o=s;s=Math.floor(s);var u=(o-s)/(1/60);u=Math.round(u*10),u/=10,u>=60&&(u-=60,s+=1,s>=60&&(s-=60,i+=1)),i<10&&(i="0"+i);var a=i+"°";return n.indexOf("dm")>=0&&(s<10&&(s="0"+s),a+=s+"'",n.indexOf("dms")>=0&&(u<10&&(u="0"+u),a+=u+'"')),t=="lon"?a+=e<0?OpenLayers.i18n("W"):OpenLayers.i18n("E"):a+=e<0?OpenLayers.i18n("S"):OpenLayers.i18n("N"),a};