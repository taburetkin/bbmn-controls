import _ from 'underscore';
import { ControlView } from '../control-view';
import { Selector } from 'bbmn-components';
import { isViewClass, convertString, toBool } from 'bbmn-utils';
import DefaultChildView from './childview';
import fixChildView from './fix-childview';
import { defineControl } from '../controls';
//import { Collection } from 'bbmn-core';

const SelectControl = ControlView.extend({
	className: 'regular-select',
	renderCollection: true,
	doneOnSelect: true,
	cssClassModifiers:[
		'select-control',
		(m,v) => v.isMultiple() ? 'multiple' : '',
	],	
	constructor(){
		ControlView.apply(this, arguments);
		this._initSelector();
		this.collection = this.selector.getCollection();
		this._fixChildView(this.childView);
		this._fixChildOptions(this.childViewOptions);
	},
	_initSelector(){
		let selectorOptions = this._getSelectorOptions();
		this.selector = new Selector(selectorOptions);

		this.listenTo(this.selector, 'change', changes => {
			_.invoke(changes.selected, 'trigger', 'change');
			_.invoke(changes.unselected, 'trigger', 'change');
			let setPromise = this.setControlValue(this.selector.getValue());

			if (!this.isMultiple() && this.getOption('doneOnSelect')) {
				setPromise.then(() => {
					this.controlDone();
				});
			}			
		});
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


	_fixChildView(childView){
		if (!childView) {
			this.childView = DefaultChildView;
		} else if(isViewClass(childView)){
			this.childView = fixChildView(this, childView) || DefaultChildView;
		} else {
			childView = childView.bind(this);
			this.childView = (...args) => {
				let original = childView(...args);
				return fixChildView(this, original) || DefaultChildView;
			};
		}
	},
	
	_fixChildOptions(childViewOptions){
		let childDefs = { selector: this.selector };
		if(_.isFunction(childViewOptions)){
			childViewOptions = childViewOptions.bind(this);
			this.childViewOptions = (...args) => {
				let original = childViewOptions(...args);
				return _.extend( childDefs, original);
			};
		} else {
			this.childViewOptions = _.extend(childDefs, childViewOptions);
		}
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
	childViewEvents:{
		'toggle:select'(view, event){
			if (!this.isMultiple() || !this.lastClickedModel || !event.shiftKey) {
				this.lastClickedModel = view.model;
				this.selector.toggle(view.model);
			} else {
				let lastclicked = this.lastClickedModel;
				delete this.lastClickedModel;
				this.selector.toggleRange(view.model, lastclicked);
			}

		}
	}
});

defineControl('select', SelectControl);

export default SelectControl;
