import _ from 'underscore';
//import { isClass } from 'bbmn-core';
import { PropertySchema } from 'bbmn-components';

const controls = {

};

function guesControl(arg) {
	if(!_.isObject(arg)) {
		return;
	}
	let control = getControlByName(arg.control);

	if(!control){
		control = getControlByName(arg.type);
	}

	if (!control && !!arg.sourceValues) {
		control = getControlByName('select');
	}

	return control;
}

function getControlByName(name){
	return controls[name];
}

function getControlBySchema(schema, opts = {}){
	let value = schema.getType(opts);
	let control = getControlByName(value.control);
	if (!control && value.modelType == 'range' && !opts.noRange) {
		control = getControlByName('range:' + value.type);
		if(!control){
			control = getControlByName('range');
		}
	}
	if (!control && !!value.sourceValues) {
		control = getControlByName('select');
	}
	if (!control) {
		control = getControlByName(value.type);
	}
	return control;
}

function getControl(arg, opts){
	let control;
	if(_.isString(arg)){
		control = getControlByName(arg, opts);
	} else if(arg instanceof PropertySchema) {
		control = getControlBySchema(arg, opts);
	} else {
		control = guesControl(arg, opts);
	}
	return control || controls.default;
}

function defineControl(name, Control){
	if(!_.isString(name)) {
		throw new Error('name must be a string');
	}
	controls[name] = Control;
}



export {
	defineControl,
	getControl,
	controls,
};
