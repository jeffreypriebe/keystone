var React = require('react');
var Field = require('../Field');
var Note = require('../../components/Note');
var DateInput = require('../../components/DateInput');
var moment = require('moment');
var momentTimezone = require('moment-timezone');

module.exports = Field.create({
	
	displayName: 'DateField',

	focusTargetRef: 'dateInput',

	// default input format
	inputFormat: 'YYYY-MM-DD',

	getInitialState: function() {
		return { 
			value: this.props.value ? this.moment(this.props.value).format(this.inputFormat) : '',
            fullValue: this.props.value ? this.moment(this.props.value).toISOString() : ''
		};
	},

	getDefaultProps: function() {
		return { 
			formatString: 'Do MMM YYYY'
		};
	},

	moment: function(value) {
		var m = moment(value);
		if (this.props.isUTC) {
            m.utc();
            m.tz(moment.tz.guess());
        }
		return m;
	},

	// TODO: Move isValid() so we can share with server-side code
	isValid: function(value) {
		return this.moment(value, this.inputFormat).isValid();
	},

	// TODO: Move format() so we can share with server-side code
	format: function(dateValue, format) {
		format = format || this.inputFormat;
		return dateValue ? this.moment(this.props.dateValue).format(format) : '';
	},

	setDate: function(dateValue) {
        var fullValue = this.moment(dateValue, this.inputFormat).toISOString();
		this.setState({ value: dateValue, fullValue: fullValue });
		this.props.onChange({
			path: this.props.path,
			value: this.isValid(dateValue) ? fullValue : null
		});
	},

	setToday: function() {
		this.setDate(this.moment().format(this.inputFormat));
	},

	valueChanged: function(value) {
		this.setDate(value);
	},

	renderUI: function() {
		
		var input;
		var fieldClassName = 'field-ui';
        var displayInputName = this.props.path.concat('-display');

		if (this.shouldRenderField()) {
			input = (
				<div className={fieldClassName}>
                    <input type="hidden" name={this.props.path} value={this.state.fullValue} />
					<DateInput ref="dateInput" name={displayInputName} format={this.inputFormat} value={this.state.value} onChange={this.valueChanged} yearRange={this.props.yearRange} />
					<button type="button" className="btn btn-default btn-set-today" onClick={this.setToday}>Today</button>
				</div>
			);
		} else {
			input = (
				<div className={fieldClassName}>
					<div className="field-value">{this.format(this.props.value, this.props.formatString)}</div>
				</div>
			);
		}
		
		return (
			<div className="field field-type-date">
				<label htmlFor={displayInputName} className="field-label">{this.props.label}</label>
				{input}
				<div className="col-sm-9 col-md-10 col-sm-offset-3 col-md-offset-2 field-note-wrapper">
					<Note note={this.props.note} />
				</div>
			</div>
		);
	}

});
