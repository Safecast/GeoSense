var IS_BROWSER=this.Document&&!0;IS_BROWSER&&define([],function(){return{}});var DEV=IS_BROWSER&&window.location.href.indexOf(":3000")!=-1,DEBUG=DEV,BASE_URL="http://"+(DEV?"localhost:3000":"geosense.herokuapp.com"),CLOUDMADE_KEY="0a77f5f7d290465f9fe419f4ee788c50",MapStatus={PRIVATE:"P",PUBLIC:"A"},DEFAULT_COLOR_EDITOR_COLOR="#999999",DEFAULT_COLOR_EDITOR_POSITION="100%",COLOR_BAR_INVERT_CUTOFF=102,DataStatus={IMPORTING:"I",IMPORTING_INC:"II",UNREDUCED:"U",UNREDUCED_INC:"UI",REDUCING:"R",REDUCING_INC:"RI",COMPLETE:"C"},FeatureType={POINTS:"P",CELLS:"C",BUBBLES:"B",POLYGONS:"Y"};FeatureType.DEFAULT=FeatureType.CELLS;var LayerType={POINTS:"PL",SHAPES:"SL"},MapLayerType={POINTS:"P",SHAPES:"S"},ColorType={SOLID:"S",LINEAR_GRADIENT:"L",PALETTE:"P"};ColorType.DEFAULT=ColorType.SOLID;var UnitFormat={LEGEND:"%(value)s"},COLOR_GRADIENT_STEP=null,DEFAULT_FEATURE_OPACITY=.75,DEFAULT_SELECTED_FEATURE_OPACITY=DEFAULT_FEATURE_OPACITY+(1-DEFAULT_FEATURE_OPACITY)/2,MIN_BUBBLE_SIZE=2,MAX_BUBBLE_SIZE=60,DEFAULT_SELECTED_STROKE_COLOR="#eee",DEFAULT_POINT_RADIUS=7,DEFAULT_POINT_STROKE_WIDTH=1,DEFAULT_SELECTED_STROKE_WIDTH=3,DEFAULT_SELECTED_STROKE_OPACITY=.8;MIN_POLYGON_STROKE_WIDTH=2,MAX_POLYGON_STROKE_WIDTH=DEFAULT_POINT_RADIUS*4;var CROP_DISTRIBUTION_RATIO=.1,DEFAULT_MAP_VIEW_BASE="gm",DEFAULT_MAP_STYLE="dark",DEFAULT_MAP_AREA={center:[0,0],zoom:0},MAP_NUM_ZOOM_LEVELS=20,INITIAL_POLL_INTERVAL=3e3,POLL_INTERVAL=6e3;if(!IS_BROWSER)module.exports={MapStatus:MapStatus,FeatureType:FeatureType,ColorType:ColorType,MapLayerType:MapLayerType};else if(!DEBUG||typeof console=="undefined"||typeof console.log=="undefined")var console={log:function(){}};