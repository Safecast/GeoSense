/*!
 * dragtable - jquery ui widget to re-order table columns 
 * version 3.0
 * 
 * Copyright (c) 2010, Jesse Baird <jebaird@gmail.com>
 * 12/2/2010
 * https://github.com/jebaird/dragtable
 * 
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * 
 * 
 * 
 * Forked from https://github.com/akottr/dragtable - Andres Koetter akottr@gmail.com
 * 
 *
 * 
 * 
 * quick down and and dirty on how this works
 * ###########################################
 * so when a column is selected we grab all of the cells in that row and clone append them to a semi copy of the parent table and the 
 * "real" cells get a place holder class witch is removed when the dragstop event is triggered
 * 
 * TODO: 
 * add / create / edit css framework
 * add drag handles
 * click event to handle drag
 * ignore class
 * 
 * 
 * clean up the api - event driven like ui autocompleate
 * make it easy to have a button swap colums
 * 
 * 
 * Events
 * change - called after the col has been moved
 * displayHelper - called before the col has started moving TODO: change to beforeChange
 * 
 * IE notes
 * 	ie8 in quirks mode will only drag once after that the events are lost
 * 
 */

(function(e){e.widget("jb.dragtable",{eventWidgetPrefix:"dragtable",options:{dataHeader:"data-header",handle:"dragtable-drag-handle",items:"thead th:not( :has( .dragtable-drag-handle ) ), .dragtable-drag-handle"},tableElemIndex:{head:"0",body:"1",foot:"2"},_create:function(){this.startIndex=null,this.endIndex=null,this.currentColumnCollection=[],this.prevMouseX=0;var t=this,n=t.options,r=t.element;r.delegate(n.items,"mousedown."+t.widgetEventPrefix,function(i){var s=e(this),u=this.offsetLeft;s.hasClass(n.handle)&&(s=s.closest("th"),u=s[0].offsetLeft,t._positionOffset=i.pageX+u);var a=t.getCol(s.index());t._positionOffset=i.pageX-u;var f=t.currentColumnCollection[0].clientWidth/2,l=t._findElementPosition(r.parent()[0]);a.attr("tabindex",-1).focus().disableSelection().css({top:r[0].offsetTop,left:u}).insertAfter(t.element);var c=t.element[0].getElementsByTagName("thead")[0].getElementsByTagName("tr")[0].getElementsByTagName("th").length-1;t.prevMouseX=u,t._eventHelper("displayHelper",i,{draggable:a}),e(document).disableSelection().css("cursor","move").bind("mousemove."+t.widgetEventPrefix,function(e){var n=t._findElementPosition(t.currentColumnCollection[0]),r=Math.floor(t.currentColumnCollection[0].clientWidth/2);a.css("left",e.pageX-t._positionOffset);if(e.pageX<t.prevMouseX){var i=n.x-r;e.pageX-t._positionOffset<i&&(t._swapCol(t.startIndex-1),t._eventHelper("change",e))}else{var i=n.x+r*2;e.pageX>i&&c!=t.startIndex&&(t._swapCol(t.startIndex+1),t._eventHelper("change",e))}t.prevMouseX=e.pageX}).one("mouseup.dragtable",function(){e(document).css({cursor:"auto"}).enableSelection().unbind("mousemove."+t.widgetEventPrefix),t._dropCol(a),t.prevMouseX=0})})},_setOption:function(t,n){e.Widget.prototype._setOption.apply(this,arguments)},_getCells:function(e,t){var n=this.tableElemIndex,r={semantic:{0:[],1:[],2:[]},array:[]};if(t<=-1||typeof e.rows[0].cells[t]=="undefined")return r;for(var i=0,s=e.rows.length;i<s;i++){var o=e.rows[i].cells[t],u=o.parentNode.parentNode.nodeName;r.array.push(o),/^tbody|TBODY/.test(u)?r.semantic[n.body].push(o):/^thead|THEAD/.test(u)?r.semantic[n.head].push(o):/^tfoot|TFOOT/.test(u)&&r.semantic[n.foot].push(o)}return r},_getChildren:function(){var e=this.element[0].childNodes,t=[];for(var n=0,r=e.length;n<r;n++){var i=e[n];i.nodeType==1&&t.push(i)}return t},_getElementAttributes:function(e){var t="",n=e.attributes;for(var r=0,i=n.length;r<i;r++)t+=n[r].nodeName+'="'+n[r].nodeValue+'"';return t},_swapNodes:function(e,t){var n=e.parentNode,r=e.nextSibling===t?e:e.nextSibling;t.parentNode.insertBefore(e,t),n.insertBefore(t,r)},_swapCells:function(e,t){e.parentNode.insertBefore(t,e)},_findElementPosition:function(e){if(typeof e.offsetParent!="undefined"){for(var t=0,n=0;e;e=e.offsetParent)t+=e.offsetLeft,n+=e.offsetTop;return{x:t,y:n}}return{x:e.x,y:e.y}},_eventHelper:function(t,n,r){this._trigger(t,n,e.extend({column:this.currentColumnCollection,order:this.order()},r))},getCol:function(t){var n=this.element,r=this,i=r.tableElemIndex,s=e("<table "+r._getElementAttributes(n[0])+"></table>").addClass("dragtable-drag-col");r.startIndex=r.endIndex=t;var o=r._getCells(n[0],t);return r.currentColumnCollection=o.array,e.each(o.semantic,function(e,t){if(t.length==0)return;if(e=="0"){var n=document.createElement("thead");s[0].appendChild(n)}else{var n=document.createElement("tbody");s[0].appendChild(n)}for(var r=0,i=t.length;r<i;r++){var o=t[r].cloneNode(!0);t[r].className+=" dragtable-col-placeholder";var u=document.createElement("tr");u.appendChild(o),n.appendChild(u)}}),s=e('<div class="dragtable-drag-wrapper"></div>').append(s),s},_swapCol:function(e){if(e==this.startIndex)return!1;var t=this.startIndex;this.endIndex=e;if(t<e)for(var n=t;n<e;n++){var r=this._getCells(this.element[0],n+1);for(var i=0,s=r.array.length;i<s;i++)this._swapCells(this.currentColumnCollection[i],r.array[i])}else for(var n=t;n>e;n--){var r=this._getCells(this.element[0],n-1);for(var i=0,s=r.array.length;i<s;i++)this._swapCells(r.array[i],this.currentColumnCollection[i])}this.startIndex=this.endIndex},_dropCol:function(e){var t=this;e&&e.remove();for(var n=0,r=t.currentColumnCollection.length;n<r;n++){var i=t.currentColumnCollection[n];i.className=i.className.replace(" dragtable-col-placeholder","")}},order:function(t){var n=this,r=n.element,i=n.options,s=r.find("thead tr:first").children("th");if(t==undefined){var o=[];return s.each(function(){var t=this.getAttribute(i.dataHeader);t==null&&(t=e(this).text()),o.push(t)}),o}if(t.length!=s.length)return n;for(var u=0,a=t.length;u<a;u++){var f=s.filter("["+i.dataHeader+"="+t[u]+"]").index();f!=-1&&(n.startIndex=f,n.currentColumnCollection=n._getCells(n.element[0],f).array,n._swapCol(u))}return n._eventHelper("change",{}),n},destroy:function(){var e=this,t=e.options;this.element.undelegate(t.items,"mousedown."+e.widgetEventPrefix)}})})(jQuery);