define([], function() {
	
	var currentUser = function() 
	{
		return window.USER;
	};

	var setUser = function(user)
	{
		window.USER = user;
		if (app.headerView) {
			app.headerView.updateUser();
		}
	};

	var canAdminModel = function(model) 
	{
		var u = currentUser() || {};
		return u._id != undefined && model.attributes.createdBy != undefined
			&& u._id == model.attributes.createdBy._id;
	};

	return {
		currentUser: currentUser,
		canAdminModel: canAdminModel,
		setUser: setUser
	};
});