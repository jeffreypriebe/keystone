var React = require('react');
var Field = require('../Field');
var Note = require('../../components/Note');
var DateInput = require('../../components/DateInput');
var moment = require('moment');
var momentTimezone = require('moment-timezone');

module.exports = Field.create({
	
	displayName: 'DatetimeField',

	focusTargetRef: 'dateInput',

	// default input formats
	dateInputFormat: 'YYYY-MM-DD',
	timeInputFormat: 'h:mm:ss a',

	// parse formats (duplicated from lib/fieldTypes/datetime.js)
	parseFormats: ['YYYY-MM-DD', 'YYYY-MM-DD h:mm:ss a', 'YYYY-MM-DD h:mm a', 'YYYY-MM-DD H:mm:ss', 'YYYY-MM-DD H:mm'],

	getInitialState: function() {
		return {
			dateValue: this.props.value ? this.moment(this.props.value).format(this.dateInputFormat) : '',
			timeValue: this.props.value ? this.moment(this.props.value).format(this.timeInputFormat) : ''
		};
	},

	getDefaultProps: function() {
		return { 
			formatString: 'Do MMM YYYY, h:mm:ss a'
		};
	},

	moment: function(value, valueFormat) {
		var m = moment(value, valueFormat);
		if (this.props.isUTC) {
            m.utc();
            m.tz(moment.tz.guess()); //Set timezone per best guess of moment timezone
        }
		return m;
	},

	// TODO: Move isValid() so we can share with server-side code
	isValid: function(value) {
        return this.moment(value, this.parseFormats).isValid();
	},

	// TODO: Move format() so we can share with server-side code
	format: function(value, format) {
		format = format || this.dateInputFormat + ' ' + this.timeInputFormat;
		return value ? this.moment(value).format(format) : '';
	},

	handleChange: function(dateValue, timeValue) {
		var value = dateValue + ' ' + timeValue;
		var datetimeFormat = this.dateInputFormat + ' ' + this.timeInputFormat;
		this.props.onChange({
			path: this.props.path,
            value: this.isValid(value) ? this.moment(value, datetimeFormat).toISOString() : null
		});
	},

	dateChanged: function(value) {
		this.setState({ dateValue: value });
		this.handleChange(value, this.state.timeValue);
	},

	timeChanged: function(event) {
		this.setState({ timeValue: event.target.value });
		this.handleChange(this.state.dateValue, event.target.value);
	},

	setNow: function() {
		var dateValue = this.moment().format(this.dateInputFormat);
		var timeValue = this.moment().format(this.timeInputFormat);
		this.setState({
			dateValue: dateValue,
			timeValue: timeValue
		});
		this.handleChange(dateValue, timeValue);
	},

	renderUI: function() {
		var input;
		var fieldClassName = 'field-ui';
		if (this.shouldRenderField()) {
			input = (
				<div className={fieldClassName}>
					<DateInput ref="dateInput" name={this.props.paths.date} value={this.state.dateValue} format={this.dateInputFormat} onChange={this.dateChanged} />
					<input type="text" name={this.props.paths.time} value={this.state.timeValue} placeholder="HH:MM:SS am/pm" onChange={this.timeChanged} autoComplete="off" className="form-control time" />
                    <input type="hidden" name={this.props.path + '_timezone'} value={moment.tz.guess()} />
					<button type="button" className="btn btn-default btn-set-now" onClick={this.setNow}>Now</button>
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
			<div className="field field-type-datetime">
				<label className="field-label">{this.props.label}</label>
				{input}
				<div className="col-sm-9 col-md-10 col-sm-offset-3 col-md-offset-2 field-note-wrapper">
					<Note note={this.props.note} />
				</div>
			</div>
		);
	}
});
