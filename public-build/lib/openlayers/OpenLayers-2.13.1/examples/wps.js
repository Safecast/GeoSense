function getCapabilities(){OpenLayers.Request.GET({url:wps,params:{SERVICE:"WPS",REQUEST:"GetCapabilities"},success:function(e){capabilities=(new OpenLayers.Format.WPSCapabilities).read(e.responseText);var t=document.getElementById("processes"),n=capabilities.processOfferings,r;for(var i in n)r=document.createElement("option"),r.innerHTML=n[i].identifier,r.value=i,t.appendChild(r)}})}function describeProcess(){var e=this.options[this.selectedIndex].value;OpenLayers.Request.GET({url:wps,params:{SERVICE:"WPS",REQUEST:"DescribeProcess",VERSION:capabilities.version,IDENTIFIER:e},success:function(t){process=(new OpenLayers.Format.WPSDescribeProcess).read(t.responseText).processDescriptions[e],buildForm()}})}function buildForm(){document.getElementById("abstract").innerHTML=process["abstract"],document.getElementById("input").innerHTML="<h3>Input:</h3>",document.getElementById("output").innerHTML="";var e=process.dataInputs,t=!0,n="text/xml; subtype=sld/1.0.0",r;for(var i=0,s=e.length;i<s;++i){r=e[i];if(r.complexData){var o=r.complexData.supported.formats;o["application/wkt"]?addWKTInput(r):o["text/xml; subtype=wfs-collection/1.0"]?addWFSCollectionInput(r):o["image/tiff"]?addRasterInput(r):o[n]?addXMLInput(r,n):t=!1}else r.boundingBoxData?addBoundingBoxInput(r):r.literalData?addLiteralInput(r):t=!1;r.minOccurs>0&&document.getElementById("input").appendChild(document.createTextNode("* "))}if(t){var u=document.createElement("button");u.innerHTML="Execute",document.getElementById("input").appendChild(u),u.onclick=execute}else document.getElementById("input").innerHTML='<span class="notsupported">Sorry, the WPS builder does not support the selected process.</span>'}function addWKTInput(e,t){var n=e.identifier,r=document.getElementById("input"),i=document.createElement("label");i["for"]=n,i.title=e["abstract"],i.innerHTML=n+" (select feature, then click field):",t&&t.nextSibling?r.insertBefore(i,t.nextSibling):r.appendChild(i);var s=document.createElement("textarea");s.onclick=function(){layer.selectedFeatures.length&&(this.innerHTML=(new OpenLayers.Format.WKT).write(layer.selectedFeatures[0])),createCopy(e,this,addWKTInput)},s.onblur=function(){e.data=s.value?{complexData:{mimeType:"application/wkt",value:this.value}}:undefined},s.title=e["abstract"],s.id=n,t&&t.nextSibling?r.insertBefore(s,t.nextSibling.nextSibling):r.appendChild(s)}function addXMLInput(e,t){var n=e.identifier,r=document.createElement("input");r.title=e["abstract"],r.value=n+" ("+t+")",r.onblur=function(){e.data=r.value?{complexData:{mimeType:t,value:this.value}}:undefined},document.getElementById("input").appendChild(r)}function addWFSCollectionInput(e){var t=e.identifier,n=document.createElement("input");n.title=e["abstract"],n.value=t+" (layer on demo server)",addValueHandlers(n,function(){e.reference=n.value?{mimeType:"text/xml; subtype=wfs-collection/1.0",href:"http://geoserver/wfs",method:"POST",body:{wfs:{version:"1.0.0",outputFormat:"GML2",featureType:n.value}}}:undefined}),document.getElementById("input").appendChild(n)}function addRasterInput(e){var t=e.identifier,n=document.createElement("input");n.title=e["abstract"];var r=window.location.href.split("?")[0];n.value=r.substr(0,r.lastIndexOf("/")+1)+"data/tazdem.tiff",document.getElementById("input").appendChild(n),(n.onblur=function(){e.reference={mimeType:"image/tiff",href:n.value,method:"GET"}})()}function addBoundingBoxInput(e){var t=e.identifier,n=document.createElement("input");n.title=e["abstract"],n.value="left,bottom,right,top (EPSG:4326)",document.getElementById("input").appendChild(n),addValueHandlers(n,function(){e.boundingBoxData={projection:"EPSG:4326",bounds:OpenLayers.Bounds.fromString(n.value)}})}function addLiteralInput(e,t){var n=e.identifier,r=document.getElementById("input"),i=e.literalData.anyValue,s=document.createElement(i?"input":"select");s.id=n,s.title=e["abstract"],t&&t.nextSibling?r.insertBefore(s,t.nextSibling):r.appendChild(s);if(i){var o=e.literalData.dataType;s.value=n+(o?" ("+o+")":""),addValueHandlers(s,function(){e.data=s.value?{literalData:{value:s.value}}:undefined,createCopy(e,s,addLiteralInput)})}else{var u;u=document.createElement("option"),u.innerHTML=n,s.appendChild(u);for(var a in e.literalData.allowedValues)u=document.createElement("option"),u.value=a,u.innerHTML=a,s.appendChild(u);s.onchange=function(){createCopy(e,s,addLiteralInput),e.data=this.selectedIndex?{literalData:{value:this.options[this.selectedIndex].value}}:undefined}}}function createCopy(e,t,n){if(e.maxOccurs&&e.maxOccurs>1&&!t.userSelected){t.userSelected=!0;var r=OpenLayers.Util.extend({},e);r.occurrence=(e.occurrence||0)+1,process.dataInputs.push(r),n(r,t)}}function addValueHandlers(e,t){e.onclick=function(){this.initialValue||(this.initialValue=this.value,this.value="")},e.onblur=function(){this.value||(this.value=this.initialValue,delete this.initialValue),t.apply(this,arguments)}}function execute(){var e=process.processOutputs[0],t;for(var n=process.dataInputs.length-1;n>=0;--n)t=process.dataInputs[n],(t.minOccurs===0||t.occurrence)&&!t.data&&!t.reference&&OpenLayers.Util.removeItem(process.dataInputs,t);process.responseForm={rawDataOutput:{identifier:e.identifier}},e.complexOutput&&e.complexOutput.supported.formats["application/wkt"]&&(process.responseForm.rawDataOutput.mimeType="application/wkt"),OpenLayers.Request.POST({url:wps,data:(new OpenLayers.Format.WPSExecute).write(process),success:showOutput})}function showOutput(e){var t=document.getElementById("output");t.innerHTML="<h3>Output:</h3>";var n,r=e.getResponseHeader("Content-Type");r=="application/wkt"?n=(new OpenLayers.Format.WKT).read(e.responseText):r=="text/xml; subtype=wfs-collection/1.0"&&(n=(new OpenLayers.Format.WFST.v1_0_0).read(e.responseText)),n&&(n instanceof OpenLayers.Feature.Vector||n.length)&&(layer.addFeatures(n),t.innerHTML+="The result should also be visible on the map."),t.innerHTML+="<textarea>"+e.responseText+"</textarea>"}OpenLayers.ProxyHost="proxy.cgi?url=";var wps="http://demo.opengeo.org/geoserver/wps",capabilities,process;getCapabilities();var layer=new OpenLayers.Layer.Vector("Scratchpad"),toolbar=new OpenLayers.Control.EditingToolbar(layer);toolbar.addControls([new OpenLayers.Control.ModifyFeature(layer,{title:"Select feature"})]);var map=new OpenLayers.Map("map",{controls:[toolbar,new OpenLayers.Control.ZoomPanel,new OpenLayers.Control.PanPanel],layers:[new OpenLayers.Layer.WMS("OSM","http://maps.opengeo.org/geowebcache/service/wms",{layers:"openstreetmap",format:"image/png"}),layer]});map.zoomToMaxExtent(),document.getElementById("processes").onchange=describeProcess;