import _ from 'underscore';

import { CollectionView, View } from 'backbone.marionette';
import { isClass } from 'bbmn-core';
import { cssClassModifiers } from 'bbmn-mixins';
import buttonMixin from '../button/index.js';

export default Base => {
	if (Base == null) {
		Base = CollectionView;
	}

	if(!isClass(Base, CollectionView)){
		throw new Error('promiseBar mixin can be applied only on CollectionView');
	}

	let Mixed = Base;

	if (!Mixed.CssClassModifiersMixin) {
		Mixed = cssClassModifiers(Mixed);
	}

	return Mixed.extend({
		constructor(options){
			this._buttons = {};
			Base.apply(this, arguments);
			this.addPromiseBarCssClass();
			this.mergeOptions(options, ['promise', 'reject', 'resolve', 'beforeRejectSoft', 'beforeRejectHard', 'beforeResolve']);
		},
		tagName: 'footer',
		resolve:'ok',
		triggerNameEvent: true,
		addPromiseBarCssClass(){
			this.addCssClassModifier('promise-bar');
		},
		onRender(){
			this.addButtons();
		},
		addButtons(){
			let buttons = this.buildButtons() || [];
			while (buttons.length){
				let button = buttons.pop();
				let preventRender = !!buttons.length;
				this.addChildView(button, { preventRender });
			}
		},
		buildButtons(){
			let names = ['resolve','rejectSoft','rejectHard'];
			return _.reduce(names, (buttons, name) => {
				let button = this.buildButton(name);
				button && buttons.push(button);
				return buttons;
			}, []);
		},
		buildButton(name){
			let options = this.getButtonOptions(name);
			if (!options) return;
			let Button = this.getOption('buttonView');
			if (!Button) {
				Button = this.buttonView = buttonMixin(View);
			}
			let btn = new Button(options);
			this._buttons[name] = btn;
			return btn;
		},
		getButtonOptions(name){
			let options = this.getOption(name);
			if ( !options ) return;
			if( _.isString(options) ) {
				options = { text: options };
			} else if(!_.isObject(options)) {
				return;
			}
			let defs = { 
				className: name, 
				name, 
				triggerNameEvent: this.getOption('triggerNameEvent'), 
				stopEvent: true,
				text: options.text || name,
			};
			options = _.extend(defs, options);
			return options;
		},
		childViewEvents:{
			'click:resolve'(data){
				this.triggerMethod('resolve', data);
			},
			'click:rejectSoft'(value){ 
				this.triggerMethod('reject', { type: 'soft', value });
				this.triggerMethod('reject:soft', value);
			},
			'click:rejectHard'(value){ 
				this.triggerMethod('reject', { type: 'hard', value });
				this.triggerMethod('reject:hard', value);
			},
			'click:fail'(error, name, event, view) {
				this.triggerMethod('click:fail', error, name, event, view);
				if (name) {
					this.triggerMethod(`click:${name}:fail`, error, event, view);
				}
			}
		},

		disableButton(name){
			let btn = this._buttons[name];
			btn && btn.disable();
		},
		enableButton(name){
			let btn = this._buttons[name];
			btn && btn.enable();
		},

	});

};
