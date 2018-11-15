import { CollectionView, ModelSchema, PropertySchema, Selector, View, initSelectorMixin, validator } from 'bbmn-components';
import _ from 'underscore';
import { CollectionView as CollectionView$1, View as View$1 } from 'backbone.marionette';
import { betterResult, buildViewByKey, camelCase, clone, compareObjects, convertString, getByPath, getOption, isEmptyValue, mix, setByPath, takeFirst, toBool } from 'bbmn-utils';
import { cssClassModifiersMixin, customsMixin } from 'bbmn-mixins';
import { isClass } from 'bbmn-core';

var buttonMixin = (function (Base) {
	if (Base == null) {
		Base = View$1;
	}
	return Base.extend({

		triggerNameEvent: true,
		stopEvent: true,

		constructor: function constructor(options) {
			Base.apply(this, arguments);
			this.mergeOptions(options, ['name']);
		},

		tagName: 'button',
		template: _.template('<i></i><span><%= text %></span><i></i>'),
		events: function events() {
			if (this.getOption('noevent')) {
				return;
			}
			return {
				'click': function click(e) {
					var _this = this;

					var stop = this.getOption('stopEvent');
					if (stop) {
						e.stopPropagation();
						e.preventDefault();
					}
					this.beforeClick().then(function (data) {
						_this.triggerMethod('click', data, e, _this);
						if (_this.name) {
							_this.triggerMethod('click:' + _this.name, data, e, _this);
						}
					}, function (error) {
						_this.triggerMethod('click:fail', error, _this.name, e, _this);
						if (_this.name) {
							_this.triggerMethod('click:' + _this.name + ':fail', error, e, _this);
						}
					});
				}
			};
		},
		beforeClick: function beforeClick() {
			var result = this.triggerMethod('before:click');
			if (result && _.isFunction(result.then)) {
				return result;
			} else {
				return Promise.resolve(result);
			}
		},
		templateContext: function templateContext() {
			return {
				text: this.getOption('text')
			};
		},
		disable: function disable() {
			this.$el.prop('disabled', true);
		},
		enable: function enable() {
			this.$el.prop('disabled', false);
		}
	});
});

var Button = buttonMixin(View);

var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};



































var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

function getTriggerMethod(context) {
	if (!context) {
		return function () {};
	}
	return _.isFunction(context.triggerMethod) ? context.triggerMethod : _.isFunction(context.trigger) ? context.trigger : function () {};
}

function ensureError(error, value) {
	if (error instanceof Error) {
		throw error;
	}
	return arguments.length > 1 ? value : error;
}

var controlMixin = (function (Base) {
	return Base.extend({

		isControl: true,
		validateOnReady: false,

		constructor: function constructor(options) {
			var _this = this;

			this._initControl(options);
			Base.apply(this, arguments);
			if (this.getOption('validateOnReady')) {
				this.once('control:ready', function () {
					_this.validate().catch(function () {});
				});
			}

			this.valueOptions = this.getOption('valueOptions') || {};
		},
		_onControlDestroy: function _onControlDestroy() {
			var parent = this.getParentControl();
			if (parent && _.isFunction(parent._removeChildControl)) {
				parent._removeChildControl(this);
			}
			var children = this.getChildrenControls();
			if (children) {
				_.each(children, function (child) {
					return child._removeParentControl();
				});
				children.length = 0;
			}
			delete this._cntrl;
		},
		_removeChildControl: function _removeChildControl(control) {
			this.off(control);
			var children = this.getChildrenControls();
			if (!children.length) {
				return;
			}
			var index = children.indexOf(control);
			if (index === -1) return;
			children.splice(index, 1);
		},
		_addChildControl: function _addChildControl(control) {
			var controlName = control.getControlName();
			var children = this.getChildrenControls();
			var found = _.find(children, function (child) {
				return child.getControlName() === controlName;
			});
			!found && children.push(control);
		},
		_removeParentControl: function _removeParentControl() {
			delete this._cntrl.parent;
		},
		_initControl: function _initControl() {
			var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

			if (this._controlInitialized) {
				return;
			}

			this._cntrl = {};
			var name = takeFirst('controlName', options, this) || 'control';
			this._cntrl.name = name;

			var value = takeFirst('value', options, this);
			value = this._clone(value);
			this.initControlValue(value);
			this.initParentControl(options);

			this.once('destroy', this._onControlDestroy);

			this._controlInitialized = true;
		},
		initParentControl: function initParentControl(options) {
			var parent = takeFirst('proxyTo', options, this) || takeFirst('parentControl', options, this);
			this.setParentControl(parent);
		},
		setParentControl: function setParentControl(parent) {
			this._cntrl.parent = parent;
			if (parent && _.isFunction(parent._addChildControl)) {
				parent._addChildControl(this);
			}
		},
		initControlValue: function initControlValue(value) {
			this._cntrl.initial = value;
			this._cntrl.value = value;
		},
		getControlName: function getControlName() {
			return this._cntrl.name;
		},
		isSameControlValue: function isSameControlValue(value) {
			var current = this.getControlValue();
			return this.isValid() && compareObjects(current, value);
		},
		getControlValue: function getControlValue(key) {
			var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


			if (_.isObject(key)) {
				options = key;
				key = undefined;
			}
			var _options = options,
			    notValidated = _options.notValidated,
			    clone$$1 = _options.clone;

			var valueKey = notValidated ? 'notValidated' : 'value';
			var value = this._cntrl[valueKey];
			if (key != null) {
				value = getByPath(value, key);
			} else {
				value = clone$$1 ? this._clone(value) : value;
			}
			if (_.isFunction(options.transform)) {
				value = options.transform.call(this, value);
			}
			return value;
		},
		setControlValue: function setControlValue(value) {
			var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
			var key = options.key,
			    notValidated = options.notValidated;

			value = this._prepareValueBeforeSet(value, { key: key });
			var resolve = Promise.resolve(value);
			if (this.isSameControlValue(value)) {
				return resolve;
			}

			this._cntrl.notValidated = value;

			if (notValidated) {
				return resolve;
			}
			return this._setControlValue(value, options);
		},
		_prepareValueBeforeSet: function _prepareValueBeforeSet(value) {
			var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
			    key = _ref.key;

			value = this.prepareValueBeforeSet(value);
			if (key == null) {
				return value;
			}

			var current = this.getControlValue({ notValidated: true, clone: true }) || {};
			setByPath(current, key, value);
			return current;
		},


		//override this if you need to modify value before set
		prepareValueBeforeSet: function prepareValueBeforeSet(value) {
			return value;
		},

		_setControlValue: function _setControlValue(value) {
			var _this2 = this;

			var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
			var skipValidation = options.skipValidation;

			if (skipValidation) {
				return this._onSetControlValueValidateSuccess(value, options);
			}
			return this._validate(value, options).then(function () {
				return _this2._onSetControlValueValidateSuccess(value, options);
			}, function (error) {
				return _this2._onSetControlValueValidateFail(error, value, options);
			});
		},
		_onSetControlValueValidateSuccess: function _onSetControlValueValidateSuccess(value, options) {
			this._cntrl.previous = this._cntrl.value;
			this._cntrl.value = value;
			this._cntrl.isDone = false;
			this._tryTriggerEvent('change', [value], options);
			return Promise.resolve(value);
		},
		_onSetControlValueValidateFail: function _onSetControlValueValidateFail(error, value, options) {
			this._tryTriggerEvent('change:fail', [value, error], options);
			return ensureError(error, value);
		},
		isValid: function isValid() {
			return this._cntrl.isValid !== false;
		},
		validate: function validate() {
			var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};


			var notValidated = !this.isValid();
			var value = this.getControlValue({ notValidated: notValidated });
			var promise = this._validate(value, options);
			var _catch = options.catch;

			if (_catch === false) {
				return promise;
			} else if (_.isFunction(_catch)) {
				return promise.catch(_catch);
			} else {
				return promise.catch(ensureError);
			}
		},
		_validate: function _validate(value, options) {
			var _this3 = this;

			var validate = this._validatePromise(value, options);

			return validate.then(function () {
				return _this3._onControlValidateSuccess(value, options);
			}, function (error) {
				return _this3._onControlValidateFail(error, value, options);
			});
		},
		_validatePromise: function _validatePromise(value, options) {
			var _this4 = this;

			var skipChildValidate = options.skipChildValidate;

			var isControlWrapper = betterResult(this, 'isControlWrapper', { args: [this] });

			return new Promise(function (resolve, reject) {
				var childrenErrors = {
					children: {}
				};
				var childrenPromise = _this4._validateChildrenControlsPromise({ skipChildValidate: skipChildValidate, isControlWrapper: isControlWrapper }, childrenErrors);

				childrenPromise.then(function () {

					if (_.size(childrenErrors.children)) {
						reject(childrenErrors.children);
						return;
					} else if (childrenErrors.wrapped) {
						reject(childrenErrors.wrapped);
						return;
					}

					var promise = _this4._validateControlPromise(value, options);

					promise.then(function () {
						resolve(value);
					}, function (error) {
						reject(error);
					});
				});
			});
		},
		_validateControlPromise: function _validateControlPromise(value, options) {
			var validate = this.getOption('controlValidate', { force: false });

			//if there is no validation defined, resolve
			if (!_.isFunction(validate)) {

				return Promise.resolve(value);
			}

			var values = this.getParentControlValue({ notValidated: true });
			var validateResult = validate.call(this, value, values, options);

			var promise = Promise.resolve(value);
			if (validateResult && validateResult.then) {
				promise = validateResult;
			} else if (validateResult) {
				promise = Promise.reject(validateResult);
			}
			return promise;
		},
		_validateChildrenControlsPromise: function _validateChildrenControlsPromise() {
			var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
			    isControlWrapper = _ref2.isControlWrapper,
			    skipChildValidate = _ref2.skipChildValidate;

			var errors = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


			var children = this.getChildrenControls();
			var childrenPromise = Promise.resolve();
			if (!children.length) return childrenPromise;

			return _.reduce(children, function (finaly, child) {
				var control = child.getControlName();

				finaly = finaly.then(function () {

					if (!child.validate || skipChildValidate && control == skipChildValidate) {
						return Promise.resolve();
					}
					var validateResult = child.validate({ stopPropagation: true, catch: false });

					return validateResult;
				}).catch(function (error) {

					if (isControlWrapper) {
						errors.wrapped = error;
					} else {
						errors.children[control] = error;
					}
					return Promise.resolve();
				});
				return finaly;
			}, childrenPromise);
		},
		_onControlValidateSuccess: function _onControlValidateSuccess(value, options) {
			this.makeValid(value, _.extend(options, { noSet: true }));
			return Promise.resolve(value);
		},
		makeValid: function makeValid(value) {
			var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

			this._cntrl.isValid = true;
			if (!options.noSet && !this.isSameControlValue(value)) {
				this._setControlValue(value, { silent: true, skipValidation: true });
			}
			this._tryTriggerEvent('valid', [value], options);
		},
		_onControlValidateFail: function _onControlValidateFail(error, value, options) {
			this.makeInvalid(error, value, options);
			return Promise.reject(error);
		},
		makeInvalid: function makeInvalid(error, value, options) {
			this._cntrl.isValid = false;
			this._tryTriggerEvent('invalid', [value, error], options);
		},
		getParentControl: function getParentControl() {
			return this._cntrl.parent;
		},
		getParentControlValue: function getParentControlValue(options) {

			var parent = this.getParentControl();
			if (!parent || !_.isFunction(parent.getControlValue)) {
				return;
			}
			if (betterResult(parent, 'isControlWrapper', { args: [this] })) {
				return parent.getParentControlValue(options);
			} else {
				return parent.getControlValue(options);
			}
		},
		getChildrenControls: function getChildrenControls() {
			if (!this._cntrl.children) {
				this._cntrl.children = [];
			}
			return this._cntrl.children;
		},
		handleChildControlEvent: function handleChildControlEvent(event, controlName) {
			for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
				args[_key - 2] = arguments[_key];
			}

			var _this5 = this;

			var childEvent = controlName + ':' + event;
			var trigger = getTriggerMethod(this);

			var cce = this.getOption('childControlEvents', { args: [this] }) || {};
			var def = this.defaultChildControlEvents || {};
			if (!this._debouncedChildControlEvents) {
				this._debouncedChildControlEvents = {};
			}
			var dcce = this._debouncedChildControlEvents;

			var defHandler = def[event];
			var handler = cce[childEvent];
			var handlerArguments = [];
			var handlerName = void 0;
			if (_.isFunction(handler)) {
				handlerArguments = args;
				handlerName = childEvent;
				//handler.apply(this, args);
			} else if (_.isFunction(defHandler)) {
				handlerName = '_default:' + event;
				handler = defHandler;
				handlerArguments = [controlName].concat(toConsumableArray(args));
			} else {
				if (controlName != 'control') {
					trigger.call.apply(trigger, [this, childEvent].concat(toConsumableArray(args)));
				}
				return;
			}

			var delay = this.getOption('debounceChildControlEvents');
			if (_.isNumber(delay) && delay > 0) {
				if (!dcce[handlerName]) {
					dcce[handlerName] = _.debounce(handler, delay);
				}
				handler = dcce[handlerName];
			}

			var handlerResult = handler.apply(this, handlerArguments);
			if (handlerResult && handlerResult.then) {
				handlerResult.then(function () {
					trigger.call.apply(trigger, [_this5, childEvent].concat(toConsumableArray(args)));
				});
			}
		},


		defaultChildControlEvents: {
			'change': function change(controlName, value) {
				var isControlWraper = this.getOption('isControlWrapper');
				isControlWraper && (controlName = undefined);
				this.setControlValue(value, { key: controlName, skipChildValidate: controlName });
			},
			'done': function done(controlName, value) {
				var _this6 = this;

				var isControlWraper = this.getOption('isControlWrapper');
				isControlWraper && (controlName = undefined);
				var setPromise = this.setControlValue(value, { key: controlName, skipChildValidate: controlName });
				if (isControlWraper) {
					setPromise = setPromise.then(function () {
						_this6.controlDone();
						return Promise.resolve();
					});
				}
				return setPromise;
			},
			'invalid': function invalid(controlName, value, error) {
				if (this.getOption('isControlWrapper')) {
					controlName = undefined;
				}
				this.setControlValue(value, { key: controlName, silent: true, notValidated: true });
				this.makeInvalid(error, this.getControlValue({ notValidated: true }));
			}
		},

		controlDone: function controlDone() {
			if (!this._cntrl.isValid || this._cntrl.isDone) {
				return;
			}
			var value = this.getControlValue();
			this._cntrl.isDone = true;
			this._tryTriggerEvent('done', [value]);
		},


		/*
  	helpers
  */
		_clone: function _clone(value) {
			if (_.isArray(value)) return value.slice(0);else if (_.isObject(value)) {
				return clone(value);
			} else return value;
		},
		_tryTriggerEvent: function _tryTriggerEvent(name) {
			var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

			var _ref3 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
			    silent = _ref3.silent,
			    stopPropagation = _ref3.stopPropagation;

			if (silent) {
				return;
			}
			var controlName = this.getControlName();
			var event = 'control:' + name;
			var namedEvent = controlName + ':' + name;

			var trigger = getTriggerMethod(this);
			var parent = this.getParentControl();

			if (stopPropagation || !parent) {
				trigger.call.apply(trigger, [this, event].concat(toConsumableArray(args)));
				return;
			}

			if (_.isFunction(parent.handleChildControlEvent)) {
				parent.handleChildControlEvent.apply(parent, [name, controlName].concat(toConsumableArray(args)));
			} else {
				var parentTrigger = getTriggerMethod(parent);
				parentTrigger.call.apply(parentTrigger, [parent, namedEvent].concat(toConsumableArray(args)));
			}

			trigger.call.apply(trigger, [this, event].concat(toConsumableArray(args)));
		},
		makeControlReady: function makeControlReady() {
			var trigger = getTriggerMethod(this);
			trigger.call(this, 'control:ready');
		}
	}, { ControlMixin: true });
});

//import { isView, isViewClass } from '../../../vendors/helpers.js';
var controlViewMixin = (function (Base) {
	if (Base == null) {
		Base = CollectionView$1;
	}

	if (!isClass(Base, CollectionView$1)) {
		throw new Error('controlView mixin can be applied only on marionette CollectionView');
	}

	var Mixed = Base;

	if (Mixed.ControlViewMixin) {
		return Mixed;
	}

	if (!Mixed.ControlMixin) {
		Mixed = controlMixin(Mixed);
	}

	if (!Mixed.CssClassModifiersMixin) {
		Mixed = cssClassModifiersMixin(Mixed);
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

		constructor: function constructor() {
			Mixed.apply(this, arguments);
			this._setControlValidInvalidListeners();
			this.addCssClassModifier('control-wrapper');
		},
		_setControlValidInvalidListeners: function _setControlValidInvalidListeners() {
			var _this = this;

			if (this._controlValidInvalidListeners) {
				return true;
			}

			this.on({
				'control:valid': this._onControlValid,
				'control:invalid': this._onControlInvalid
			});
			if (this.getOption('validateOnReady')) {
				this.once('customs:render', function () {
					return _this.makeControlReady();
				});
			}

			this._controlValidInvalidListeners = true;
		},
		getCustoms: function getCustoms() {
			var customs = [];
			if (this.getOption('isControlWrapper')) {
				customs.push(this.getControlView());
			} else {
				var _customs;

				(_customs = customs).push.apply(_customs, toConsumableArray(this._customs));
			}
			customs = this.injectSystemViews(customs);
			return customs;
			//this._prepareCustoms(customs);
		},
		_setupCustom: function _setupCustom(view) {
			this._setupChildControl(view);
			this.setupCustom(view);
		},
		_setupChildControl: function _setupChildControl(view) {
			if (_.isFunction(view.setParentControl)) {
				view.setParentControl(this);
			}
			this.setupChildControl(view);
		},

		setupChildControl: _.noop,
		injectSystemViews: function injectSystemViews() {
			var customs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

			customs.unshift(this.getHeaderView());
			customs.push(this.getErrorView(), this.getFooterView());
			return customs;
		},
		getErrorView: function getErrorView() {
			if (!this.getOption('shouldShowError')) {
				return;
			}
			if (this.getOption('showValidateError', { force: false })) {
				return;
			}
			this._errorView = this.buildErrorView();
			return this._errorView;
		},
		buildErrorView: function buildErrorView() {
			return buildViewByKey(this, 'errorView');
		},
		getHeaderView: function getHeaderView() {
			return this.buildHeaderView({ tagName: 'header' });
		},
		buildHeaderView: function buildHeaderView(options) {
			return this._buildNestedTextView('header', options);
		},
		_buildNestedTextView: function _buildNestedTextView(key, options) {
			var TextView = this.getOption('TextView');
			var buildText = void 0;
			if (!TextView) {
				buildText = function buildText(text, opts) {
					return new View$1(_.extend({}, opts, { template: function template() {
							return text;
						} }));
				};
			}
			return buildViewByKey(this, key, { TextView: TextView, buildText: buildText, options: options });
		},
		getFooterView: function getFooterView() {
			if (this.getOption('buttonsInFooter')) {
				return this.buildButtonsView();
			} else {
				return this.buildFooterView();
			}
		},
		buildFooterView: function buildFooterView() {
			return this._buildNestedTextView('footer', { tagName: 'footer' });
		},
		buildButtonsView: function buildButtonsView() {
			if (this._buttonsView) {
				this.stopListening(this._buttonsView);
			}

			var options = this.buildButtonsOptions();
			var view = buildViewByKey(this, 'buttonsView', { options: options });
			if (!view) {
				return;
			}

			this._buttonsView = view;
			this.settleButtonsListeners(view);

			return view;
		},
		buildButtonsOptions: function buildButtonsOptions() {
			var _this2 = this;

			var btns = this.getOption('buttons');
			if (btns) {
				return _.reduce(btns, function (hash, b) {
					var item = _this2.buildButton(b, _this2);
					hash[item.name] = item;
					return hash;
				}, {});
			}
		},
		buildButton: function buildButton(value) {
			if (_.isString(value)) {
				return this.buildButton({ text: value, className: value, name: value });
			} else if (_.isFunction(value)) {
				return this.buildButton(value.call(this));
			} else if (_.isObject(value)) {
				return this.fixButton(value);
			}
		},
		fixButton: function fixButton(button) {
			return button;
		},
		settleButtonsListeners: function settleButtonsListeners(buttonsView) {
			var _this3 = this;

			this.on({
				// 'control:valid': () => {
				// 	buttonsView.enableButton('resolve');
				// },
				// 'control:invalid': () => {
				// 	buttonsView.disableButton('resolve');
				// },
				'control:done': function controlDone(value) {
					_this3._fulfill('resolve', value);
				}
			});

			this.listenTo(buttonsView, {
				'resolve': function resolve() {
					var value = this.getControlValue();
					this._fulfill('resolve', value);
					//this.triggerMethod('resolve', this.getControlValue());
				},
				'reject': function reject() {
					this._fulfill('reject');
					//this.triggerMethod('reject');
				},
				'reject:soft': function rejectSoft() {
					this._fulfill('reject:soft');
					//this.triggerMethod('reject:soft');
				},
				'reject:hard': function rejectHard() {
					this._fulfill('reject:hard');
					//this.triggerMethod('reject:hard');
				}
			});
		},
		_fulfill: function _fulfill(type) {
			for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
				rest[_key - 1] = arguments[_key];
			}

			this.triggerMethod.apply(this, [type].concat(toConsumableArray(rest)));
		},
		getControlView: function getControlView() {
			this.control = buildViewByKey(this, 'controlView', { options: { parentControl: this, value: this.getControlValue() } });
			return this.control;
		},
		_onControlInvalid: function _onControlInvalid(value, error) {
			this.disableButtons();
			this._showValidateError(error);
		},
		_onControlValid: function _onControlValid() {
			this.enableButtons();
			this._hideValidateError();
		},
		disableButtons: function disableButtons() {
			if (this._buttonsView && _.isFunction(this._buttonsView.disableButton)) {
				this._buttonsView.disableButton('resolve');
			}
		},
		enableButtons: function enableButtons() {
			if (this._buttonsView && _.isFunction(this._buttonsView.enableButton)) {
				this._buttonsView.enableButton('resolve');
			}
		},
		_showValidateError: function _showValidateError(error) {

			var shouldShow = this.getOption('shouldShowError');
			var skipFirstValidationError = this.getOption('skipFirstValidationError');

			if (skipFirstValidationError && !this._firstValidationErrorSkipped) {
				this._firstValidationErrorSkipped = true;
				return;
			}

			if (!shouldShow) return;

			var show = this.getOption('showValidateError', { force: false });
			if (_.isFunction(show)) {
				show.call(this, error);
			} else {
				if (!this._errorView) return;
				this._errorView.showError(error);
			}
		},
		_hideValidateError: function _hideValidateError() {
			var hide = this.getOption('hideValidateError', { force: false });
			if (_.isFunction(hide)) {
				hide.call(this);
			} else {
				if (!this._errorView) return;
				this._errorView.hideError();
			}
		}
	}, { ControlViewMixin: true });
});

var promiseBarMixin = (function (Base) {
	if (Base == null) {
		Base = CollectionView$1;
	}

	if (!isClass(Base, CollectionView$1)) {
		throw new Error('promiseBar mixin can be applied only on CollectionView');
	}

	var Mixed = Base;

	if (!Mixed.CssClassModifiersMixin) {
		Mixed = cssClassModifiersMixin(Mixed);
	}

	return Mixed.extend({
		constructor: function constructor(options) {
			this._buttons = {};
			Base.apply(this, arguments);
			this.addPromiseBarCssClass();
			this.mergeOptions(options, ['promise', 'reject', 'resolve', 'beforeRejectSoft', 'beforeRejectHard', 'beforeResolve']);
		},

		tagName: 'footer',
		resolve: 'ok',
		triggerNameEvent: true,
		addPromiseBarCssClass: function addPromiseBarCssClass() {
			this.addCssClassModifier('promise-bar');
		},
		onRender: function onRender() {
			this.addButtons();
		},
		addButtons: function addButtons() {
			var buttons = this.buildButtons() || [];
			while (buttons.length) {
				var button = buttons.pop();
				var preventRender = !!buttons.length;
				this.addChildView(button, { preventRender: preventRender });
			}
		},
		buildButtons: function buildButtons() {
			var _this = this;

			var names = ['resolve', 'rejectSoft', 'rejectHard'];
			return _.reduce(names, function (buttons, name) {
				var button = _this.buildButton(name);
				button && buttons.push(button);
				return buttons;
			}, []);
		},
		buildButton: function buildButton(name) {
			var options = this.getButtonOptions(name);
			if (!options) return;
			var Button$$1 = this.getOption('buttonView');
			if (!Button$$1) {
				Button$$1 = this.buttonView = Button(View$1);
			}
			var btn = new Button$$1(options);
			this._buttons[name] = btn;
			return btn;
		},
		getButtonOptions: function getButtonOptions(name) {
			var options = this.getOption(name);
			if (!options) return;
			if (_.isString(options)) {
				options = { text: options };
			} else if (!_.isObject(options)) {
				return;
			}
			var defs = {
				className: name,
				name: name,
				triggerNameEvent: this.getOption('triggerNameEvent'),
				stopEvent: true,
				text: options.text || name
			};
			options = _.extend(defs, options);
			return options;
		},

		childViewEvents: {
			'click:resolve': function clickResolve(data) {
				this.triggerMethod('resolve', data);
			},
			'click:rejectSoft': function clickRejectSoft(value) {
				this.triggerMethod('reject', { type: 'soft', value: value });
				this.triggerMethod('reject:soft', value);
			},
			'click:rejectHard': function clickRejectHard(value) {
				this.triggerMethod('reject', { type: 'hard', value: value });
				this.triggerMethod('reject:hard', value);
			},
			'click:fail': function clickFail(error, name, event, view) {
				this.triggerMethod('click:fail', error, name, event, view);
				if (name) {
					this.triggerMethod('click:' + name + ':fail', error, event, view);
				}
			}
		},

		disableButton: function disableButton(name) {
			var btn = this._buttons[name];
			btn && btn.disable();
		},
		enableButton: function enableButton(name) {
			var btn = this._buttons[name];
			btn && btn.enable();
		}
	});
});

var PromiseBar = promiseBarMixin(CollectionView).extend({
	buttonView: Button
});

var textView = View.extend({
	template: _.template('<%= text %>'),
	templateContext: function templateContext() {
		return {
			text: this.getOption('text')
		};
	}
});

var ControlView = controlViewMixin(CollectionView).extend({
	renderAllCustoms: true,
	buttonsView: PromiseBar,
	textView: textView,
	fixButton: function fixButton(btn) {
		if (btn.name != btn.text) {
			return btn;
		}

		if (btn.text === 'rejectSoft') {
			btn.text = 'cancel';
		}

		return btn;
	}
});

var common = {
	_createSchema: function _createSchema() {
		var schema = this.getOption('schema', { args: [this.model, this] });
		var Schema = this.getSchemaClass();

		if (schema instanceof Schema) {
			return schema;
		}

		if (schema == null || _.isObject(schema)) {
			return this.createSchema(Schema, schema);
		}
	},
	getSchema: function getSchema() {
		if (this._schema) {
			return this._schema;
		}

		this._schema = this._createSchema();
		return this._schema;
	},
	createSchema: function createSchema(Schema) {
		var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		return new Schema(options);
	},
	getSchemaClass: function getSchemaClass() {
		return this.getOption('schemaClass');
	}
};

var SchemaErrorView = View.extend({
	className: 'control-validate-wrapper',
	cssClassModifiers: [function (m, v) {
		return v.errorMessage ? 'error' : '';
	}],
	getTemplate: function getTemplate() {
		var _this = this;

		return function () {
			return _this.errorMessage;
		};
	},
	showError: function showError(error) {
		if (_.isArray(error)) {
			error = error.join(', ').trim();
		}
		this.errorMessage = error;
		this.render();
	},
	hideError: function hideError() {
		this.errorMessage = '';
		this.render();
	}
});

var editPropertyMixin = (function (Base) {
	var Mixed = mix(Base).with(controlViewMixin, common);

	return Mixed.extend({

		shouldShowError: false,
		errorView: SchemaErrorView,
		className: 'edit-model-property',
		schemaClass: PropertySchema,
		debounceChildControlEvents: 0,

		getDefaultValidateRule: function getDefaultValidateRule(options) {
			var schema = this.getSchema();
			var rule = _.extend({}, schema.getType(options), schema.getValidation(options));
			return rule;
		},
		getValidateRule: function getValidateRule() {
			var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

			var rule = this.getDefaultValidateRule(options);
			return rule;
		},
		getHeaderView: function getHeaderView() {
			return this._getHeaderView();
		},
		_getHeaderView: function _getHeaderView() {
			var TextView = this.getOption('textView');
			var buildText = void 0;
			if (!TextView) {
				buildText = function buildText(text, opts) {
					return new View$1(_.extend({}, opts, { template: function template() {
							return text;
						} }));
				};
			}
			var view = buildViewByKey(this, 'header', { TextView: TextView, buildText: buildText, options: { tagName: 'header' } });
			if (view) {
				return view;
			}

			if (this.getOption('propertyLabelAsHeader')) {
				var label = this.getSchema().getLabel();
				if (TextView) {
					return new TextView({ text: label, tagName: 'header' });
				} else {
					return new View$1({ template: function template() {
							return label;
						}, tagName: 'header' });
				}
			}
		},
		getControlView: function getControlView() {
			var options = {
				value: this.getControlValue(),
				allValues: this.getParentControlValue(),
				model: this.model
			};
			var editOptions = this.getSchema().getEdit(options);
			return this.buildPropertyView(editOptions);
		},
		controlValidate: function controlValidate(value, allValues) {
			var rule = this.getValidateRule({ value: value, allValues: allValues });
			if (!rule || !_.size(rule)) return;
			return validator.validate(value, rule, { allValues: allValues });
		},


		// must be overrided
		// accepts:	options arguments.
		// returns:	should return Control instance
		buildPropertyView: function buildPropertyView() {
			throw new Error('buildPropertyView not implemented. You should build view by your own');
		}
	});
});

var editModelMixin = (function (Base) {
	var Mixed = mix(Base).with(controlViewMixin, common);

	return Mixed.extend({

		shouldShowError: false,
		shouldShowPropertyError: true,
		propertyErrorView: SchemaErrorView,
		validateOnReady: true,
		buttonsInFooter: true,
		isControlWrapper: false,
		schemaClass: ModelSchema,
		editPropertyClass: editPropertyMixin,

		propertyLabelAsHeader: true,

		className: 'edit-model-control',

		getCustoms: function getCustoms() {
			var _customs, _customs2;

			var customs = [];
			(_customs = customs).push.apply(_customs, toConsumableArray(this.getPropertiesViews()));
			(_customs2 = customs).push.apply(_customs2, toConsumableArray(this._customs));
			customs = this.injectSystemViews(customs);
			return customs;
		},
		getPropertiesViews: function getPropertiesViews() {
			var _this = this;

			var modelSchema = this.getSchema();
			var propertiesToShow = this.getOption('propertiesToShow', { args: [this.model, this] }) || [];
			if (!propertiesToShow.length) {
				propertiesToShow = modelSchema.getPropertiesNames();
			}
			return _.map(propertiesToShow, function (name) {
				return _this._createEditProperty(name, modelSchema);
			});
		},
		_createEditProperty: function _createEditProperty(name, modelSchema) {
			var schema = modelSchema.getProperty(name, { create: true });
			var EditProperty = this.getEditPropertyClass();
			var def = {
				controlName: name,
				schema: schema,
				value: this.getPropertyValue(name),
				allValues: this.getControlValue({ notValidated: true }),
				propertyLabelAsHeader: this.getOption('propertyLabelAsHeader')
			};
			if (this.getOption('shouldShowPropertyError')) {
				def.shouldShowError = true;
				def.errorView = this.getOption('propertyErrorView');
			}
			var options = this.getEditPropertyOptions(def);
			return this.createEditProperty(EditProperty, options);
		},
		getPropertyValue: function getPropertyValue(property) {
			return this.getControlValue(property);
		},
		getEditPropertyClass: function getEditPropertyClass() {
			return this.getOption('editPropertyClass');
		},
		getEditPropertyOptions: function getEditPropertyOptions(defaultOptions) {
			return _.extend({}, defaultOptions, this.getOption('editPropertyOptions'));
		},
		createEditProperty: function createEditProperty(EditProperty, options) {
			return new EditProperty(options);
		}
	});
});

//import { isClass } from 'bbmn-core';
var controls = {};

function guesControl(arg) {
	if (!_.isObject(arg)) {
		return;
	}
	var control = getControlByName(arg.control);

	if (!control) {
		control = getControlByName(arg.type);
	}

	if (!control && !!arg.sourceValues) {
		control = getControlByName('select');
	}

	return control;
}

function getControlByName(name) {
	return controls[name];
}

function getControlBySchema(schema) {
	var value = schema.getType();
	var control = getControlByName(value.control);
	if (!control) {
		control = getControlByName(value.type);
	}
	if (!control && !!value.sourceValues) {
		control = getControlByName('select');
	}
	return control;
}

function getControl(arg) {
	var control = void 0;
	if (_.isString(arg)) {
		control = getControlByName(arg);
	} else if (arg instanceof PropertySchema) {
		control = getControlBySchema(arg);
	} else {
		control = guesControl(arg);
	}
	return control || controls.default;
}

function defineControl(name, Control) {
	if (!_.isString(name)) {
		throw new Error('name must be a string');
	}
	controls[name] = Control;
}

var BaseEditProperty = mix(ControlView).with(editPropertyMixin);

var EditProperty = BaseEditProperty.extend({
	getEditControl: function getEditControl() {
		return getControl(this.getSchema());
	},
	getEditControlOptions: function getEditControlOptions(editOptions) {
		return editOptions;
	},
	buildPropertyView: function buildPropertyView(editOptions) {
		var Control = this.getEditControl();
		var options = this.getEditControlOptions(editOptions);
		return new Control(options);
	}
});

var EditModel = mix(ControlView).with(editModelMixin).extend({
	editPropertyClass: EditProperty
});

var _getOption = function _getOption(context, key, checkAlso) {
	return getOption(context, key, { args: [context], checkAlso: checkAlso });
};

function getInputType(inputView) {
	var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


	var valueType = _getOption(inputView, 'valueType', opts);
	if (valueType == null) {
		var value = inputView.getControlValue();
		if (value == null) {
			valueType = 'string';
		} else {
			if (_.isNumber(value)) valueType = 'number';else if (_.isDate(value)) valueType = 'datetime';else valueType = 'string';
		}
	}

	if (valueType == 'number') {
		inputView._valueIsNumber = true;
	}

	var type = _getOption(inputView, 'inputType', opts);
	if (type == null) {
		type = _getOption(inputView.valueOptions, 'inputType', opts.valueOptions);
	}
	if (!type) {
		if (inputView._valueIsNumber) {
			type = _getOption(inputView, 'inputNumberType', opts) || 'number';
		} else if (valueType == 'string') {
			type = 'text';
		} else if (valueType == 'datetime') {
			type = 'datetime';
		} else {
			type = 'text';
		}
	}
	inputView.inputType = type;
	inputView.valueType = valueType;
	return type;
}

function setInputAttributes(inputView) {
	var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


	var attributes = getOption(inputView, opts, 'attributes');

	var check = _.extend({}, inputView, opts, inputView.valueOptions, opts.valueOptions);

	var restrictionKeys = {
		'maxLength': 'maxlength',
		'minLength': 'minlength',
		'minValue': 'min',
		'maxValue': 'max',
		'valuePattern': 'pattern',
		'required': 'required',
		'value': 'value'
	};
	var restrictions = {};
	_(restrictionKeys).each(function (key2, key) {
		var value = check[key];
		if (value != null) restrictions[key2] = value;
	});

	inputView.attributes = _.extend({
		value: inputView.value,
		type: getInputType(inputView, opts)
	}, restrictions, attributes);

	if (opts.attributes) delete opts.attributes;
}

var getOption$1 = (function (context, key, ifNull) {
  return getOption(context, key, { args: [context], default: ifNull });
});

function isChar(event) {
	return event.key && event.key.length == 1 && !event.ctrlKey;
}

function keydown (eventContext) {
	var context = eventContext.context,
	    event = eventContext.event;


	if (context.triggerMethod('keydown', event) === false) {
		return;
	}

	var prevent = false;
	var stop = false;

	if (isChar(event)) {
		if (!context.isEnteredCharValid(event.key)) {
			prevent = true;
		}
	}
	if (event.keyCode == 13 && getOption$1(context, 'doneOnEnter', true)) {
		prevent = true;
		stop = true;
	}

	stop && event.stopPropagation();
	prevent && event.preventDefault();
}

function keyup (eventContext) {
	var context = eventContext.context,
	    event = eventContext.event;


	if (context.triggerMethod('keyup', event) === false) {
		return;
	}

	if (event.keyCode == 13) {

		var shouldDone = getOption$1(context, 'doneOnEnter', true);
		if (shouldDone) {

			event.stopPropagation();
			event.preventDefault();
			context.controlDone();
		}
	}
}

function paste (eventContext) {
	var context = eventContext.context,
	    event = eventContext.event;


	if (context.triggerMethod('paste', event) === false) {
		return;
	}

	var text = event.originalEvent.clipboardData.getData('text/plain');
	if (!text) return;
	if (!context.isValueValid(text)) {
		event.preventDefault();
		event.stopPropagation();
	}
}

function blur (eventContext) {
	var context = eventContext.context,
	    event = eventContext.event;


	if (context.triggerMethod('blur', event) === false) {
		return;
	}

	if (getOption$1(context, 'doneOnBlur', true)) {
		context.controlDone();
	}
}

function focus (eventContext) {
	var context = eventContext.context,
	    input = eventContext.input,
	    event = eventContext.event;


	if (context.triggerMethod('focus', event) === false) {
		return;
	}

	if (getOption$1(context, 'selectOnFocus', true)) {
		input.select();
	}
}

function input (eventContext) {
	var context = eventContext.context,
	    input = eventContext.input,
	    event = eventContext.event;


	if (context.triggerMethod('input', event) === false) {
		return;
	}

	context.setControlValue(event.target.value).then(function (newvalue) {
		if (event.target.value != (newvalue || '').toString()) {
			input.value = newvalue;
		}
	});
}

var eventHandlers = {
	keydown: keydown,
	//keypress,
	keyup: keyup,
	paste: paste,
	blur: blur,
	focus: focus,
	input: input
	//'js:change': jsChange
};

function handleInputEvent(control, eventName, event) {
	var options = _.extend({
		context: control,
		input: control.el,
		restrictions: control.restrictions,
		eventName: eventName,
		event: event
	});

	var method = camelCase('on:dom:' + eventName);

	if (_.isFunction(eventHandlers[eventName])) {
		eventHandlers[eventName].call(control, options);
	}

	if (_.isFunction(control[method])) {
		control[method](event, options);
	}
}

var _getOption$1 = function _getOption(context, key, checkAlso) {
	return getOption(context, key, { args: [context], checkAlso: checkAlso });
};

function setInputEvents(inputView) {
	var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


	var passedEvents = _getOption$1(inputView, 'events', opts);

	var eventsArray = _(eventHandlers).keys();
	var events = _.reduce(eventsArray, function (Memo, eventName) {
		Memo[eventName] = function (event) {
			handleInputEvent(this, eventName, event);
		};
		return Memo;
	}, {});
	inputView.events = _.extend(events, passedEvents);
}

//import { convertString as convert, getOption } from '../../../utils/index.js';
var inputMixin = (function (Base) {
	var Mixin = Base.ControlMixin ? Base : controlMixin(Base);
	return Mixin.extend({
		constructor: function constructor(opts) {
			var _this = this;

			this._initControl(opts);

			setInputAttributes(this, opts);
			setInputEvents(this, opts);
			Mixin.apply(this, arguments);

			if (!_.isFunction(this.getOption)) {
				this.getOption = function () {
					for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
						args[_key] = arguments[_key];
					}

					return getOption.apply(undefined, [_this].concat(args));
				};
			}

			this.buildRestrictions();
			var value = this.getOption('value') || '';
			this.el.value = value;
			//this.setControlValue(value, { trigger: false, silent: true });
		},

		tagName: 'input',
		template: false,
		doneOnEnter: true,
		doneOnBlur: true,
		buildRestrictions: function buildRestrictions() {
			var attrs = _.result(this, 'attributes');
			var pickNumbers = ['maxlength', 'minlength', 'min', 'max'];
			var pickStrings = ['pattern'];
			var pickBools = ['required'];
			var restrictions = {};
			_(attrs).each(function (value, key) {
				var pick = false;
				key = key.toLowerCase();
				if (pickNumbers.indexOf(key) > -1) {
					value = convertString(value, 'number');
					pick = true;
				} else if (pickStrings.indexOf(key) > -1) {
					pick = true;
				} else if (pickBools.indexOf(key) > -1) {
					pick = true;
					value = convertString(value, 'boolean', { returnNullAndEmptyAs: true, returnOtherAs: true });
				}
				pick && (restrictions[key] = value);
			});
			this.restrictions = restrictions;
		},
		prepareValueBeforeSet: function prepareValueBeforeSet(value) {
			if (value == null || value === '') return value;

			var len = this.getMaxLength();
			if (len > 0) {
				value = value.toString().substring(0, len);
			}
			if (this._valueIsNumber) {
				var num = convertString(value, 'number');
				if (isNaN(num)) return;
				var min = this.restrictions.min;
				var max = this.restrictions.max;
				!isNaN(min) && num < min && (num = min);
				!isNaN(max) && num > max && (num = max);
				return num;
			}
			return value;
		},
		getValueType: function getValueType() {
			return this.valueType;
		},
		convertValue: function convertValue(value) {
			return convertString(value, this.getValueType());
		},
		getMaxLength: function getMaxLength() {
			return this.restrictions.maxlength;
		},
		isLengthValid: function isLengthValid() {
			var value = this.getControlValue();
			var len = this.getMaxLength();
			return len == null || value.length < len;
		},
		isEnteredCharValid: function isEnteredCharValid(char) {
			var type = this.getValueType();

			if (type == 'number') {
				return ['.', '-'].indexOf(char) > -1 || !isNaN(parseInt(char, 10));
			} else {
				return true;
			}
		},
		isValueValid: function isValueValid(value) {
			var type = this.getValueType();
			if (type == 'number') {
				return !isNaN(parseFloat(value, 10));
			} else {
				return true;
			}
		},
		controlValidate: function controlValidate(value) {
			if (value == null || value === '') {
				if (this.restrictions.required) return 'required';else if (this.restrictions.minLength > 0) {
					return 'length:small';
				} else return;
			}
			var strValue = value.toString();
			if (_.isNumber(this.restrictions.maxlength) && strValue.length > this.restrictions.maxlength) return 'length:big';
			if (this._valueIsNumber) {
				if (!_.isNumber(value)) return 'not:number';
				if (_.isNumber(this.restrictions.min) && value < this.restrictions.min) return 'less:than:min';
				if (_.isNumber(this.restrictions.max) && value > this.restrictions.max) return 'greater:than:max';
			}
			if (this.restrictions.pattern) {
				var pattern = RegExp(this.restrictions.pattern);
				if (pattern.test(strValue)) {
					return 'pattern:mismatch';
				}
			}
		}
	});
});

var InputControl = inputMixin(View);

defineControl('default', InputControl);
defineControl('text', InputControl);
defineControl('number', InputControl);

var common$1 = {
	isSelected: function isSelected() {
		var selector = this.getOption('selector');
		return selector && selector.isSelected(this.model);
	},
	getText: function getText() {
		var text = this.getOption('text', { args: [this.model, this] });
		if (!text) {
			text = _.isFunction(this.model.getLabel) && this.model.getLabel() || undefined;
		}
		if (!text) {
			text = this.model.get('value');
		}
		if (!text) {
			text = this.model.id;
		}
		return text;
	},
	triggerSelect: function triggerSelect(event) {
		this.triggerMethod('toggle:select', this, event);
	},
	_addSelectCssModifiers: function _addSelectCssModifiers() {
		this.addCssClassModifier('select-item');
		this.addCssClassModifier(function (m, v) {
			return v.isSelected() ? 'selected' : '';
		});
	}
};
var selectableViewMixin = (function (Base) {
	return Base.extend({
		constructor: function constructor() {
			Base.apply(this, arguments);
			common$1._addSelectCssModifiers.call(this);
		},

		isSelected: common$1.isSelected,
		triggerSelect: common$1.triggerSelect
	}, { SelectableViewMixin: true });
});

var DefaultChildView = mix(View).with(selectableViewMixin).extend({
	renderOnModelChange: true,
	template: _.template('<i></i><span><%= text %></span><i></i>'),
	templateContext: function templateContext() {
		return {
			text: this.getText()
		};
	},

	triggers: {
		'click': 'toggle:select'
	},
	// events:{
	// 	'click'(event){
	// 		event.stopPropagation();
	// 		this.triggerMethod('toggle:select', this, event);
	// 	}
	// },
	// triggers: {
	// 	'click':{name:'toggle:select', stopPropagation: true}
	// },
	getText: common$1.getText
});

//import fixChildView from './fix-childview';
//import { Collection } from 'bbmn-core';
var BaseSelectControl = initSelectorMixin(ControlView);
var SelectControl = BaseSelectControl.extend({
	className: 'regular-select',
	renderCollection: true,
	doneOnSelect: true,
	cssClassModifiers: ['select-control', function (m, v) {
		return v.isMultiple() ? 'multiple' : '';
	}],
	constructor: function constructor() {
		BaseSelectControl.apply(this, arguments);
		this.collection = this.selector.getCollection();
	},

	childView: DefaultChildView,
	getSelector: function getSelector() {
		if (!this.selector) {
			var selectorOptions = this._getSelectorOptions();
			this.selector = new Selector(selectorOptions);
		}
		return this.selector;
	},
	onSelectorChange: function onSelectorChange() {
		var _this = this;

		var setPromise = this.setControlValue(this.selector.getValue());
		if (!this.isMultiple() && this.getOption('doneOnSelect')) {
			setPromise.then(function () {
				_this.controlDone();
			});
		}
	},
	_getSelectorOptions: function _getSelectorOptions() {
		var source = this.getSource();

		var type = this.valueOptions.type;
		var extractValue = this.getOption('extractValue', { force: false });
		if (type == 'boolean') {
			source = _.map(source, function (value, ind) {
				return { id: toBool(ind), value: value };
			});
			!extractValue && (extractValue = function extractValue(model) {
				return model.id;
			});
		}
		var value = this.getControlValue();
		if (this.isMultiple() && type === 'enum' && _.isString(value)) {
			value = value.split(/\s*,\s*/g);
		}
		var opts = {
			value: value,
			source: source,
			multiple: this.isMultiple()
		};
		if (extractValue) {
			opts.extractValue = extractValue;
		}

		return opts;
	},
	setFilter: function setFilter(filter) {
		this.selector.setSourceFilter(filter);
	},
	isMultiple: function isMultiple() {
		return this.valueOptions.multiple === true;
	},
	prepareValueBeforeSet: function prepareValueBeforeSet(value) {
		var _this2 = this;

		var type = this.valueOptions.type;
		if (type == 'text') {
			return value != null ? value.toString() : value;
		} else if (type == 'boolean') {
			return toBool(value);
		} else if (_.isString(value)) {
			return convertString(value, this.valueOptions.type);
		} else if (_.isArray(value)) {
			if (this.valueOptions.type == 'enum') {
				return value.join(', ');
			} else {
				return _.map(value, function (val) {
					return convertString(val, _this2.valueOptions.type);
				});
			}
		} else {
			return value;
		}
	},
	getSource: function getSource() {
		var src = this.valueOptions.sourceValues;
		if (_.isFunction(src)) {
			src = src();
		}
		return src;
	}
});

defineControl('select', SelectControl);

var BooleanSwitchControl = ControlView.extend({
	template: _.template('<i></i><small></small>'),
	constructor: function constructor() {
		ControlView.apply(this, arguments);
		this.addCssClassModifier(function (m, v) {
			return v.getState();
		});
		this.addCssClassModifier('boolean-switch');
		this._initClickHandler();
		this.on('control:change', this.refreshStateLabel);
		this.refreshStateLabel();
	},

	ui: {
		label: 'span'
	},
	getState: function getState() {
		var val = this.getControlValue({ transform: toBool });
		return 'is-' + val.toString();
	},

	clickSelector: '',
	_initClickHandler: function _initClickHandler() {
		var event = ('click ' + this.getOption('clickSelector')).trim();
		this.delegateEvents(defineProperty({}, event, 'clickHandler'));
	},
	clickHandler: function clickHandler(event) {
		event.stopPropagation();
		var val = this.getControlValue();
		this.setControlValue(!val);
	},
	refreshStateLabel: function refreshStateLabel() {
		var labels = this.getOption('labels');
		if (!_.isObject(labels)) {
			return;
		}
		var val = this.getControlValue() === true;
		var label = labels[val];
		if (isEmptyValue(label)) {
			return;
		}
		this.ui.label.html(label);
	},
	prepareValueBeforeSet: function prepareValueBeforeSet(value) {
		return toBool(value);
	}
});

var index = {
	Button: Button, buttonMixin: buttonMixin,
	controlMixin: controlMixin,
	ControlView: ControlView, controlViewMixin: controlViewMixin,
	EditProperty: EditProperty, editPropertyMixin: editPropertyMixin, EditModel: EditModel, editModelMixin: editModelMixin, SchemaErrorView: SchemaErrorView,
	Input: InputControl, inputMixin: inputMixin,
	PromiseBar: PromiseBar, promiseBarMixin: promiseBarMixin,
	controls: controls, defineControl: defineControl, getControl: getControl,
	SelectControl: SelectControl, selectableViewMixin: selectableViewMixin,
	BooleanSwitchControl: BooleanSwitchControl
};

export { Button, buttonMixin, controlMixin, ControlView, controlViewMixin, EditProperty, editPropertyMixin, EditModel, editModelMixin, SchemaErrorView, InputControl as Input, inputMixin, PromiseBar, promiseBarMixin, controls, defineControl, getControl, SelectControl, selectableViewMixin, BooleanSwitchControl };
export default index;

//# sourceMappingURL=index.js.map
