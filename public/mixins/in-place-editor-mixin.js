define([
	'jquery',
	'underscore',
	'backbone',
], function($, _, Backbone) {

	var InPlaceEditorMixin = {

		getInPlaceTextElement: function($forElement)
		{
			return $forElement.attr('data-text') 
				? $forElement.find($forElement.attr('data-text')) : $forElement;
		},

		toggleInPlaceEditMode: function()
		{
			if (this.__inPlaceEditMode) {
				this.__preventInPlaceEditMode = true;
				this.exitInPlaceEditMode();
				this.__preventInPlaceEditMode = false;
			} else {
				this.enterInPlaceEditMode();
			}
		},

	    enterInPlaceEditMode: function()
	    {
	    	var self = this;
	    	this.__inPlaceEditMode = true;
    		this.trigger('inplace:enter');

	    	this.editableElements = this.$('.model-editable');
	    	this.editableElements.each(function() {
	    		var $self = $(this);
	    		if ($self.data('replacedWith')) return;
	    		var $input = $('<input class="in-place-input" type="text" name="' + $(this).attr('data-name') + '">');
	    		$input.val(self.getInPlaceTextElement($self).text());
	    		$input
	    			.width($self.outerWidth() + 20)
	    			.height($self.outerHeight())
	    			.css({border: 'none'})
	    			.addClass('edit-in-place');

	    		_.each([
	    			'display', 
	    			'font-size', 
	    			'font-family', 
	    			'font-weight', 
	    			'line-height', 
	    			'color', 
	    			'padding', 
	    			'margin',
	    			'min-height',
	    			'max-height'
	    		], function(key) {
	    			$input.css(key, $self.css(key));
	    		});

	    		$input.on('change', function(evt) {
	    			self.inPlaceInputChanged($self, $input);
	    		});
	    		$input.on('keyup', function(evt) {
	    			switch (evt.keyCode) {
	    				case 13:
			    			self.inPlaceInputChanged($self, $input);
			    			evt.stopPropagation();
			    			break;
			    		case 27: 
			    			self.exitInPlaceEditMode();
			    			evt.stopPropagation();
			    			break;
	    			}
	    		});

	    		$self.replaceWith($input);
	    		$self.data('replacedWith', $input);
	    	});
	    	if (this.editableElements.length) {
	    		$(this.editableElements[0]).data('replacedWith').focus();
	    	}
	    },

	    inPlaceInputChanged: function($element, $input)
	    {
	    	var name = $input.attr('name');
	    	if (name) {
	    		var data = {},
	    			text = $input.val();
	    		data[name] = text;
	    		this.trigger('inplace:changed', data);
	    		this.getInPlaceTextElement($element).text(text);
	    	}
			if (!this.__preventInPlaceEditMode) {
		    	this.exitInPlaceEditMode();
			}
	    },

	    exitInPlaceEditMode: function()
	    {
	    	this.__inPlaceEditMode = false;
    		this.trigger('inplace:exit');

	    	this.editableElements.each(function() {
	    		var $self = $(this);
	    		if (!$self.data('replacedWith')) return;
	    		$($self.data('replacedWith')).replaceWith(this);
	    		$self.data('replacedWith', null);
	    	});
	    },



	};

	return InPlaceEditorMixin;
});