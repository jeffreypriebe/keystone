var React = require('react'),
	Field = require('../Field');

module.exports = Field.create({
	displayName: 'UrlLinkField',
	
	renderField: function() {
		return (
			<a href={this.props.value} target="_blank">Preview Link</a>
		);
	}
});