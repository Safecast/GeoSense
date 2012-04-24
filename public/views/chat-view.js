window.ChatView = Backbone.View.extend({

    tagName: 'div',
	className: 'chat-view',
	
    events: {
		'click #joinRoom:' : 'joinRoomClicked',
		'click #chatToggle' : 'chatToggleClicked',
		'click #sendMessage' : 'sendMessageClicked',
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('chat'));
		this.vent = options.vent;
    },

    render: function() {
		var self = this;
		$(this.el).html(this.template());	
		
		now.ready(function() {
			now.joinRoom(_mapId);
			console.log('joining room '+_mapId);
		});
		
		now.receiveMessage = function(name, message) {
			if (message[0] == '@') {
				var match = new String(message).match(/^@([a-zA-Z0-9_]+)( (.*))?$/);
				if (match) {
					switch (match[1]) {
						case 'setViewport':
							var obj = $.parseJSON(match[3]);
							if (obj) {
								self.vent.trigger('setViewport', obj);
							}
							break;
					}
				}
			}

			self.$("#messages").append("<div class='message'>" + message + '</div>' + "<div class='message-name'>" + name + "</div>");
			//self.$("#messages").scrollTop(self.$("#messages").height());
			
			self.$("#messages").animate({ scrollTop: self.$("#messages").prop("scrollHeight") - self.$('#messages').height() }, 250);
		}
		this.fetchRoomHistory();
		
		this.toggleChatVisibility();	
			
        return this;
    },

	fetchRoomHistory: function()
	{
		var self = this;
		$.ajax({
			type: 'GET',
			url: '/api/chat/' + _mapId,
			success: function(data) {
		
				for(i=0;i<data.length;i++)
				{
					self.$("#messages").append("<div class='message historic'>" + data[i].text + '</div>' + "<div class='message-name historic'>" + data[i].name + "</div>");
				}	
				
			   	self.$("#messages").scrollTop(self.$("#messages").prop("scrollHeight") - self.$('#messages').height());
			},
			error: function() {
				console.error('failed to fetch chat history');
			}
		});
	},

	joinRoomClicked: function()
	{
		this.$('.login').hide();
		this.$('.chat').show();
		
		now.name = this.$('#userName').val();
		
	},
	
	sendMessageClicked: function()
	{
		var message = this.$("#message").val();
		if(message != '')
		{
			now.distributeMessage(message);
			this.$("#message").val("");
			
			var mapid = _mapId;
			var name = this.$('#userName').val();
			var text = message;
			var date = new Date();
			
			$.ajax({
				type: 'POST',
				url: '/api/chat/' + mapid + '/' + name + '/' + text + '/' + date,
				success: function(data) {
					console.log('stored chat message');
				},
				error: function() {
					console.error('failed to store chat message');
				}
			})
		}
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