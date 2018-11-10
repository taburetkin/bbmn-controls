
import _ from 'underscore';
import { clone, setByPath, getByPath, compareObjects, betterResult, takeFirst } from 'bbmn-utils';

function getTriggerMethod(context){
	if(!context) { return () => {}; }
	return _.isFunction(context.triggerMethod) ? context.triggerMethod
		: _.isFunction(context.trigger) ? context.trigger
			: () => {};
}

function ensureError(error, value){
	if(error instanceof Error){
		throw error;
	}
	return arguments.length > 1 ? value : error;
}


export default Base => Base.extend({

	isControl: true,
	validateOnReady: false,

	constructor(options){		
		this._initControl(options);
		Base.apply(this, arguments);
		if (this.getOption('validateOnReady')) {
			this.once('control:ready', () => {
				this.validate().catch(() => {});
			});
		}
		if (this.getOption('destroyOnDone')) {
			this.once('control:done', () => {
				this.destroy();
			});
		}
		//this.editOptions = this.getOption('editOptions') || {};
		this.valueOptions = this.getOption('valueOptions') || {};
	},



	_onControlDestroy(){
		let parent = this.getParentControl();
		if (parent && _.isFunction(parent._removeChildControl)) {
			parent._removeChildControl(this);
		}
		let children = this.getChildrenControls();
		if (children) {
			_.each(children, child => child._removeParentControl());
			children.length = 0;
		}
		delete this._cntrl;
	},
	_removeChildControl(control){
		this.off(control);
		let children = this.getChildrenControls();
		if (!children.length) { return; }
		let index = children.indexOf(control);
		if (index === -1) return;
		children.splice(index, 1);
	},
	_addChildControl(control){
		let controlName = control.getControlName();
		let children = this.getChildrenControls();
		let found = _.find(children, child => child.getControlName() === controlName);
		!found && children.push(control);
	},
	_removeParentControl(){
		delete this._cntrl.parent;
	},



	_initControl(options = {}){
		if (this._controlInitialized) { return; }

		this._cntrl = {};
		let name = takeFirst('controlName', options, this) || 'control';
		this._cntrl.name = name;

		let value = takeFirst('value', options, this);
		value = this._clone(value);
		this.initControlValue(value);
		this.initParentControl(options);

		this.once('destroy', this._onControlDestroy);

		this._controlInitialized = true;
	},
	initParentControl(options){
		let parent = takeFirst('proxyTo', options, this) || takeFirst('parentControl', options, this);
		this.setParentControl(parent);
	},
	setParentControl(parent){
		this._cntrl.parent = parent;
		if (parent && _.isFunction(parent._addChildControl)) {
			parent._addChildControl(this);
		}
	},
	initControlValue(value){
		this._cntrl.initial = value;
		this._cntrl.value = value;
	},
	getControlName(){
		return this._cntrl.name;
	},

	isSameControlValue(value){
		let current = this.getControlValue();
		return this.isValid() && compareObjects(current, value);
	},

	getControlValue(key, options = {}){
		
		if(_.isObject(key)) {
			options = key;
			key = undefined;
		}
		let { notValidated, clone } = options;
		let valueKey = notValidated ? 'notValidated' : 'value';
		let value = this._cntrl[valueKey];
		if (key != null) {
			value = getByPath(value, key);
		} else {
			value = clone ? this._clone(value) : value;
		}
		if (_.isFunction(options.transform)){
			value = options.transform.call(this, value);
		}
		return value;
	},

	setControlValue(value, options = {}){
		let  { key, notValidated } = options;
		value = this._prepareValueBeforeSet(value, { key });
		const resolve = Promise.resolve(value);
		if (this.isSameControlValue(value)) { return resolve; }

		this._cntrl.notValidated = value;

		if (notValidated) { return resolve; }
		return this._setControlValue(value, options);
	},

	_prepareValueBeforeSet(value, { key } = {}){
		value = this.prepareValueBeforeSet(value);
		if (key == null) { return value; }

		let current = this.getControlValue({ notValidated: true, clone: true }) || {};
		setByPath(current, key, value);
		return current;
	},

	//override this if you need to modify value before set
	prepareValueBeforeSet: value => value,

	_setControlValue(value, options = {}) {
		let { skipValidation } = options;
		if (skipValidation) {
			return this._onSetControlValueValidateSuccess(value, options);
		}
		return this._validate(value, options)
			.then(
				() => this._onSetControlValueValidateSuccess(value, options), 
				error => this._onSetControlValueValidateFail(error, value, options)
			);
	},
	_onSetControlValueValidateSuccess(value, options){
		this._cntrl.previous = this._cntrl.value;
		this._cntrl.value = value;
		this._cntrl.isDone = false;
		this._tryTriggerEvent('change', [value], options);
		return Promise.resolve(value);
	},

	_onSetControlValueValidateFail(error, value, options){
		this._tryTriggerEvent('change:fail', [value, error], options);
		return ensureError(error, value);
	},

	isValid(){
		return this._cntrl.isValid !== false;
	},

	validate(options = {}){

		let notValidated = !this.isValid();
		let value = this.getControlValue({ notValidated });
		let promise = this._validate(value, options);
		let _catch = options.catch;

		if (_catch === false) {
			return promise;
		} else if(_.isFunction(_catch)) {
			return promise.catch(_catch);
		} else {
			return promise.catch(ensureError);
		}
	},
	_validate(value, options){

		let validate = this._validatePromise(value, options);

		return validate.then(
			() => this._onControlValidateSuccess(value, options),
			error => this._onControlValidateFail(error, value, options)
		);
	},
	_validatePromise(value, options){
		
		const { skipChildValidate } = options;
		const isControlWrapper = betterResult(this, 'isControlWrapper', { args:[this]});

		
		return new Promise((resolve, reject) => {
			let childrenErrors = {
				children: {}
			};
			let childrenPromise = this._validateChildrenControlsPromise({ skipChildValidate, isControlWrapper }, childrenErrors);

			childrenPromise.then(() => {

				if (_.size(childrenErrors.children)) {
					reject(childrenErrors.children);
					return;
				} else if (childrenErrors.wrapped) {
					reject(childrenErrors.wrapped);
					return;
				}
			
				let promise = this._validateControlPromise(value, options);

				promise.then(
					() => {
						resolve(value);
					},
					error => {
						reject(error);
					}
				);

			});
		});		
	},
	_validateControlPromise(value, options){
		let validate = this.getOption('controlValidate', { force: false });
				
		//if there is no validation defined, resolve
		if (!_.isFunction(validate)) {
			
			return Promise.resolve(value);
		}

		let values = this.getParentControlValue({ notValidated: true });
		let validateResult = validate.call(this, value, values, options);

		let promise = Promise.resolve(value);
		if (validateResult && validateResult.then) {
			promise = validateResult;
		} else if (validateResult) {
			promise = Promise.reject(validateResult);
		}
		return promise;
	},
	_validateChildrenControlsPromise({ isControlWrapper, skipChildValidate} = {}, errors = {}){

		let children = this.getChildrenControls();
		let childrenPromise = Promise.resolve();
		if (!children.length) return childrenPromise;

		return _.reduce(children, (finaly, child) => {
			let control = child.getControlName();

			finaly = finaly.then(() => {

				if (!child.validate || (skipChildValidate && control == skipChildValidate)) {
					return Promise.resolve();
				}
				let validateResult = child.validate({ stopPropagation: true, catch: false });

				return validateResult;
			}).catch(error => {

				if(isControlWrapper){
					errors.wrapped = error;
				} else {
					errors.children[control] = error;
				}
				return Promise.resolve();
			});
			return finaly;
		}, childrenPromise);		

	},

	_onControlValidateSuccess(value, options){
		this.makeValid(value, options);
		return Promise.resolve(value);
	},
	makeValid(value, options){
		this._cntrl.isValid = true;
		if(!this.isSameControlValue(value)){
			this._setControlValue(value, { silent: true, skipValidation: true });
		}
		this._tryTriggerEvent('valid', [value], options);
	},
	_onControlValidateFail(error, value, options){
		this.makeInvalid(error, value, options);
		return Promise.reject(error);
	},
	makeInvalid(error, value, options){
		this._cntrl.isValid = false;
		this._tryTriggerEvent('invalid', [value, error], options);
	},










	getParentControl() {
		return this._cntrl.parent;
	},
	getParentControlValue(options) {

		let parent = this.getParentControl();
		if (!parent || !_.isFunction(parent.getControlValue)) {
			return;
		}
		if (betterResult(parent, 'isControlWrapper', { args:[this]})) {
			return parent.getParentControlValue(options);
		} else {
			return parent.getControlValue(options);
		}
	},

	getChildrenControls(){
		if(!this._cntrl.children) {
			this._cntrl.children = [];
		}
		return this._cntrl.children;
	},
	handleChildControlEvent(event, controlName, ...args) {
		let childEvent = controlName + ':' + event;
		let trigger = getTriggerMethod(this);

		let cce = this.getOption('childControlEvents', { args: [this] }) || {};
		let def = this.defaultChildControlEvents || {};
		if(!this._debouncedChildControlEvents) {
			this._debouncedChildControlEvents = {};
		}
		let dcce = this._debouncedChildControlEvents;

		let defHandler = def[event];
		let handler = cce[childEvent];
		let handlerArguments = [];
		let handlerName;
		if (_.isFunction(handler)) {
			handlerArguments = args;
			handlerName = childEvent;
			//handler.apply(this, args);
		} else if(_.isFunction(defHandler)){
			handlerName = '_default:' + event;
			handler = defHandler;
			handlerArguments = [controlName, ...args];
		} else {
			
			trigger.call(this, childEvent, ...args);
			return;
		}
		
		let delay = this.getOption('debounceChildControlEvents');
		if(_.isNumber(delay) && delay > 0){
			if(!dcce[handlerName]){
				dcce[handlerName] = _.debounce(handler, delay);
			}
			handler = dcce[handlerName];
		}

		let handlerResult = handler.apply(this, handlerArguments);
		if(handlerResult && handlerResult.then) {
			handlerResult.then(() => {
				trigger.call(this, childEvent, ...args);
			});
		}
		
	},

	defaultChildControlEvents:{
		'change'(controlName, value){
			let isControlWraper = this.getOption('isControlWrapper');
			isControlWraper && (controlName = undefined);
			this.setControlValue(value, { key: controlName, skipChildValidate: controlName });
		},
		'done'(controlName, value){
			let isControlWraper = this.getOption('isControlWrapper');
			isControlWraper && (controlName = undefined);
			let setPromise = this.setControlValue(value, { key: controlName, skipChildValidate: controlName });
			if (isControlWraper) {
				setPromise = setPromise.then(() => {
					this.controlDone();
					return Promise.resolve();
				});
			}
			return setPromise;
		},
		'invalid'(controlName, value, error){
			if(this.getOption('isControlWrapper')){
				controlName = undefined;
			}
			this.setControlValue(value, { key: controlName, silent: true, notValidated: true });
			this.makeInvalid(error, this.getControlValue({ notValidated: true }));
		},
	},

	controlDone(){
		if (!this._cntrl.isValid || this._cntrl.isDone) { return; }
		let value = this.getControlValue();
		this._cntrl.isDone = true;
		this._tryTriggerEvent('done', [value]);
	},


	/*
		helpers
	*/
	_clone(value){
		if(_.isArray(value))
			return value.slice(0);
		else if(_.isObject(value)) {
			return clone(value);
		} else
			return value;
	},
	_tryTriggerEvent(name, args = [], { silent, stopPropagation } = {}){
		if (silent) { return; }
		let controlName = this.getControlName();
		let event = 'control:' + name;
		let namedEvent = controlName + ':' + name;

		let trigger = getTriggerMethod(this);
		let parent = this.getParentControl();
		
		if (stopPropagation || !parent) { return; }

		if (_.isFunction(parent.handleChildControlEvent)) {
			parent.handleChildControlEvent(name, controlName, ...args);
		} else {
			let parentTrigger = getTriggerMethod(parent);
			parentTrigger.call(parent, namedEvent, ...args);
		}
		
		trigger.call(this, event, ...args);
	},
	makeControlReady(){
		let trigger = getTriggerMethod(this);
		trigger.call(this, 'control:ready');
	},

}, { ControlMixin: true });
