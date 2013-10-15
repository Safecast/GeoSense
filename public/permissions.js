define([], function() {

	var __user;
	
	var currentUser = function() 
	{
		return __user;
	};

	var setUser = function(user)
	{
		__user = user;
		if (app) {
			app.trigger(user ? 'user:login' : 'user:logout');
		}
	};

	var sameUser = function(u1, u2)
	{
		if (!u1 || !u2) return false;
		var _id1 = u1._id != undefined ? u1._id : u1; 
		var _id2 = u2._id != undefined ? u2._id : u2; 
		return _id1.toString() == _id2.toString();
	};

	var canAdminModel = function(model) 
	{
		return sameUser(currentUser() || {}, model.attributes.createdBy);
	};

	return {
		currentUser: currentUser,
		sameUser: sameUser,
		canAdminModel: canAdminModel,
		setUser: setUser
	};
});