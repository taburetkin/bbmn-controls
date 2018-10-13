
//import { isView, isViewClass } from '../../../vendors/helpers.js';
import _ from 'underscore';
import { cssClassModifiers, customsMixin } from 'bbmn-mixins';
import { buildViewByKey } from 'bbmn-utils';
import ControlMixin from '../control-mixin/index.js';
import { CollectionView, View } from 'backbone.marionette';
import { isClass } from 'bbmn-core';



export default Base => {
	if (Base == null) {
		Base = CollectionView;
	}

	if (!isClass(Base, CollectionView)) {
		throw new Error('controlView mixin can be applied only on marionette CollectionView');
	}

	let Mixed = Base;

	if (Mixed.ControlViewMixin) {
		return Mixed;
	}

	if (!Mixed.ControlMixin) {
		Mixed = ControlMixin(Mixed);
	}

	if (!Mixed.CssClassModifiersMixin) {
		Mixed = cssClassModifiers(Mixed);
	}

	if (!Mixed.CustomsMixin) {
		Mixed = customsMixin(Mixed);
	}


	return Mixed.extend({

		renderAllCustoms: true,
		isControlWrapper: true,
		skipFirstValidationError: true,
		shouldShowError: false,
		validateOnReady: false,
		
		constructor(){
			Mixed.apply(this, arguments);
			if(!this.cssClassModifiers) {
				this.cssClassModifiers = [];
			}
			this._setControlValidInvalidListeners();
			this.addCssClassModifier('control-wrapper');
		},

		_setControlValidInvalidListeners(){
			if(this._controlValidInvalidListeners) { return true; }

			this.on({
				'control:valid': this._onControlValid,
				'control:invalid': this._onControlInvalid
			});
			if(this.getOption('validateOnReady')){
				this.once('customs:render', () => this.makeControlReady());
			}			

			this._controlValidInvalidListeners = true;
		},

		getCustoms(){
			let customs = [];
			if (this.getOption('isControlWrapper')) {
				customs.push(this.getControlView());
			} else {
				customs.push(...this._customs);
			}
			customs = this.injectSystemViews(customs);
			return this._prepareCustoms(customs);
		},

		_setupCustom(view){
			this._setupChildControl(view);
			this.setupCustom(view);
		},
		_setupChildControl(view){
			if(_.isFunction(view.setParentControl)) {
				view.setParentControl(this);
			}
			this.setupChildControl(view);
		},
		setupChildControl: _.noop,
		injectSystemViews(customs = []){
			customs.unshift(this.getHeaderView());
			customs.push(
				this.getErrorView(),
				this.getFooterView()	
			);
			return customs;
		},




		getErrorView(){
			if (!this.getOption('shouldShowError')) { return; }
			if (this.getOption('showValidateError', {force:false})) { return; }
			this._errorView = this.buildErrorView();
			return this._errorView;
		},
		buildErrorView(){
			return buildViewByKey.call(this, 'errorView');
		},



		getHeaderView(){			
			return this.buildHeaderView({ tagName: 'header' });
		},
		buildHeaderView(options){
			return this._buildNestedTextView('header', options);
		},
		_buildNestedTextView(key, options){
			let TextView = this.getOption('TextView');
			let buildText;
			if (!TextView) {
				buildText = (text, opts) => new View(_.extend({}, opts, { template: () => text }));
			}
			return buildViewByKey.call(this, key, { TextView, buildText, options });
		},


		getFooterView(){
			if (this.getOption('buttonsInFooter')) {
				return this.buildButtonsView();
			} else {
				return this.buildFooterView();
			}
		},

		buildFooterView(){
			return this._buildNestedTextView('footer', { tagName: 'footer' });
		},

		buildButtonsView(){
			if (this._buttonsView) {
				this.stopListening(this._buttonsView);
			}

			let options = this.buildButtonsOptions();
			let view = buildViewByKey.call(this, 'buttonsView', { options });
			if (!view) { return; }

			this._buttonsView = view;
			this.settleButtonsListeners(view);

			return view;
		},
		buildButtonsOptions(){
			let btns = this.getOption('buttons');
			if(btns) {
				return _.reduce(btns, (hash, b) => {
					let item = this.buildButton(b, this);
					hash[item.name] = item;
					return hash;
				}, {});
			}		
		},
		buildButton(value){
			if (_.isString(value)) {
				return this.buildButton({ text: value, className: value, name: value });
			} else if(_.isFunction(value)) {
				return this.buildButton(value.call(this));
			} else if(_.isObject(value)) {
				return this.fixButton(value);
			}
		},
		fixButton(button){
			return button;
		},
		settleButtonsListeners(buttonsView){
			this.listenTo(buttonsView, {
				'resolve'(){
					this.triggerMethod('resolve', this.getControlValue());
				},
				'reject'(){
					this.triggerMethod('reject');
				},
				'reject:soft'(){
					this.triggerMethod('reject:soft');
				},
				'reject:hard'(){
					this.triggerMethod('reject:hard');
				},
			});
		},

		getControlView(){
			this.control = buildViewByKey.call(this, 'controlView', { options: { parentControl: this, value: this.getControlValue() } });
			return this.control;
		},


		_onControlInvalid(value, error){
			this.disableButtons();
			this._showValidateError(error);
		},
		_onControlValid(){
			this.enableButtons();
			this._hideValidateError();
		},
		
		disableButtons(){
			if(this._buttonsView && _.isFunction(this._buttonsView.disableButton)) {
				this._buttonsView.disableButton('resolve');
			}
		},
		enableButtons(){
			if(this._buttonsView && _.isFunction(this._buttonsView.enableButton)) {
				this._buttonsView.enableButton('resolve');
			}
		},
		_showValidateError(error){
			
			let shouldShow = this.getOption('shouldShowError');
			let skipFirstValidationError = this.getOption('skipFirstValidationError');

			if (skipFirstValidationError && !this._firstValidationErrorSkipped) {
				this._firstValidationErrorSkipped = true;
				return;
			}

			if (!shouldShow) return;

			let show = this.getOption('showValidateError', { force: false });
			if (_.isFunction(show)) {
				show.call(this, error);
			} else {
				if (!this._errorView) return;
				this._errorView.showError(error);
			}		
		},
		_hideValidateError(){
			let hide = this.getOption('hideValidateError', { force: false });
			if (_.isFunction(hide)) {
				hide.call(this);
			} else {
				if (!this._errorView) return;
				this._errorView.hideError();
			}		
		},
	}, { ControlViewMixin: true });


};
