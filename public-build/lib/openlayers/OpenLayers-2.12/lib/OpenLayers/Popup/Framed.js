/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Popup.Framed=OpenLayers.Class(OpenLayers.Popup.Anchored,{imageSrc:null,imageSize:null,isAlphaImage:!1,positionBlocks:null,blocks:null,fixedRelativePosition:!1,initialize:function(e,t,n,r,i,s,o){OpenLayers.Popup.Anchored.prototype.initialize.apply(this,arguments),this.fixedRelativePosition&&(this.updateRelativePosition(),this.calculateRelativePosition=function(e){return this.relativePosition}),this.contentDiv.style.position="absolute",this.contentDiv.style.zIndex=1,s&&(this.closeDiv.style.zIndex=1),this.groupDiv.style.position="absolute",this.groupDiv.style.top="0px",this.groupDiv.style.left="0px",this.groupDiv.style.height="100%",this.groupDiv.style.width="100%"},destroy:function(){this.imageSrc=null,this.imageSize=null,this.isAlphaImage=null,this.fixedRelativePosition=!1,this.positionBlocks=null;for(var e=0;e<this.blocks.length;e++){var t=this.blocks[e];t.image&&t.div.removeChild(t.image),t.image=null,t.div&&this.groupDiv.removeChild(t.div),t.div=null}this.blocks=null,OpenLayers.Popup.Anchored.prototype.destroy.apply(this,arguments)},setBackgroundColor:function(e){},setBorder:function(){},setOpacity:function(e){},setSize:function(e){OpenLayers.Popup.Anchored.prototype.setSize.apply(this,arguments),this.updateBlocks()},updateRelativePosition:function(){this.padding=this.positionBlocks[this.relativePosition].padding;if(this.closeDiv){var e=this.getContentDivPadding();this.closeDiv.style.right=e.right+this.padding.right+"px",this.closeDiv.style.top=e.top+this.padding.top+"px"}this.updateBlocks()},calculateNewPx:function(e){var t=OpenLayers.Popup.Anchored.prototype.calculateNewPx.apply(this,arguments);return t=t.offset(this.positionBlocks[this.relativePosition].offset),t},createBlocks:function(){this.blocks=[];var e=null;for(var t in this.positionBlocks){e=t;break}var n=this.positionBlocks[e];for(var r=0;r<n.blocks.length;r++){var i={};this.blocks.push(i);var s=this.id+"_FrameDecorationDiv_"+r;i.div=OpenLayers.Util.createDiv(s,null,null,null,"absolute",null,"hidden",null);var o=this.id+"_FrameDecorationImg_"+r,u=this.isAlphaImage?OpenLayers.Util.createAlphaImageDiv:OpenLayers.Util.createImage;i.image=u(o,null,this.imageSize,this.imageSrc,"absolute",null,null,null),i.div.appendChild(i.image),this.groupDiv.appendChild(i.div)}},updateBlocks:function(){this.blocks||this.createBlocks();if(this.size&&this.relativePosition){var e=this.positionBlocks[this.relativePosition];for(var t=0;t<e.blocks.length;t++){var n=e.blocks[t],r=this.blocks[t],i=n.anchor.left,s=n.anchor.bottom,o=n.anchor.right,u=n.anchor.top,a=isNaN(n.size.w)?this.size.w-(o+i):n.size.w,f=isNaN(n.size.h)?this.size.h-(s+u):n.size.h;r.div.style.width=(a<0?0:a)+"px",r.div.style.height=(f<0?0:f)+"px",r.div.style.left=i!=null?i+"px":"",r.div.style.bottom=s!=null?s+"px":"",r.div.style.right=o!=null?o+"px":"",r.div.style.top=u!=null?u+"px":"",r.image.style.left=n.position.x+"px",r.image.style.top=n.position.y+"px"}this.contentDiv.style.left=this.padding.left+"px",this.contentDiv.style.top=this.padding.top+"px"}},CLASS_NAME:"OpenLayers.Popup.Framed"});