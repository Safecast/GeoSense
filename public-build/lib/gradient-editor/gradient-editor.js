//
// Copyright 2011, Google Inc.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//

(function(e){e.fn.gradientEditor=function(t){function r(e,t){for(var n=0;n<t.length;++n){var r=t[n];e.addColorStop(r.position,r.color)}}function i(e,n){var i=e.createLinearGradient(0,0,t.width,0);return r(i,n),i}function s(e){return"-webkit-linear-gradient(left, red, green, blue);";var t,i}function o(e){var t=parseInt(e.indexOf("#")>-1?e.substring(1):e,16);return{r:(t&16711680)>>16,g:(t&65280)>>8,b:(t&255)>>0,a:255}}var n={width:512,height:40,stopWidth:12,stopHeight:10,initialColor:"#ff00ff",onChange:function(){},colors:[{position:0,color:"#000000"},{position:1,color:"#ffffff"}]},t=e.extend(n,t);return this.each(function(){function w(n,i){var s={color:i,position:n,inside:!0};g.push(s),m=s;var a=e('<div class="gradient-editor-color-stop"><div class="gradient-editor-color"></div></div>'),f=e(".gradient-editor-color",a);a.css({width:t.stopWidth,height:t.stopHeight}),f.css({width:t.stopWidth,height:t.stopHeight,backgroundColor:i}),s.setColor=function(e){s.color=e,f.css("backgroundColor",e)},a.draggable({axis:"x",containment:"parent",cursor:"pointer",drag:function(n,i){var o=!1,a=e(n.target).parent().offset(),l=n.pageY-a.top,c=Math.min(1,Math.max(0,i.position.left/t.width));n.altKey||(u=!0),l<20?s.inside?n.altKey&&u&&(u=!1,w(c,r)):(s.inside=!0,g.push(s),f.show(),o=!0):l>=20&&s.inside&&(g.splice(g.indexOf(s),1),s.inside=!1,f.hide(),o=!0),c!=s.position&&(s.position=c,o=!0),o&&T(!0)},start:function(e,t){m=s,d.ColorPickerSetColor(o(s.color)),u=!0},stop:function(e,t){s.inside||(m=null,a.draggable("destroy"),p.remove(a))}}),a.mousedown(function(e){m=s,r=s.color,d.ColorPickerSetColor(o(s.color))}),p.append(a);var l=""+Math.floor(n*t.width)+" 0";a.position({my:"left",at:"left",of:p,offset:l})}function x(e){var t=[];for(var n=0;n<e.length;++n){var r=e[n];t.push({position:r.position,color:r.color})}return t}function T(e){b.fillStyle=i(b,g),b.fillRect(0,0,t.width,t.height),e&&t.onChange(x(g))}var n=Math.floor(t.stopWidth/2),r=t.initialColor,u=!1,a=e(this);a.html('<div class="gradient-editor-container"><div class="gradient-editor-gradient"><canvas></canvas></div><div class="gradient-editor-colors"></div><div class="gradient-editor-color-editor"></div><div class="gradient-editor-instructions"><div>double click to add stop</div><div>drag stop down to remove</div><div>alt-drag to duplicate</div></div></div>');var f=e(".gradient-editor-container",a),l=e(".gradient-editor-gradient",a),c=e(".gradient-editor-gradient canvas",a),h=c[0],p=e(".gradient-editor-colors",a),d=e(".gradient-editor-color-editor",a),v=e(".gradient-editor-instructions",a),m;d.css("position","absolute"),d.ColorPicker({color:o(r),flat:!0,onChange:function(e,t,n){r="#"+t.substr(0,6),m&&(m.setColor(r),T(!0))}}),d.css({left:n,top:5+t.height+t.stopHeight+"px"}),f.css({position:"relative",width:t.width+5+t.stopWidth+"px",height:d[0].clientHeight+10+t.height+t.stopHeight+"px"}),v.css({position:"absolute",left:d[0].clientWidth+10+"px",top:t.height+5+t.stopHeight+"px"}),l.css({width:t.width,height:t.height,position:"absolute",left:n+"px"}),p.css({width:t.width+t.stopWidth+2,height:t.stopHeight,position:"absolute",top:t.height+"px"});var g=[],y=s(g);h.width=t.width,h.height=t.height;var b=h.getContext("2d");for(var E=0;E<t.colors.length;++E){var S=t.colors[E];w(S.position,S.color)}p.dblclick(function(n){var i=e(n.target).parent().offset(),s=n.pageX-i.left-t.stopWidth/2;w(Math.max(0,Math.min(1,s/t.width)),r),T(!0)}),T()})}})(jQuery);