define(["jquery","underscore","backbone"],function(e,t,n){var r=function(e){this.collection=e};return r.prototype.parse=function(e,n){var r=[];return t.each(e.results,function(e){if(e.geo){var t=[e.geo.coordinates[1],e.geo.coordinates[0]];r.push({type:"Feature",geometry:{type:"Point",coordinates:t},bbox:[t[0],t[1],t[0],t[1]],properties:{description:e.text,created_at:new Date(e.created_at),label:e.from_user_name}})}}),{features:r,counts:{result:r.length,original:r.length,max:r.length,full:e.results.length}}},r});