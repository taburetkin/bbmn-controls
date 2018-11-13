import _ from 'underscore';
import { ControlView } from '../control-view';
import { Selector, initSelectorMixin } from 'bbmn-components';
import { convertString, toBool } from 'bbmn-utils';
import DefaultChildView from './childview';
//import fixChildView from './fix-childview';
import { defineControl } from '../controls';
//import { Collection } from 'bbmn-core';
const BaseSelectControl = initSelectorMixin(ControlView);
const SelectControl = BaseSelectControl.extend({
	className: 'regular-select',
	renderCollection: true,
	doneOnSelect: true,
	cssClassModifiers:[
		'select-control',
		(m,v) => v.isMultiple() ? 'multiple' : '',
	],	
	constructor(){
		BaseSelectControl.apply(this, arguments);
		this.collection = this.selector.getCollection();
	},
	childView: DefaultChildView,
	getSelector(){
		if(!this.selector) {
			let selectorOptions = this._getSelectorOptions();
			this.selector = new Selector(selectorOptions);
		}
		return this.selector;
	},

	onSelectorChange(){
		let setPromise = this.setControlValue(this.selector.getValue());
		if (!this.isMultiple() && this.getOption('doneOnSelect')) {
			setPromise.then(() => {
				this.controlDone();
			});
		}	
	},
	_getSelectorOptions(){
		let source = this.getSource();
		let extractValue;
		let type = this.valueOptions.type;
		if (type == 'boolean') {
			source = _.map(source, (value, ind) => ({id: toBool(ind), value }));
			extractValue = model => model.id;
		}
		let value = this.getControlValue();
		if (this.isMultiple() && type === 'enum' && _.isString(value)) {
			value = value.split(/\s*,\s*/g);
		}
		let opts = {
			value,
			source,
			multiple: this.isMultiple(),
		};
		if(extractValue) {
			opts.extractValue = extractValue;
		}

		return opts;
	},

	setFilter(filter){
		this.selector.setSourceFilter(filter);
	},
	isMultiple(){
		return this.valueOptions.multiple === true;
	},
	prepareValueBeforeSet(value){
		let type = this.valueOptions.type;
		if (type == 'text') {
			return value != null ? value.toString() : value;
		} else if (type == 'boolean') {
			return toBool(value);
		} else if(_.isString(value)){
			return convertString(value, this.valueOptions.type);
		} else if(_.isArray(value)) {
			if(this.valueOptions.type == 'enum') {
				return value.join(', ');
			} else {
				return _.map(value, val => convertString(val, this.valueOptions.type));
			}
		} else {
			return value;
		}
	},
	getSource(){
		let src = this.valueOptions.sourceValues;
		if(_.isFunction(src)){
			src = src();
		}
		return src;
	},
});

defineControl('select', SelectControl);

export default SelectControl;
