define([
	'jquery',
	'underscore',
	'backbone',
], function($, _, Backbone) {

	var ScrollPaginatorMixin = {

	    initScrollable: function(scrollable, scrollContent, resultHeight, numResultsPerPage)
	    {
	    	var self = this;
	    	
		    this.lastPage = true;
		    this.searchParams = {p: 0};
		    this.resultHeight = resultHeight || 50;

	    	this.$scrollable = $(scrollable);
	    	this.$scrollContent = $(scrollContent);
			this.$scrollable.on('scroll', function(evt) {
			    clearTimeout($.data(this, 'scrollTimer'));
				$.data(this, 'scrollTimer', setTimeout(function() {
					// detect when user hasn't scrolled in 250ms, then
			        self.updateAfterScrolled(evt);
				}, 250));
			});
	    },

	    detectPageLimit: function()
	    {
	    	// return number of items as a multiple of 10
			return Math.ceil(this.$scrollable.height() / this.resultHeight / 10)
				* 10;
	    },

	    resetPageParams: function()
	    {
	    	this.isLastPage = false;
	    	this.searchParams.p = 0;
			this.searchParams.l = this.detectPageLimit();
			return this;
	    },

	    updateAfterScrolled: function(evt)
	    {
	    	var delta = this.$scrollable.scrollTop() 
	    		+ this.$scrollable.height() - this.$scrollContent.height();
	    	if (delta > -50) {
	    		if (!this.loadNextPage) {
			    	console.error('View needs to implement loadNextPage()');
			    	return;
	    		}
    			this.loadNextPage();
	    	}
	    },

	};

	return ScrollPaginatorMixin;
});