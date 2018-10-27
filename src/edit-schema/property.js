import _ from 'underscore';

import { validator, PropertySchema } from 'bbmn-components';

import { mix, buildViewByKey } from 'bbmn-utils';

import { controlViewMixin } from '../control-view/index.js';
import common from './common.js';
import { View } from 'backbone.marionette';
import errorView from './error-view';

export default Base => {
	const Mixed = mix(Base).with(controlViewMixin, common);

	return Mixed.extend({
		
		shouldShowError: false,
		errorView,
		className:'edit-model-property',
		schemaClass: PropertySchema,
		debounceChildControlEvents: 0,


		getDefaultValidateRule(options){
			let schema = this.getSchema();
			let rule = _.extend({}, schema.getType(options), schema.getValidation(options));
			return rule;
		},
		getValidateRule(options = {}){
			let rule = this.getDefaultValidateRule(options);
			return rule;
		},
		
		getHeaderView(){
			return this._getHeaderView();
		},
		_getHeaderView(){
			let TextView = this.getOption('textView');
			let buildText;
			if (!TextView) {
				buildText = (text, opts) => new View(_.extend({}, opts, { template: () => text }));
			}
			let view = buildViewByKey(this, 'header', { TextView, buildText, options: { tagName: 'header' } });
			if(view) { return view; }

			if(this.getOption('propertyLabelAsHeader')) {
				let label = this.getSchema().getLabel();
				if(TextView) {
					return new TextView({ text: label, tagName: 'header'});
				} else {
					return new View({ template: () => label, tagName: 'header'});
				}
			}
		},
		getControlView(){
			let options = {
				value: this.getControlValue(),
				allValues: this.getParentControlValue(),				
			};
			let editOptions = this.getSchema().getEdit(options);
			return this.buildPropertyView(editOptions);
		},
		controlValidate(value, allValues){
			let rule = this.getValidateRule({ value, allValues });
			if(!rule || !_.size(rule)) return;
			return validator.validate(value, rule, { allValues });
		},
		
		// must be overrided
		// accepts:	options arguments.
		// returns:	should return Control instance
		buildPropertyView(){
			throw new Error('buildPropertyView not implemented. You should build view by your own');
		},

	});
};
