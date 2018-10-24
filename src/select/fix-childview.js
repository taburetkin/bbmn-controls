import _ from 'underscore';
import mixin, { common } from './selectable-view-mixin';
import { mix } from 'bbmn-utils';

export default function fixChildView(control, View) {

	if (View == null) {
		return;	
	}

	let proto = View.prototype;

	let mixWith = [];
	if(!_.isFunction(proto.isSelected)) {
		mixWith.push(mixin);
	}
	if(!_.isFunction(proto.template) && !_.isFunction(proto.getText)){
		mixWith.push({ getText: common.getText });
	}
	if (mixWith.length) {
		View = mix(View).with(...mixWith);
	}

	return View;
}
