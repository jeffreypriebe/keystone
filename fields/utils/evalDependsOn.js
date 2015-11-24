var userKeyMatch = /^user\./i;

module.exports = function evalDependsOn(dependsOn, values, userRoles) {
	if (!_.isObject(dependsOn)) return true;
	var keys = _.keys(dependsOn);
	return (keys.length) ? _.every(keys, function(key) {
		var dependsValue = dependsOn[key];		
		var keyIsUser = key.match(userKeyMatch);
		var checkValues = keyIsUser ? userRoles : values;
		if (keyIsUser) key = key.replace(userKeyMatch, '')
		
		if (_.isBoolean(dependsValue)) {
			if (_.isBoolean(checkValues[key])) {
				return dependsValue === checkValues[key];
			} else {
				return dependsValue !== _.isEmpty(checkValues[key]);
			}
		}
		var matches = _.isArray(dependsValue) ? dependsValue : [dependsValue];
		return _.contains(matches, checkValues[key]);
	}, this) : true;
};
