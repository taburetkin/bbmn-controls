import editPropertyMixin from './property.js';
import editModelMixin from './model.js';
import { mix } from 'bbmn-utils';
import ControlView from '../control-view';
import { getControl } from '../controls';
import SchemaErrorView from './error-view';

const BaseEditProperty = mix(ControlView).with(editPropertyMixin);

const EditProperty = BaseEditProperty.extend({
	getEditControl(){
		return getControl(this.getSchema());
	},
	getEditControlOptions(editOptions){
		return editOptions;
	},
	buildPropertyView(editOptions){
		let Control = this.getEditControl();
		let options = this.getEditControlOptions(editOptions);
		return new Control(options);
	},
});

const EditModel = mix(ControlView).with(editModelMixin).extend({
	editPropertyClass: EditProperty
});

export {
	editPropertyMixin,
	editModelMixin,
	EditProperty,
	EditModel,
	SchemaErrorView
};
