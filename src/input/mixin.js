import _ from 'underscore';
import { convertString as convert, getOption } from 'bbmn-utils';

import ControlMixin from '../control-mixin/index.js';
import setInputAttributes from './set-attributes.js';
import setInputEvents from './set-events.js';

//import { convertString as convert, getOption } from '../../../utils/index.js';
export default Base => {
	let Mixin = Base.ControlMixin ? Base : ControlMixin(Base);
	return Mixin.extend({
		constructor(opts){
			
			this._initControl(opts);

			setInputAttributes(this, opts);
			setInputEvents(this, opts);
			Mixin.apply(this, arguments);

			if (!_.isFunction(this.getOption)) {
				this.getOption = (...args) => getOption(this, ...args);
			}

			this.buildRestrictions();
			let value = this.getOption('value') || '';			
			this.el.value = value;
			//this.setControlValue(value, { trigger: false, silent: true });
		},
		tagName:'input',
		template: false,
		doneOnEnter: true,
		doneOnBlur: true,
		buildRestrictions(){
			let attrs = _.result(this, 'attributes');
			let pickNumbers = ['maxlength', 'minlength', 'min', 'max'];
			let pickStrings = ['pattern'];
			let pickBools = ['required'];
			let restrictions = {};
			_(attrs).each((value, key) => {
				let pick = false;
				key = key.toLowerCase();
				if (pickNumbers.indexOf(key) > -1) {
					value = convert(value, 'number');
					pick = true;
				} else if (pickStrings.indexOf(key) > -1) {
					pick = true;
				} else if (pickBools.indexOf(key) > -1) {
					pick = true;
					value = convert(value, 'boolean', { returnNullAndEmptyAs: true, returnOtherAs: true });
				}
				pick && (restrictions[key] = value);
			});
			this.restrictions = restrictions;		
		},
		prepareValueBeforeSet(value){
			if (value == null || value === '') return value;
			
			let len = this.getMaxLength();
			if (len > 0) {
				value = value.toString().substring(0, len);
			}
			if (this._valueIsNumber) {
				let num = convert(value, 'number');
				if(isNaN(num))
					return;
				let min = this.restrictions.min;
				let max = this.restrictions.max;
				!isNaN(min) && num < min && (num = min);
				!isNaN(max) && num > max && (num = max);
				return num;
			}
			return value;
		},
		getValueType(){
			return this.valueType;
		},
		convertValue(value){
			return convert(value, this.getValueType());
		},		
		getMaxLength()
		{
			return this.restrictions.maxlength;

		},
		isLengthValid(){
			let value = this.getControlValue();
			let len = this.getMaxLength();
			return len == null || value.length < len;
		},
		isEnteredCharValid(char) {
			let type = this.getValueType();

			if (type == 'number') {
				return ['.','-'].indexOf(char) > -1 || !isNaN(parseInt(char, 10));
			} else {
				return true;
			}
		},
		isValueValid(value){
			let type = this.getValueType();
			if (type == 'number') {
				return !isNaN(parseFloat(value, 10));
			} else {
				return true;
			}
		},
		controlValidate(value){
			if (value == null || value === '') {
				if(this.restrictions.required)
					return 'required';
				else if (this.restrictions.minLength > 0) {
					return 'length:small';
				}
				else
					return;
			}
			let strValue = value.toString();
			if (_.isNumber(this.restrictions.maxlength) && strValue.length > this.restrictions.maxlength)
				return 'length:big';
			if (this._valueIsNumber) {
				if (!_.isNumber(value))
					return 'not:number';
				if (_.isNumber(this.restrictions.min) && value < this.restrictions.min)
					return 'less:than:min';
				if (_.isNumber(this.restrictions.max) && value > this.restrictions.max)
					return 'greater:than:max';
			}
			if (this.restrictions.pattern) {
				let pattern = RegExp(this.restrictions.pattern);
				if (pattern.test(strValue)) {
					return 'pattern:mismatch';
				}
			}
		}
	});
};
