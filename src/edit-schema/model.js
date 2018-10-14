import _ from 'underscore';
import { controlViewMixin } from '../control-view/index.js';
import common from './common.js';
import { mix } from 'bbmn-utils';
import EditProperty from './property.js';

import { ModelSchema } from 'bbmn-components';

import propertyErrorView from './error-view';

export default Base => {
	let Mixed = mix(Base).with(controlViewMixin, common);

	return Mixed.extend({

		shouldShowError: false,
		shouldShowPropertyError: true,
		propertyErrorView,
		validateOnReady: true,
		buttonsInFooter: true,
		isControlWrapper: false,
		schemaClass: ModelSchema,
		editPropertyClass: EditProperty,

		propertyLabelAsHeader: true,

		className:'edit-model-control',

		getCustoms(){
			let customs = [];
			customs.push(...this.getPropertiesViews());
			customs.push(...this._customs);
			customs = this.injectSystemViews(customs);
			return this._prepareCustoms(customs);
		},
		getPropertiesViews(){
			let modelSchema = this.getSchema();
			let propertiesToShow = this.getOption('propertiesToShow', { args: [ this.model, this ]}) || [];
			if(!propertiesToShow.length) {
				propertiesToShow = modelSchema.getPropertiesNames();
			}
			return _.map(propertiesToShow, name => this._createEditProperty(name, modelSchema));
		},
		_createEditProperty(name, modelSchema){
			let schema = modelSchema.getProperty(name, { create: true });
			let EditProperty = this.getEditPropertyClass();
			const def = {
				controlName: name,
				schema,
				value: this.getPropertyValue(name),
				allValues: this.getControlValue({ notValidated: true }),
				propertyLabelAsHeader: this.getOption('propertyLabelAsHeader')
			};
			if(this.getOption('shouldShowPropertyError')) {
				def.shouldShowError = true;
				def.errorView = this.getOption('propertyErrorView');
			}
			let options = this.getEditPropertyOptions(def);
			return this.createEditProperty(EditProperty, options);
		},
		getPropertyValue(property){
			return this.getControlValue(property);
		},
		getEditPropertyClass(){
			return this.getOption('editPropertyClass');
		},
		getEditPropertyOptions(defaultOptions){
			return _.extend({}, defaultOptions, this.getOption('editPropertyOptions'));
		},
		createEditProperty(EditProperty, options){
			return new EditProperty(options);
		},

	});
};
