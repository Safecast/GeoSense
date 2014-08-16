/*! Copyright (c) 2013 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.1.0
 *
 * Requires: 1.2.2+
 */

(function(e){typeof define=="function"&&define.amd?define(["jquery"],e):e(jQuery)})(function(e){function o(t){var n=t||window.event,s=[].slice.call(arguments,1),o=0,u=0,a=0,f=0,l=0;t=e.event.fix(n),t.type="mousewheel",n.wheelDelta&&(o=n.wheelDelta),n.detail&&(o=n.detail*-1),n.deltaY&&(a=n.deltaY*-1,o=a),n.deltaX&&(u=n.deltaX,o=u*-1),n.wheelDeltaY!==undefined&&(a=n.wheelDeltaY),n.wheelDeltaX!==undefined&&(u=n.wheelDeltaX*-1),f=Math.abs(o);if(!r||f<r)r=f;l=Math.max(Math.abs(a),Math.abs(u));if(!i||l<i)i=l;return s.unshift(t,Math.floor(o/r),Math.floor(u/i),Math.floor(a/i)),(e.event.dispatch||e.event.handle).apply(this,s)}var t=["wheel","mousewheel","DOMMouseScroll"],n="onwheel"in document||document.documentMode>=9?["wheel"]:["mousewheel","DomMouseScroll","MozMousePixelScroll"],r,i;if(e.event.fixHooks)for(var s=t.length;s;)e.event.fixHooks[t[--s]]=e.event.mouseHooks;e.event.special.mousewheel={setup:function(){if(this.addEventListener)for(var e=n.length;e;)this.addEventListener(n[--e],o,!1);else this.onmousewheel=o},teardown:function(){if(this.removeEventListener)for(var e=n.length;e;)this.removeEventListener(n[--e],o,!1);else this.onmousewheel=null}},e.fn.extend({mousewheel:function(e){return e?this.bind("mousewheel",e):this.trigger("mousewheel")},unmousewheel:function(e){return this.unbind("mousewheel",e)}})});