DataCollection = Backbone.Collection.extend({

    model: Data,
	url:  '/data/stations.json',
	localStorage: new Store("data"),
	
	
	parse:function(res){                    
		return res.items;
	},
	
    done: function() {
      return this.filter(function(reading){ return reading.get('done'); });
    },

    remaining: function() {
      return this.without.apply(this, this.done());
    },

    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    comparator: function(reading) {
      return reading.get('order');
    }

 });