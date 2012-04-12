ZoomLevel = {

	/*
	PARAMETERS
	data_array = array of all the boxes
	coordinates = array of all the points used to make the boxes
	zoom_width = width of the window
	zoom_length = length of the window
	zoom_sw = lower left corner
	zoom_ne = upper right corner
	grid_length = number of boxes long
	grid_width = number of boxes wide
	*/
	data_array: [], 
	coordinates: [], 
	zoom_width: null, 
	zoom_length: null, 
	zoom_sw: null, 
	zoom_ne: null, 
	grid_length: null, 
	grid_width: null,

	//Defines the dimensions of the view
	defGrid: function(low_left, up_right){
		this.zoom_width = up_right[1] - low_left[1];
		this.zoom_length = up_right[0] - low_left[0];
	},

	//Assigns the corners of the grid
	defBounds: function(low_left, up_right){
		this.zoom_sw = low_left;
		this.zoom_ne = up_right;
	},

	//Creates the pairs of coordinates for each box to be created
	defCoordinates: function(){
		for (var n = 0; n < grid_width - 1; n++){
			for (var m = 0; m < grid_length - 1; m++) {
				this.coordinates.push([[ (low_left[0] + m*(zoom_length/grid_length)), (low_left[1] + n*(zoom_width/grid_width)) ],
					[ (low_left[0] + (m+1)*(zoom_length/grid_length)), (low_left[1] + (n+1)*(zoom_width/grid_width)) ] ]);
			};//end for
		};//end for
	},

	//Creates a box for each set of coordinates
	createArray: function(){
		this.coordinates.forEach(function(point){
			box = new Box();
			box.create(point[0], point[1]);
			this.data_array.push(box);
		});
	},

	clearData: function(){
		this.data_array = [];
	},

	create: function(low_left, up_right){
		defGrid(low_left, up_right);
		defBounds(low_left, up_right);
		defCoordinates();
		createArray();
	},

	refresh: function(low_left, up_right){
		defGrid(low_left, up_right);
		defBounds(low_left, up_right);
		defCoordinates();
		clearData();
		createArray();
	},

	/* HOW ARE WE DEFINING THE DIMENSIONS OF THE GRID?*/

}//end ZoomLevel

var Box = {

	/*
	PARAMETERS
	box_data = an array of the data points contained
	num_points = number of data points contained
	min = minimum reading value
	max = maximum reading value
	mean = average reading value
	center = center coordinate of the box with respect to the grid
	*/

	box_data = [],
	num_points = 0,
	min = 0,
	max = 0,
	mean = 0,
	center = null,

	//Defines the parameters of the box.
	create: function(low_left, up_right){
		getPoints(low_left, up_right);
		defineCenter(low_left, up_right);
		boxDimensions(up_right[0] - low_left[0], up_right[1] - low_left[1]);
		dataStats();
	},

	//Defines the center of the box.
	defineCenter: function(low_left, up_right){
		center = [(up_right[0] - low_left[0])/ 2, (up_right[1] - low_left[1])/ 2];
	},

	//Gets the data and assigns all the data fields respecitvely.
	getPoints: function(low_left, up_right){
		db.geo.find({"loc":{"$within": {"$box": [low_left, up_right]}}}).sort({reading_id:1}).forEach(function(x){
			this.box_data.push(x);
			this.num_points += 1;
		});
	},

	//Defines the functions of the box
	boxDimensions: function(length, width){
		this.box_length = length;
		this.box_width = width;
	}

	//Performs the operations to initalize the metadata of the box.
	dataStats: function(){
		average();
		minimum();
		maximum();
	},

	//Calculates the average of the box.
	average: function(){
		var sum = 0;
		for (point in this.box_data)
			{ sum += point.reading_id; }
		this.mean = sum / num_points;
	},

	//Calculates the minimum of the box.
	minimum: function(){
		this.min = this.box_data[0].reading_value;
	},

	//Calculates the maximum of the box.
	maximum: function(){
		this.max = this.box_data[this.num_points-1].reading_value;
	}
}//end Box

function setup(low_left, up_right){
	var zoom = new ZoomLevel();
	zoom.create(low_left, up_right);
}