import _ from 'underscore';

import { View } from '../config';
import Control from '../control-view';
import { camelCase } from 'bbmn-utils';
import { inputMixin } from '../input';
import { defineControl } from '../controls';

const TextArea = inputMixin(View).extend({
	doneOnEnter: false,
	tagName:'textarea',
	template: data => data.value,
	templateContext(){
		return {
			value: this.getControlValue()
		};
	}
});


const inputEvents = ['focus','blur','input','keyup','keydown'];

const TextAreaControl = Control.extend({
	
	constructor(){
		Control.apply(this, arguments);
		this.addCssClassModifier('control-textarea');
	},
	controlView: TextArea,
	controlViewOptions(){
		let attributes = this.getOption('inputAttributes');

		let options = {
			valueOptions: this.getOption('valueOptions')
		};
		if (attributes) {
			options.attributes = attributes;			
		}
		return _.extend(options, this._delegateInputEvents());
	},
	_delegateInputEvents(){
		let delegatedHandlers = {};
		_.each(inputEvents, name => {
			let handlerName = camelCase('on', name);
			let handler = this.getOption(handlerName, { force: false });
			if(_.isFunction(handler)) {
				delegatedHandlers[handlerName] = (...args) => {
					return this.triggerMethod(name, ...args);
				};
			}
		});
		return delegatedHandlers;
	}
});

export default TextAreaControl;

defineControl('bigtext', TextArea);
defineControl('textarea', TextArea);
