/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Format.QueryStringFilter=function(){function t(e){return e=e.replace(/%/g,"\\%"),e=e.replace(/\\\\\.(\*)?/g,function(e,t){return t?e:"\\\\_"}),e=e.replace(/\\\\\.\*/g,"\\\\%"),e=e.replace(/(\\)?\.(\*)?/g,function(e,t,n){return t||n?e:"_"}),e=e.replace(/(\\)?\.\*/g,function(e,t){return t?e:"%"}),e=e.replace(/\\\./g,"."),e=e.replace(/(\\)?\\\*/g,function(e,t){return t?e:"*"}),e}var e={};return e[OpenLayers.Filter.Comparison.EQUAL_TO]="eq",e[OpenLayers.Filter.Comparison.NOT_EQUAL_TO]="ne",e[OpenLayers.Filter.Comparison.LESS_THAN]="lt",e[OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO]="lte",e[OpenLayers.Filter.Comparison.GREATER_THAN]="gt",e[OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO]="gte",e[OpenLayers.Filter.Comparison.LIKE]="ilike",OpenLayers.Class(OpenLayers.Format,{wildcarded:!1,srsInBBOX:!1,write:function(n,r){r=r||{};var i=n.CLASS_NAME,s=i.substring(i.lastIndexOf(".")+1);switch(s){case"Spatial":switch(n.type){case OpenLayers.Filter.Spatial.BBOX:r.bbox=n.value.toArray(),this.srsInBBOX&&n.projection&&r.bbox.push(n.projection.getCode());break;case OpenLayers.Filter.Spatial.DWITHIN:r.tolerance=n.distance;case OpenLayers.Filter.Spatial.WITHIN:r.lon=n.value.x,r.lat=n.value.y;break;default:OpenLayers.Console.warn("Unknown spatial filter type "+n.type)}break;case"Comparison":var o=e[n.type];if(o!==undefined){var u=n.value;n.type==OpenLayers.Filter.Comparison.LIKE&&(u=t(u),this.wildcarded&&(u="%"+u+"%")),r[n.property+"__"+o]=u,r.queryable=r.queryable||[],r.queryable.push(n.property)}else OpenLayers.Console.warn("Unknown comparison filter type "+n.type);break;case"Logical":if(n.type===OpenLayers.Filter.Logical.AND)for(var a=0,f=n.filters.length;a<f;a++)r=this.write(n.filters[a],r);else OpenLayers.Console.warn("Unsupported logical filter type "+n.type);break;default:OpenLayers.Console.warn("Unknown filter type "+s)}return r},CLASS_NAME:"OpenLayers.Format.QueryStringFilter"})}();