
function allowUser (editUser, user) {
	if (editUser.isPWD) return user.isPWD;
	else if (editUser._id.id === user._id.id) return true;
	else if (editUser.isSuperAdmin) return user.isPWD;
	else if (editUser.isUserAdmin) return user.isSuperAdmin;
	else if (editUser.isAdmin) return user.isUserAdmin;
	else return false;
};

function noAuth (res) {
	res.sendStatus(403);
	res.end();
};

//Doesn't look up the item, if we can cut out at this point, do so.
function authUserPath(req, res, next) {
	if (req.params.list !== 'users') return next();
	
	if(!req.user) return res.redirect('/keystone');
	
	return next();
};

//Does look up the item, which is why we do it separately.
function authUserObj(req, res, next) {
	var user = req.user;
	if (!user) return res.redirect('/keystone');
	
	//no item, we've done all checks (in authUserPath)
	// OR, isPWD so always allow
	if (user.isPWD || !req.params.item) return next();
		
	req.list.model.findById(req.params.item).select().exec(function(err, editUser) {
		if (err || !editUser) return next();
		
		if (allowUser(editUser, user)) return next();
		else return noAuth(res);
	});
};

exports = module.exports = {
	authPath: authUserPath,
	authObj: authUserObj
};