/*
 * Jugl.js -- JavaScript Template Library
 *
 * Copyright 2007-2010 Tim Schaub
 * Released under the MIT license.  Please see 
 * http://github.com/tschaub/jugl/blob/master/license.txt for the full license.
 */

(function(){var e={prefix:"jugl",namespaceURI:null,loadTemplate:function(e){var t=function(t){var n,r,i=!t.status||t.status>=200&&t.status<300;if(i){try{n=t.responseXML,r=new s(n.documentElement)}catch(o){n=document.createElement("div"),n.innerHTML=t.responseText,r=new s(n.firstChild)}e.callback&&e.callback.call(e.scope,r)}else e.failure&&e.failure.call(e.scope,t)};r(e.url,t)}},t=function(e,t){e=e||{},t=t||{};for(var n in t)e[n]=t[n];return e},n=function(e,t){var n,r,i,s,o;if(typeof e=="string"){n=document.getElementById(e);if(!n)throw Error("Element id not found: "+e);e=n}if(typeof t=="string"){n=document.getElementById(t);if(!n)throw Error("Element id not found: "+t);t=n}if(t.namespaceURI&&t.xml){r=document.createElement("div"),r.innerHTML=t.xml,i=r.childNodes;for(s=0,o=i.length;s<o;++s)e.appendChild(i[s])}else e.ownerDocument&&e.ownerDocument.importNode&&e.ownerDocument!==t.ownerDocument&&(t=e.ownerDocument.importNode(t,!0)),e.appendChild(t);return t},r=function(e,t,n){var r;if(typeof XMLHttpRequest!="undefined")r=new XMLHttpRequest;else{if(typeof ActiveXObject=="undefined")throw new Error("XMLHttpRequest not supported");r=new ActiveXObject("Microsoft.XMLHTTP")}r.open("GET",e),r.onreadystatechange=function(){r.readyState===4&&t.call(n,r)},r.send(null)},i=function(e,t){this.template=e,this.node=t,this.scope={},this.scope.repeat={}};t(i.prototype,{clone:function(){var e=this.node.cloneNode(!0);e.removeAttribute("id");var n=new i(this.template,e);return t(n.scope,this.scope),n},getAttribute:function(t){var n;this.node.nodeType===1&&(this.template.usingNS?n=this.node.getAttributeNodeNS(e.namespaceURI,t):n=this.node.getAttributeNode(e.prefix+":"+t),n&&!n.specified&&(n=!1));var r;return n?r=new o(this,n,t):r=n,r},setAttribute:function(e,t){this.node.setAttribute(e,t)},removeAttributeNode:function(e){this.node.removeAttributeNode(e.node)},getChildNodes:function(){var e=this.node.childNodes.length,n=new Array(e),r;for(var s=0;s<e;++s)r=new i(this.template,this.node.childNodes[s]),r.scope=t({},this.scope),n[s]=r;return n},removeChildNodes:function(){while(this.node.hasChildNodes())this.node.removeChild(this.node.firstChild)},removeChild:function(e){return this.node.removeChild(e.node),node},removeSelf:function(){this.node.parentNode.removeChild(this.node)},importNode:function(e){this.node.ownerDocument&&this.node.ownerDocument.importNode&&e.node.ownerDocument!==this.node.ownerDocument&&(e.node=this.node.ownerDocument.importNode(e.node,!0))},appendChild:function(e){this.importNode(e),this.node.appendChild(e.node)},insertAfter:function(e){this.importNode(e);var t=this.node.parentNode,n=this.node.nextSibling;n?t.insertBefore(e.node,n):t.appendChild(e.node)},insertBefore:function(e){this.importNode(e);var t=this.node.parentNode;t.insertBefore(e.node,this.node)},process:function(){var e,t=!0,n=["define","condition","repeat"];for(var r=0,i=n.length;r<i;++r){e=this.getAttribute(n[r]);if(e){t=e.process();if(!t)return}}var s=this.getAttribute("content");if(s)s.process();else{var o=this.getAttribute("replace");o&&o.process()}var u=this.getAttribute("attributes");u&&u.process(),!s&&!o&&this.processChildNodes();var a=this.getAttribute("omit-tag");a&&a.process();var f=this.getAttribute("reflow");f&&f.process()},processChildNodes:function(){var e=this.getChildNodes();for(var t=0,n=e.length;t<n;++t)e[t].process()}});var s=function(e){e=e||{};if(typeof e=="string"||e.nodeType===1)e={node:e};if(typeof e.node=="string"){e.node=document.getElementById(e.node);if(!e.node)throw Error("Element id not found: "+e.node)}e.node?(this.node=e.node,this.loaded=!0):e.url&&this.load({url:e.url,callback:e.callback,scope:e.scope})};t(s.prototype,{node:null,usingNS:!1,xmldom:window.ActiveXObject?new ActiveXObject("Microsoft.XMLDOM"):null,trimSpace:/^\s*(\w+)\s+(.*?)\s*$/,loaded:!1,loading:!1,process:function(r){var s,o;r=t({context:null,clone:!1,string:!1},r),this.usingNS=this.node.getAttributeNodeNS&&e.namespaceURI,s=new i(this,this.node);if(r.clone||r.string)s=s.clone();return r.context&&(s.scope=r.context),s.process(),r.string?s.node.innerHTML?o=s.node.innerHTML:this.xmldom?o=s.node.xml:o=(new XMLSerializer).serializeToString(s.node):(o=s.node,r.parent&&(r.clone?o=n(r.parent,s.node):this.appendTo(r.parent))),o},load:function(t){typeof t=="string"&&(t={url:t}),t=t||{},this.loading=!0;var n=function(e){this.node=e.node,this.loading=!1,this.loaded=!0,t.callback&&t.callback.apply(t.scope,[e])},r;t.failure&&(r=function(){return function(e){t.failure.call(t.scope,e)}}()),e.loadTemplate({url:t.url,callback:n,failure:r,scope:this})},appendTo:function(e){return this.node=n(e,this.node),this}});var o=function(e,t,n){this.element=e,this.node=t,this.type=n,this.nodeValue=t.nodeValue,this.nodeName=t.nodeName,this.template=e.template};t(o.prototype,{splitAttributeValue:function(e){e=e!=null?e:this.nodeValue;var t=this.template.trimSpace.exec(e);return t&&t.length===3&&[t[1],t[2]]},splitExpressionPrefix:function(){var e=this.splitAttributeValue();if(!e||e[0]!="structure"&&e[0]!="text")e=[null,this.nodeValue];return e},getAttributeValues:function(){return this.nodeValue.replace(/[\t\n]/g,"").replace(/;\s*$/,"").replace(/;;/g,"	").split(";").join("\n").replace(/\t/g,";").split(/\n/g)},removeSelf:function(){this.element.removeAttributeNode(this)},process:function(){return this.processAttribute[this.type].apply(this,[])},evalInScope:function(e){var t=this.element.scope,n=[],r=[];for(key in t)n.push(key),r.push(t[key]);var i=new Function(n.join(","),"return "+e);return i.apply({},r)},processAttribute:{define:function(){var e,t,n,r=this.getAttributeValues();for(t=0,n=r.length;t<n;++t)e=this.splitAttributeValue(r[t]),this.element.scope[e[0]]=this.evalInScope(e[1]);return this.removeSelf(),!0},condition:function(){var e=!!this.evalInScope(this.nodeValue);return this.removeSelf(),e||this.element.removeSelf(),e},repeat:function(){var e=this.splitAttributeValue(),t=e[0],n=this.evalInScope(e[1]);this.removeSelf();if(!(n instanceof Array)){var r=new Array;for(var i in n)r.push(i);n=r}var s,o=this.element;for(var u=0,a=n.length;u<a;++u)s=this.element.clone(),s.scope[t]=n[u],s.scope.repeat[t]={index:u,number:u+1,even:!(u%2),odd:!!(u%2),start:u===0,end:u===a-1,length:a},o.insertAfter(s),s.process(),o=s;return this.element.removeSelf(),!1},content:function(){var e=this.splitExpressionPrefix(),t=this.evalInScope(e[1]);this.removeSelf();if(e[0]==="structure")try{this.element.node.innerHTML=t}catch(n){var r=document.createElement("div");r.innerHTML=t;if(this.element.node.xml&&this.template.xmldom){while(this.element.node.firstChild)this.element.node.removeChild(this.element.node.firstChild);this.template.xmldom.loadXML(r.outerHTML);var s=this.template.xmldom.firstChild.childNodes;for(var o=0,u=s.length;o<u;++o)this.element.node.appendChild(s[o])}else this.element.node.innerHTML=r.innerHTML}else{var a;this.element.node.xml&&this.template.xmldom?a=this.template.xmldom.createTextNode(t):a=document.createTextNode(t);var f=new i(this.template,a);this.element.removeChildNodes(),this.element.appendChild(f)}return!0},replace:function(){var e=this.splitExpressionPrefix(),t=this.evalInScope(e[1]);this.removeSelf();if(e[0]==="structure"){var n=document.createElement("div");n.innerHTML=t,this.element.node.xml&&this.template.xmldom&&(this.template.xmldom.loadXML(n.outerHTML),n=this.template.xmldom.firstChild);while(n.firstChild){var r=n.removeChild(n.firstChild);this.element.node.ownerDocument&&this.element.node.ownerDocument.importNode&&r.ownerDocument!=this.element.node.ownerDocument&&(r=this.element.node.ownerDocument.importNode(r,!0)),this.element.node.parentNode.insertBefore(r,this.element.node)}}else{var s;this.element.node.xml&&this.template.xmldom?s=this.template.xmldom.createTextNode(t):s=document.createTextNode(t);var o=new i(this.template,s);this.element.insertBefore(o)}return this.element.removeSelf(),!0},attributes:function(){var e=this.getAttributeValues(),t,n,r;for(var i=0,s=e.length;i<s;++i)t=this.splitAttributeValue(e[i]),n=t[0],r=this.evalInScope(t[1]),r!==!1&&this.element.setAttribute(n,r);return this.removeSelf(),!0},"omit-tag":function(){var e=this.nodeValue===""||!!this.evalInScope(this.nodeValue);this.removeSelf();if(e){var t=this.element.getChildNodes();for(var n=0,r=t.length;n<r;++n)this.element.insertBefore(t[n]);this.element.removeSelf()}},reflow:function(){var e=this.nodeValue===""||!!this.evalInScope(this.nodeValue);this.removeSelf(),e&&(this.element.node.outerHTML?this.element.node.outerHTML=this.element.node.outerHTML:this.element.node.innerHTML=this.element.node.innerHTML)}}}),window.jugl=t(e,{Template:s})})();