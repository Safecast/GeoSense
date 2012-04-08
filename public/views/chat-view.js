window.ChatView = Backbone.View.extend({

    tagName: 'div',
	className: 'chat-view',
	
    events: {
		'click #joinRoom:' : 'joinRoomClicked',
		'click #chatToggle' : 'chatToggleClicked',
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('chat'));
    },

    render: function() {
		var self = this;
		$(this.el).html(this.template());	
		
		now.receiveMessage = function(name, message){
			self.$("#messages").append("<div class='message'>" + message + '</div>' + "<div class='message-name'>" + name + "</div>");
		}
		
		this.toggleChatVisibility();
			
        return this;
    },

	joinRoomClicked: function()
	{
		this.$('.login').hide();
		this.$('.chat').show();
		
		now.name = this.$('#userName').val();
		
		now.ready(function(){
			now.joinRoom(_mapId);
		});
		
		this.$("#sendMessage").click(function(){
			now.distributeMessage(self.$("#message").val());
			self.$("#message").val("");
		});
	},
	
	chatToggleClicked: function()
	{
		if(_chatVisible == true)
		{ 
			_chatVisible = false
		} else {
			_chatVisible = true
		}
			
		this.toggleChatVisibility();
	},
	
	toggleChatVisibility: function()
	{
		if(_chatVisible == true)
		{
			$(this.el).addClass('visible');
			_chatVisible = true;
		} else
		{
			$(this.el).removeClass('visible');
			_chatVisible = false;
		}
	},

	remove: function() {
		$(window).unbind();
		$(this.el).remove();
		return this;
	},
});