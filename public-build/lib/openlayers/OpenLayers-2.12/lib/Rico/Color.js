/** 
 * @requires Rico/license.js
 * @requires OpenLayers/Console.js
 * @requires OpenLayers/BaseTypes/Class.js
 * @requires OpenLayers/BaseTypes/Element.js
 */

OpenLayers.Console.warn("OpenLayers.Rico is deprecated"),OpenLayers.Rico=OpenLayers.Rico||{},OpenLayers.Rico.Color=OpenLayers.Class({initialize:function(e,t,n){this.rgb={r:e,g:t,b:n}},setRed:function(e){this.rgb.r=e},setGreen:function(e){this.rgb.g=e},setBlue:function(e){this.rgb.b=e},setHue:function(e){var t=this.asHSB();t.h=e,this.rgb=OpenLayers.Rico.Color.HSBtoRGB(t.h,t.s,t.b)},setSaturation:function(e){var t=this.asHSB();t.s=e,this.rgb=OpenLayers.Rico.Color.HSBtoRGB(t.h,t.s,t.b)},setBrightness:function(e){var t=this.asHSB();t.b=e,this.rgb=OpenLayers.Rico.Color.HSBtoRGB(t.h,t.s,t.b)},darken:function(e){var t=this.asHSB();this.rgb=OpenLayers.Rico.Color.HSBtoRGB(t.h,t.s,Math.max(t.b-e,0))},brighten:function(e){var t=this.asHSB();this.rgb=OpenLayers.Rico.Color.HSBtoRGB(t.h,t.s,Math.min(t.b+e,1))},blend:function(e){this.rgb.r=Math.floor((this.rgb.r+e.rgb.r)/2),this.rgb.g=Math.floor((this.rgb.g+e.rgb.g)/2),this.rgb.b=Math.floor((this.rgb.b+e.rgb.b)/2)},isBright:function(){var e=this.asHSB();return this.asHSB().b>.5},isDark:function(){return!this.isBright()},asRGB:function(){return"rgb("+this.rgb.r+","+this.rgb.g+","+this.rgb.b+")"},asHex:function(){return"#"+this.rgb.r.toColorPart()+this.rgb.g.toColorPart()+this.rgb.b.toColorPart()},asHSB:function(){return OpenLayers.Rico.Color.RGBtoHSB(this.rgb.r,this.rgb.g,this.rgb.b)},toString:function(){return this.asHex()}}),OpenLayers.Rico.Color.createFromHex=function(e){if(e.length==4){var t=e,e="#";for(var n=1;n<4;n++)e+=t.charAt(n)+t.charAt(n)}e.indexOf("#")==0&&(e=e.substring(1));var r=e.substring(0,2),i=e.substring(2,4),s=e.substring(4,6);return new OpenLayers.Rico.Color(parseInt(r,16),parseInt(i,16),parseInt(s,16))},OpenLayers.Rico.Color.createColorFromBackground=function(e){var t=OpenLayers.Element.getStyle(OpenLayers.Util.getElement(e),"backgroundColor");if(t=="transparent"&&e.parentNode)return OpenLayers.Rico.Color.createColorFromBackground(e.parentNode);if(t==null)return new OpenLayers.Rico.Color(255,255,255);if(t.indexOf("rgb(")==0){var n=t.substring(4,t.length-1),r=n.split(",");return new OpenLayers.Rico.Color(parseInt(r[0]),parseInt(r[1]),parseInt(r[2]))}return t.indexOf("#")==0?OpenLayers.Rico.Color.createFromHex(t):new OpenLayers.Rico.Color(255,255,255)},OpenLayers.Rico.Color.HSBtoRGB=function(e,t,n){var r=0,i=0,s=0;if(t==0)r=parseInt(n*255+.5),i=r,s=r;else{var o=(e-Math.floor(e))*6,u=o-Math.floor(o),a=n*(1-t),f=n*(1-t*u),l=n*(1-t*(1-u));switch(parseInt(o)){case 0:r=n*255+.5,i=l*255+.5,s=a*255+.5;break;case 1:r=f*255+.5,i=n*255+.5,s=a*255+.5;break;case 2:r=a*255+.5,i=n*255+.5,s=l*255+.5;break;case 3:r=a*255+.5,i=f*255+.5,s=n*255+.5;break;case 4:r=l*255+.5,i=a*255+.5,s=n*255+.5;break;case 5:r=n*255+.5,i=a*255+.5,s=f*255+.5}}return{r:parseInt(r),g:parseInt(i),b:parseInt(s)}},OpenLayers.Rico.Color.RGBtoHSB=function(e,t,n){var r,i,s,o=e>t?e:t;n>o&&(o=n);var u=e<t?e:t;n<u&&(u=n),s=o/255,o!=0?i=(o-u)/o:i=0;if(i==0)r=0;else{var a=(o-e)/(o-u),f=(o-t)/(o-u),l=(o-n)/(o-u);e==o?r=l-f:t==o?r=2+a-l:r=4+f-a,r/=6,r<0&&(r+=1)}return{h:r,s:i,b:s}};