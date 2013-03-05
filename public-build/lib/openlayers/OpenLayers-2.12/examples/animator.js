/*  
	Animator.js 1.1.9
	
	This library is released under the BSD license:

	Copyright (c) 2006, Bernard Sumption. All rights reserved.
	
	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met:
	
	Redistributions of source code must retain the above copyright notice, this
	list of conditions and the following disclaimer. Redistributions in binary
	form must reproduce the above copyright notice, this list of conditions and
	the following disclaimer in the documentation and/or other materials
	provided with the distribution. Neither the name BernieCode nor
	the names of its contributors may be used to endorse or promote products
	derived from this software without specific prior written permission. 
	
	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	ARE DISCLAIMED. IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE FOR
	ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
	DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
	SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
	CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
	LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
	OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
	DAMAGE.

*/

function Animator(e){this.setOptions(e);var t=this;this.timerDelegate=function(){t.onTimerEvent()},this.subjects=[],this.target=0,this.state=0,this.lastTime=null}function NumericalStyleSubject(e,t,n,r,i){this.els=Animator.makeArray(e),t=="opacity"&&window.ActiveXObject?this.property="filter":this.property=Animator.camelize(t),this.from=parseFloat(n),this.to=parseFloat(r),this.units=i!=null?i:"px"}function ColorStyleSubject(e,t,n,r){this.els=Animator.makeArray(e),this.property=Animator.camelize(t),this.to=this.expandColor(r),this.from=this.expandColor(n),this.origFrom=n,this.origTo=r}function DiscreteStyleSubject(e,t,n,r,i){this.els=Animator.makeArray(e),this.property=Animator.camelize(t),this.from=n,this.to=r,this.threshold=i||.5}function CSSStyleSubject(e,t,n){e=Animator.makeArray(e),this.subjects=[];if(e.length==0)return;var r,i,s;if(n)s=this.parseStyle(t,e[0]),i=this.parseStyle(n,e[0]);else{i=this.parseStyle(t,e[0]),s={};for(r in i)s[r]=CSSStyleSubject.getStyle(e[0],r)}var r;for(r in s)s[r]==i[r]&&(delete s[r],delete i[r]);var r,o,u,a,f,l;for(r in s){var c=String(s[r]),h=String(i[r]);if(i[r]==null){window.DEBUG&&alert("No to style provided for '"+r+'"');continue}if(f=ColorStyleSubject.parseColor(c))l=ColorStyleSubject.parseColor(h),a=ColorStyleSubject;else if(c.match(CSSStyleSubject.numericalRe)&&h.match(CSSStyleSubject.numericalRe)){f=parseFloat(c),l=parseFloat(h),a=NumericalStyleSubject,u=CSSStyleSubject.numericalRe.exec(c);var p=CSSStyleSubject.numericalRe.exec(h);u[1]!=null?o=u[1]:p[1]!=null?o=p[1]:o=p}else{if(!c.match(CSSStyleSubject.discreteRe)||!h.match(CSSStyleSubject.discreteRe)){window.DEBUG&&alert("Unrecognised format for value of "+r+": '"+s[r]+"'");continue}f=c,l=h,a=DiscreteStyleSubject,o=0}this.subjects[this.subjects.length]=new a(e,r,f,l,o)}}function AnimatorChain(e,t){this.animators=e,this.setOptions(t);for(var n=0;n<this.animators.length;n++)this.listenTo(this.animators[n]);this.forwards=!1,this.current=0}function Accordion(e){this.setOptions(e);var t=this.options.initialSection,n;this.options.rememberance&&(n=document.location.hash.substring(1)),this.rememberanceTexts=[],this.ans=[];var r=this;for(var i=0;i<this.options.sections.length;i++){var s=this.options.sections[i],o=new Animator(this.options.animatorOptions),u=this.options.from+this.options.shift*i,a=this.options.to+this.options.shift*i;o.addSubject(new NumericalStyleSubject(s,this.options.property,u,a,this.options.units)),o.jumpTo(0);var f=this.options.getActivator(s);f.index=i,f.onclick=function(){r.show(this.index)},this.ans[this.ans.length]=o,this.rememberanceTexts[i]=f.innerHTML.replace(/\s/g,""),this.rememberanceTexts[i]===n&&(t=i)}this.show(t)}Animator.prototype={setOptions:function(e){this.options=Animator.applyDefaults({interval:20,duration:400,onComplete:function(){},onStep:function(){},transition:Animator.tx.easeInOut},e)},seekTo:function(e){this.seekFromTo(this.state,e)},seekFromTo:function(e,t){this.target=Math.max(0,Math.min(1,t)),this.state=Math.max(0,Math.min(1,e)),this.lastTime=(new Date).getTime(),this.intervalId||(this.intervalId=window.setInterval(this.timerDelegate,this.options.interval))},jumpTo:function(e){this.target=this.state=Math.max(0,Math.min(1,e)),this.propagate()},toggle:function(){this.seekTo(1-this.target)},addSubject:function(e){return this.subjects[this.subjects.length]=e,this},clearSubjects:function(){this.subjects=[]},propagate:function(){var e=this.options.transition(this.state);for(var t=0;t<this.subjects.length;t++)this.subjects[t].setState?this.subjects[t].setState(e):this.subjects[t](e)},onTimerEvent:function(){var e=(new Date).getTime(),t=e-this.lastTime;this.lastTime=e;var n=t/this.options.duration*(this.state<this.target?1:-1);Math.abs(n)>=Math.abs(this.state-this.target)?this.state=this.target:this.state+=n;try{this.propagate()}finally{this.options.onStep.call(this),this.target==this.state&&(window.clearInterval(this.intervalId),this.intervalId=null,this.options.onComplete.call(this))}},play:function(){this.seekFromTo(0,1)},reverse:function(){this.seekFromTo(1,0)},inspect:function(){var e="#<Animator:\n";for(var t=0;t<this.subjects.length;t++)e+=this.subjects[t].inspect();return e+=">",e}},Animator.applyDefaults=function(e,t){t=t||{};var n,r={};for(n in e)r[n]=t[n]!==undefined?t[n]:e[n];return r},Animator.makeArray=function(e){if(e==null)return[];if(!e.length)return[e];var t=[];for(var n=0;n<e.length;n++)t[n]=e[n];return t},Animator.camelize=function(e){var t=e.split("-");if(t.length==1)return t[0];var n=e.indexOf("-")==0?t[0].charAt(0).toUpperCase()+t[0].substring(1):t[0];for(var r=1,i=t.length;r<i;r++){var s=t[r];n+=s.charAt(0).toUpperCase()+s.substring(1)}return n},Animator.apply=function(e,t,n){return t instanceof Array?(new Animator(n)).addSubject(new CSSStyleSubject(e,t[0],t[1])):(new Animator(n)).addSubject(new CSSStyleSubject(e,t))},Animator.makeEaseIn=function(e){return function(t){return Math.pow(t,e*2)}},Animator.makeEaseOut=function(e){return function(t){return 1-Math.pow(1-t,e*2)}},Animator.makeElastic=function(e){return function(t){return t=Animator.tx.easeInOut(t),(1-Math.cos(t*Math.PI*e))*(1-t)+t}},Animator.makeADSR=function(e,t,n,r){return r==null&&(r=.5),function(i){return i<e?i/e:i<t?1-(i-e)/(t-e)*(1-r):i<n?r:r*(1-(i-n)/(1-n))}},Animator.makeBounce=function(e){var t=Animator.makeElastic(e);return function(e){return e=t(e),e<=1?e:2-e}},Animator.tx={easeInOut:function(e){return-Math.cos(e*Math.PI)/2+.5},linear:function(e){return e},easeIn:Animator.makeEaseIn(1.5),easeOut:Animator.makeEaseOut(1.5),strongEaseIn:Animator.makeEaseIn(2.5),strongEaseOut:Animator.makeEaseOut(2.5),elastic:Animator.makeElastic(1),veryElastic:Animator.makeElastic(3),bouncy:Animator.makeBounce(1),veryBouncy:Animator.makeBounce(3)},NumericalStyleSubject.prototype={setState:function(e){var t=this.getStyle(e),n=this.property=="opacity"&&e==0?"hidden":"",r=0;for(var i=0;i<this.els.length;i++){try{this.els[i].style[this.property]=t}catch(s){if(this.property!="fontWeight")throw s}if(r++>20)return}},getStyle:function(e){return e=this.from+(this.to-this.from)*e,this.property=="filter"?"alpha(opacity="+Math.round(e*100)+")":this.property=="opacity"?e:Math.round(e)+this.units},inspect:function(){return"	"+this.property+"("+this.from+this.units+" to "+this.to+this.units+")\n"}},ColorStyleSubject.prototype={expandColor:function(e){var t,n,r,i;t=ColorStyleSubject.parseColor(e);if(t)return n=parseInt(t.slice(1,3),16),r=parseInt(t.slice(3,5),16),i=parseInt(t.slice(5,7),16),[n,r,i];window.DEBUG&&alert("Invalid colour: '"+e+"'")},getValueForState:function(e,t){return Math.round(this.from[e]+(this.to[e]-this.from[e])*t)},setState:function(e){var t="#"+ColorStyleSubject.toColorPart(this.getValueForState(0,e))+ColorStyleSubject.toColorPart(this.getValueForState(1,e))+ColorStyleSubject.toColorPart(this.getValueForState(2,e));for(var n=0;n<this.els.length;n++)this.els[n].style[this.property]=t},inspect:function(){return"	"+this.property+"("+this.origFrom+" to "+this.origTo+")\n"}},ColorStyleSubject.parseColor=function(e){var t="#",n;if(n=ColorStyleSubject.parseColor.rgbRe.exec(e)){var r;for(var i=1;i<=3;i++)r=Math.max(0,Math.min(255,parseInt(n[i]))),t+=ColorStyleSubject.toColorPart(r);return t}if(n=ColorStyleSubject.parseColor.hexRe.exec(e)){if(n[1].length==3){for(var i=0;i<3;i++)t+=n[1].charAt(i)+n[1].charAt(i);return t}return"#"+n[1]}return!1},ColorStyleSubject.toColorPart=function(e){e>255&&(e=255);var t=e.toString(16);return e<16?"0"+t:t},ColorStyleSubject.parseColor.rgbRe=/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i,ColorStyleSubject.parseColor.hexRe=/^\#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,DiscreteStyleSubject.prototype={setState:function(e){var t=0;for(var n=0;n<this.els.length;n++)this.els[n].style[this.property]=e<=this.threshold?this.from:this.to},inspect:function(){return"	"+this.property+"("+this.from+" to "+this.to+" @ "+this.threshold+")\n"}},CSSStyleSubject.prototype={parseStyle:function(e,t){var n={};if(e.indexOf(":")!=-1){var r=e.split(";");for(var i=0;i<r.length;i++){var s=CSSStyleSubject.ruleRe.exec(r[i]);s&&(n[s[1]]=s[2])}}else{var o,u,a;a=t.className,t.className=e;for(var i=0;i<CSSStyleSubject.cssProperties.length;i++)o=CSSStyleSubject.cssProperties[i],u=CSSStyleSubject.getStyle(t,o),u!=null&&(n[o]=u);t.className=a}return n},setState:function(e){for(var t=0;t<this.subjects.length;t++)this.subjects[t].setState(e)},inspect:function(){var e="";for(var t=0;t<this.subjects.length;t++)e+=this.subjects[t].inspect();return e}},CSSStyleSubject.getStyle=function(e,t){var n;if(document.defaultView&&document.defaultView.getComputedStyle){n=document.defaultView.getComputedStyle(e,"").getPropertyValue(t);if(n)return n}return t=Animator.camelize(t),e.currentStyle&&(n=e.currentStyle[t]),n||e.style[t]},CSSStyleSubject.ruleRe=/^\s*([a-zA-Z\-]+)\s*:\s*(\S(.+\S)?)\s*$/,CSSStyleSubject.numericalRe=/^-?\d+(?:\.\d+)?(%|[a-zA-Z]{2})?$/,CSSStyleSubject.discreteRe=/^\w+$/,CSSStyleSubject.cssProperties=["azimuth","background","background-attachment","background-color","background-image","background-position","background-repeat","border-collapse","border-color","border-spacing","border-style","border-top","border-top-color","border-right-color","border-bottom-color","border-left-color","border-top-style","border-right-style","border-bottom-style","border-left-style","border-top-width","border-right-width","border-bottom-width","border-left-width","border-width","bottom","clear","clip","color","content","cursor","direction","display","elevation","empty-cells","css-float","font","font-family","font-size","font-size-adjust","font-stretch","font-style","font-variant","font-weight","height","left","letter-spacing","line-height","list-style","list-style-image","list-style-position","list-style-type","margin","margin-top","margin-right","margin-bottom","margin-left","max-height","max-width","min-height","min-width","orphans","outline","outline-color","outline-style","outline-width","overflow","padding","padding-top","padding-right","padding-bottom","padding-left","pause","position","right","size","table-layout","text-align","text-decoration","text-indent","text-shadow","text-transform","top","vertical-align","visibility","white-space","width","word-spacing","z-index","opacity","outline-offset","overflow-x","overflow-y"],AnimatorChain.prototype={setOptions:function(e){this.options=Animator.applyDefaults({resetOnPlay:!0},e)},play:function(){this.forwards=!0,this.current=-1;if(this.options.resetOnPlay)for(var e=0;e<this.animators.length;e++)this.animators[e].jumpTo(0);this.advance()},reverse:function(){this.forwards=!1,this.current=this.animators.length;if(this.options.resetOnPlay)for(var e=0;e<this.animators.length;e++)this.animators[e].jumpTo(1);this.advance()},toggle:function(){this.forwards?this.seekTo(0):this.seekTo(1)},listenTo:function(e){var t=e.options.onComplete,n=this;e.options.onComplete=function(){t&&t.call(e),n.advance()}},advance:function(){if(this.forwards){if(this.animators[this.current+1]==null)return;this.current++,this.animators[this.current].play()}else{if(this.animators[this.current-1]==null)return;this.current--,this.animators[this.current].reverse()}},seekTo:function(e){e<=0?(this.forwards=!1,this.animators[this.current].seekTo(0)):(this.forwards=!0,this.animators[this.current].seekTo(1))}},Accordion.prototype={setOptions:function(e){this.options=Object.extend({sections:null,getActivator:function(e){return document.getElementById(e.getAttribute("activator"))},shift:0,initialSection:0,rememberance:!0,animatorOptions:{}},e||{})},show:function(e){for(var t=0;t<this.ans.length;t++)this.ans[t].seekTo(t>e?1:0);this.options.rememberance&&(document.location.hash=this.rememberanceTexts[e])}};