import _ from 'underscore';
import editPropertyMixin from './property.js';
import editModelMixin from './model.js';
import { mix } from 'bbmn-utils';
import ControlView from '../control-view';
import Input from '../input';
import build from './build-control';

const BaseEditProperty = mix(ControlView).with(editPropertyMixin);

const EditProperty = BaseEditProperty.extend({
	buildPropertyView(editOptions = {}){
		
		let control = build(editOptions);
		if (control) { return control; }

		let options = _.extend({}, editOptions, {
			inputAttributes:{
				name: editOptions.name,
			},
		});

		return new Input(options);
	},
});

const EditModel = mix(ControlView).with(editModelMixin).extend({
	editPropertyClass: EditProperty
});

export {
	editPropertyMixin,
	editModelMixin,
	EditProperty,
	EditModel
};
