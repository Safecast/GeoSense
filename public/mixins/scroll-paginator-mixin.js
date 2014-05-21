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

	    	this.$scrollable = _.isString(scrollable) ? this.$(scrollable) : $(scrollable);
	    	this.$scrollContent = _.isString(scrollContent) ? this.$(scrollContent) : $(scrollContent);

			this.$scrollable.on('scroll resize', function(evt) {
			    clearTimeout($.data(this, 'scrollTimer'));
				$.data(this, 'scrollTimer', setTimeout(function() {
					// detect when user hasn't scrolled in 250ms, then
			        self.updateAfterScrolled(evt);
				}, 250));
			});
	    },

	    scrollableHeight: function() {
	    	var availableHeight = this.$scrollable.height();
	    	if (!this.$scrollable.offset()) {
	    		availableHeight -= this.$scrollContent.offset().top;
	    	}
	    	return availableHeight;
	    },

	    detectPageLimit: function()
	    {
	    	// return number of items as a multiple of 10
			return Math.max(1, Math.ceil(this.scrollableHeight() / this.resultHeight / 10))
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
	    		+ this.scrollableHeight() - this.$scrollContent.height();
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