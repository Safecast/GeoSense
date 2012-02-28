/* App UI variables */

var map_zoom			= 8;
var mobileVisible		= true;
/* Data variables (Google Fusion Tables) */

var zoom_key 			= 0; 
var layers				= new Object(); layers['squares'] = null; layers['dots'] = null;
var listeners			= new Array("squares", "dots");

var tbl_title		= new Array(
							"Last_updated","grid", "lat_lon",
							"100km", "100km", "100km", "100km", "100km",
							"50km", "50km",
							"10km", "10km",
							"5km", "5km",
							"1km", "1km",
							"500m", "500m", "500m", "500m", "500m", "500m", "500m", "500m");
				
var tbl_data		= new Array(
							"2012-01-23", "grid", "lat_lon",
							"2172062", "2172062", "2172062", "2172062", "2172062",	// 0..4
							"2168823", "2168823",	//  5..6
							"2168931", "2168931",	//  7..8
							"2172158", "2172158",	//  9..10
							"2168932", "2168932",	// 11..12
							"2084852", "2084852", "2084852", "2084852", "2084852", "2084852", "2084852", "2084852"); // 13..20