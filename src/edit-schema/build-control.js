import _ from 'underscore';
import { isViewClass } from 'bbmn-utils';
import getControlByString from './get-control-by-string';


function guesControl(options = {}){
	let { valueOptions = {} } = options;
	let { inputType } = valueOptions;
	if (inputType == 'textarea') {
		return getControlByString('textarea', options);
	}
}


export default function buildControl(options = {}){
	let { valueOptions = {}, editOptions = {}, name, label, value } = options;
	let { control } = editOptions;
	
	if (control) {
		if (isViewClass(control)) {
			return new control(options);
		} else if (_.isString(control)) {
			control = getControlByString(control, options);
			if (control) {
				return control;
			}
		}
	}
	
	return guesControl(options);

}
