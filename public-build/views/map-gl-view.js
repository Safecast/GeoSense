define(["jquery","underscore","backbone","config","utils","text!templates/map-gl.html","views/map-view-base"],function(e,t,n,r,i,s,o){var u=o.extend({tagName:"div",className:"map-gl-view",events:{},widgets:{},world:null,valueScale:"linear",defaultPointColor:8947848,initialize:function(e){u.__super__.initialize.call(this,e),this.template=t.template(s),e.vent.bind("updateValueScale",this.updateValueScale),t.bindAll(this,"updateValueScale"),e.vent.bind("updateTaggedObject",this.updateTaggedObject),t.bindAll(this,"updateTaggedObject"),this.tweens={}},getVisibleMapArea:function(){return{bounds:[[-180,-90],[180,90]],zoom:0}},getMatrixFromTag:function(e,t){var n=t?e.over.normalize():e.norm.normalize(),r=t?e.norm.normalize():e.over.normalize(),i=(new THREE.Vector3).cross(e.norm,e.over).normalize(),s=new THREE.Matrix4(r.x,i.x,n.x,0,r.y,i.y,n.y,0,r.z,i.z,n.z,0,0,0,0,1);return s},updateTaggedObject:function(e){if(!this.globe)return;switch(e.name){case"globe":if(!IS_AR&&!IS_TAGGED_GLOBE&&!IS_LOUPE)break;var t=this.getMatrixFromTag(e),n=new THREE.Matrix4;n.setRotationX(WORLD_ROT_X),t.multiplySelf(n),n.setRotationY(WORLD_ROT_Y),t.multiplySelf(n),n.setRotationZ(WORLD_ROT_Z),t.multiplySelf(n),this.globe.world.rotation=(new THREE.Vector3).getRotationFromMatrix(t);var r=(new THREE.Vector3).copy(e.loc),i=(new THREE.Vector3).copy(e.norm).normalize().multiplyScalar(-1);r.addSelf(i.multiplyScalar(VIRTUAL_PHYSICAL_FACTOR*radius)),this.globe.world.position=r,DEBUG&&this.globe.debugMarker&&(this.globe.debugMarker.rotation.getRotationFromMatrix(t),this.globe.debugMarker.position=(new THREE.Vector3).copy(e.loc));if(IS_TAGGED_GLOBE&&!IS_AR&&(!IS_LOUPE||IS_TOP_DOWN)){this.globe.camera.position=(new THREE.Vector3).copy(this.globe.world.position),this.globe.camera.position.y+=WORLD_FIXED_DIST;if(!IS_TOP_DOWN)this.globe.camera.position.z+=WORLD_FIXED_DIST*.4;else{var n=new THREE.Matrix4;this.globe.camera.up.getRotationFromMatrix(n)}this.globe.camera.lookAt(this.globe.world.position)}break;case"lens":if(!IS_AR&&!IS_LOUPE)break;var i;IS_GESTURAL?i=(new THREE.Vector3).copy(e.over):i=(new THREE.Vector3).copy(e.norm).multiplyScalar(-1);if(!IS_TOP_DOWN){this.globe.camera.position=(new THREE.Vector3).copy(e.loc),this.globe.camera.up=(new THREE.Vector3).cross(e.norm,e.over);var s=(new THREE.Vector3).add(e.loc,i);this.globe.camera.lookAt(s)}if(IS_LOUPE){var o=new THREE.Ray(e.loc,i),u=o.intersectObject(this.globe.planetExtents);if(u&&u.length){console.log("intersect");var a=u[0],f=Math.min(Math.abs(a.distance-LOUPE_FOCAL_DISTANCE),LOUPE_FOCAL_DISTANCE),l=(LOUPE_FOCAL_DISTANCE-f)/LOUPE_FOCAL_DISTANCE,c=CAMERA_FOV-LOUPE_STRENGTH*l;!IS_TOP_DOWN&&this.globe.camera.fov!=c&&(this.globe.camera.fov=c,this.globe.camera.updateProjectionMatrix());if(IS_TOP_DOWN){this.globe.roiMarker.position=(new THREE.Vector3).copy(this.globe.world.position),this.globe.roiMarker.rotation=(new THREE.Vector3).getRotationFromMatrix(this.getMatrixFromTag(e,IS_GESTURAL)),this.globe.roiMarker.position.addSelf(i.multiplyScalar(-radius));var h=1-l,p=300;this.globe.roiMarker.scale.x=h*p,this.globe.roiMarker.scale.y=h*p,this.globe.roiMarker.visible=!0}}else this.globe.roiMarker.visible=!1}}},animate:function(){var e=this,t=function(){requestAnimationFrame(t),e.renderLoop()};t()},renderLoop:function(){var e=clock.getDelta();this.globe.render(),this.stats&&this.stats.update(),TWEEN.update()},updateValueScale:function(e){this.valueScale=e;for(var t in this.collections)this.destroyFeatureLayer(this.collections[t]),this.addCollectionToMap(this.collections[t])},destroyFeatureLayer:function(e){var t=e.pointCollectionId;if(!this.widgets[t])return;var n=this.widgets[t];for(var r=0;r<n.length;r++)this.world.remove(n[r].object3D);delete this.widgets[t]},render:function(){return e(this.el).html(this.template()),IS_IPAD&&e("body").addClass("ipad"),IS_AR&&e("body").addClass("ar-lens"),DEBUG&&(this.stats=new Stats,this.stats.domElement.style.position="absolute",this.stats.domElement.style.top="0px",this.el.appendChild(this.stats.domElement)),container=this.el,this.globe=new DAT.Globe(container),this.animate(),this.vent.trigger("mapViewReady"),this},start:function(e){u.__super__.start.call(this)},initFeatureLayer:function(e){u.__super__.initFeatureLayer.call(this,e),this.featureLayers[e.pointCollectionId]={data:[],colors:[]}},addFeatureToLayer:function(e,t,n){var r=e.get("loc");this.featureLayers[n].data.push(r[1]),this.featureLayers[n].data.push(r[0]);var i=e.get("val")/t.max;this.featureLayers[n].data.push(i),this.featureLayers[n].colors.push(t.color.replace("#","0x"))},drawLayerForCollection:function(e){var t=0,n=this;this.globe.addData(this.featureLayers[e.pointCollectionId].data,{format:"magnitude",name:e.get("_id"),animated:!1,colorFn:function(r){var i=new THREE.Color;return i.setHex(n.featureLayers[e.pointCollectionId].colors[t]),t++,i}}),this.globe.createPoints()},setVisibleMapArea:function(e){}});return u});