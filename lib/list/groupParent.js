var _ = require('underscore');
var async = require('async');

/**
 * Gets a special Query object that will run multiple queries to gather parent/child documents in the list
 *
 * ####Example:
 *
 *     list.groupParent({
 *         parentField: 'parent',
 *         level: 0 //0-based starting level for tree (used for recursion)
 *     }).exec(function(err, results) {
 *         // do something
 *     });
 *
 * @param {Object} options
 * @param {Function} callback (optional)
 * @api public
 */

function groupParent (options, callback) {
	var list = this;
	var model = this.model;

	options = options || {};

	var query = model.find(options.filters);

	query._original_exec = query.exec;
	query._original_sort = query.sort;
	query._original_select = query.select;

	options.parent = options.parent || 'parent';
	options.level = options.level || 0;

	var toFind;
	if (options.level === 0) {
		toFind = { parent: null };
	} else {
		toFind = { parent: options.parent };
	}
	

	// as of mongoose 3.7.x, we need to defer sorting and field selection
	// until after the count has been executed

	query.select = function () {
		options.select = arguments[0];
		return query;
	};

	// Can't sort this - any sort will just be ignored 
	query.sort = function () {
		options.sort = arguments[0];
		return query;
	};
	query.sort('sortOrder');

	query.exec = function (callback) {
		// query.count(function(err, count) {
		//if (err) return callback(err);

		//Sort by sortOrder only
		query.find(toFind);

		// apply the select and sort options before calling exec
		if (options.select) {
			query._original_select(options.select);
		}

		// if (options.sort) {
		// 	query._original_sort(options.sort);
		// }
		query._original_sort('sortOrder');

		query._original_exec(function (err, results) {
			if (err) return callback(err);
			
			if (_.isEmpty(results)) return callback(err, { total: 0, results: [] });

			var allResults = [];

			async.parallel(results.map(function (r) {
				return function (childCallback) {
					r.level = options.level;
					
					//First level will be empty
					if (!r.urlParts) { 
						r.url = (options.baseUrl || '') + '/' + r.slug;
					}

					var childOptions = _.clone(options);
					_.extend(childOptions, {
						parent: r._id,
						level: options.level + 1,
						baseUrl: r.url
					});
					list.groupParent(childOptions).exec(function (err, childResults) {
						if (!_.isEmpty(childResults.results)) {
							childResults.results = childResults.results.map(function (c) {
								c.url = r.url + '/' + c.slug;
								return c;
							});
						}
						
						//Don't use the error since any error will stop parallel, we want all executions to run, so pass any error in our result obect
						childCallback(null, { error: err, parent: r, data: childResults });
					});
				};
			}), function (err, childResults) {
				if (err) return callback(err, null);

				if (!_.isEmpty(childResults)) {
					childResults.forEach(function (sub) {
						
						allResults.push(sub.parent);

						if (!_.isEmpty(sub.data.results)) {
							if (!options.outputNested) {
								allResults.push.apply(allResults, sub.data.results);
							} else {
								sub.parent.items = [];
								sub.parent.items.push.apply(sub.parent.items, sub.data.results);
							}
						}						
					});
				}

				var rtn = {
					total: allResults.length,
					results: allResults
				};
				callback(err, rtn);
			});
		});

	};

	if (callback) {
		return query(callback);
	} else {
		return query;
	}
}

module.exports = groupParent;
