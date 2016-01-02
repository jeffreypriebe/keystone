var React = require('react'),
	Field = require('../Field');

module.exports = Field.create({
	displayName: 'UrlLinkField',
	
	renderField: function() {
		var text = this.props.linkText || "Preview Link";
		return (
			<a href={this.props.value} target="_blank">{text}</a>
		);
	}
});