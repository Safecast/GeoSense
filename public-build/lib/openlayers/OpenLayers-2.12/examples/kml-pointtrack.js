function init(){var e=new OpenLayers.Projection("EPSG:900913"),t=new OpenLayers.Projection("EPSG:4326");map=new OpenLayers.Map({div:"map",projection:e,layers:[new OpenLayers.Layer.OSM,new OpenLayers.Layer.PointTrack("Aircraft Tracks",{projection:t,strategies:[new OpenLayers.Strategy.Fixed],protocol:new OpenLayers.Protocol.HTTP({url:"kml-track.kml",format:new OpenLayers.Format.KML({extractTracks:!0,extractStyles:!0})}),dataFrom:OpenLayers.Layer.PointTrack.TARGET_NODE,styleFrom:OpenLayers.Layer.PointTrack.TARGET_NODE,eventListeners:{beforefeaturesadded:function(e){var t,n=[],r;for(var i=0,s=e.features.length;i<s;i++)r=e.features[i],t&&r.fid!==t||i===s-1?(this.addNodes(n,{silent:!0}),n=[]):n.push(r),t=r.fid;return!1}}})],center:(new OpenLayers.LonLat(-93.2735,44.8349)).transform(t,e),zoom:8}),map.addControl(new OpenLayers.Control.LayerSwitcher)}var map;