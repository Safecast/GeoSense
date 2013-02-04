function formatLargeNumber(e){if(e>1e6)e=Math.round(e/1e6*10)/10+"M";else if(e>5e3)e=Math.round(e/1e3)+"K";else if(e>1e3)return parseInt(e);return e}function formatDecimalNumber(e,t){if(e<10){t==null&&(t=2);var n=Math.pow(10,t);return Math.round(e*n)/n}return Math.round(e)}function autoFormatNumber(e){return e>1e3?formatLargeNumber(e):e%1!=0?formatDecimalNumber(e):e}function getURLParameter(e){var t=window.location.search.substring(1),n,r,i=t.split("&");for(n=0;n<i.length;n++){r=i[n].split("=");if(r[0]==e)return unescape(r[1])}return null}function genQueryString(e,t){var n="";if(e instanceof Array)for(var r=0;r<e.length;r++)n+=(n!=""?"&":"")+t+"="+e[r];else for(var t in e)e[t]instanceof Array?n+=(n!=""?"&":"")+genQueryString(e[t],t):n+=(n!=""?"&":"")+t+"="+e[t];return n}function nl2p(e){return e="<p>"+e.replace(/(\s*\n\s*){2}/,"</p><p>")+"</p>",e=e.replace(/(\s*\n\s*){1}/,"<br />"),e}function mathEval(exp){var reg=/(?:[a-z$_][a-z0-9$_]*)|(?:[;={}\[\]"'!&<>^\\?:])/ig,valid=!0;exp=exp.replace(reg,function(e){if(Math.hasOwnProperty(e))return"Math."+e;valid=!1});if(!valid)return console.log("Invalid arithmetic expression"),!1;try{return eval(exp)}catch(e){return console.log("Invalid arithmetic expression"),!1}}function ValFormatter(e){this.eq=e.eq,this.formatStr=e.formatStr,this.unit=e.unit}function __(e,t){var n=locale.strings[e]||e;return t?n.format(t):n}function zeroPad(e,t){return(new Array(e.length<t?t+1-e.length:0)).join("0")+e}function multRGB(e,t){var n=parseInt(e.replace("#","0x")),r=[(n&16711680)>>16,(n&65280)>>8,n&255];for(var i=r.length-1;i>=0;i--)r[i]=Math.min(255,Math.round(r[i]*t));return n=(r[0]<<16)+(r[1]<<8)+r[2],"#"+zeroPad(n.toString(16),6)}function wktCircle(e,t,n,r){var i=[],s=2*Math.PI/r;for(var o=0;o<Math.PI*2;o+=s)i.push(e.x+Math.cos(o)*t+" "+(e.y+Math.sin(o)*n));return"POLYGON(("+i.join(", ")+"))"}function genMapURI(e,t,n,r,i){var s=(r?"/admin":"")+(i?"/"+e[i]:"")+(t&&t!=""?"/"+t:"");return n&&n.x!=undefined&&n.y!=undefined&&(s+="/%(x)s,%(y)s",n.zoom!=undefined&&(s+=",%(zoom)s")),s.format(n)}function genMapURL(e,t,n){var r=!DEV&&!n&&e.host&&e.host!="";if(r)var i="http://"+e.host;else var i=BASE_URL;return i+genMapURI(e,t?t.mapViewName:null,t,n,r?!1:n?"adminslug":"publicslug")}define([],function(){return{}}),$.fn.updateFeedback=function(){this.each(function(){$(this).tempGlow({textColor:"#00C9FF",haloColor:"#008cbf",duration:1e3})})},$.fn.blink=function(){var e;(e=function(){progressElement.delay(1e3).animate({opacity:1},"slow").delay(1e3).animate({opacity:.2},"slow",e)})()};var lpad=function(e,t,n){var r=new String(e);while(r.length<n)r=t+r;return r};ValFormatter.prototype.format=function(e){if(this.eq){var t=this.eq.format({val:e});e=mathEval(t)}return this.formatStr?this.formatStr.format({val:e}):autoFormatNumber(e)},String.prototype.format=function(e){return this.replace(/\%\(([a-z0-9_]+)\)([sif])/ig,function(t,n,r){return typeof e[n]!="undefined"?e[n]:t})},Date.prototype.format=function(e){var t=this;return e.replace(/\%([a-z0-9_]+)/ig,function(e,n,r){return typeof t.formatReplacements[n]!="undefined"?t.formatReplacements[n].call(t):e})},Date.prototype.formatReplacements={d:function(){return lpad(this.getDate(),"0",2)},m:function(){return lpad(this.getMonth()+1,"0",2)},Y:function(){return this.getFullYear()},y:function(){return(new String(this.getFullYear())).substr(2,2)},B:function(){return locale.MONTH_NAMES[this.getMonth()]},b:function(){return locale.ABBR_MONTH_NAMES[this.getMonth()]}};