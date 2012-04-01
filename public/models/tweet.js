Tweet = Backbone.Model.extend({
	
	defaults: function() {
      return {
        text:  'no text',
		lat: 0,
		lng: 0,
      };
    },
	
    parseURL: function(text) {
      return text.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&\?\/.=]+/g, function(url) {
        return url.link(url);
      });
    },

    parseUsername: function(text) {
      return text.replace(/[@]+[A-Za-z0-9-_]+/g, function(u) {
        var username = u.replace("@","")
        return u.link("http://twitter.com/" + username);
      });
    },

    parseHashtag: function(text) {
      return text.replace(/[#]+[A-Za-z0-9-_]+/g, function(t) {
        var tag = t.replace("#","%23")
        return t.link("http://search.twitter.com/search?q=" + tag);
      });
    },

    linkify: function() {
      return this.parseHashtag(this.parseUsername(this.parseURL(this.get('text'))));
    }
});



