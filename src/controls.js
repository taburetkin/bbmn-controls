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

function getControlBySchema(schema){
	let value = schema.getType();
	let control = getControlByName(value.control);
	if (!control) {
		control = getControlByName(value.type);		
	}
	if (!control && !!value.sourceValues) {
		control = getControlByName('select');
	}
	return control;
}

function getControl(arg){
	let control;
	if(_.isString(arg)){
		control = getControlByName(arg);
	} else if(arg instanceof PropertySchema) {
		control = getControlBySchema(arg);
	} else {
		control = guesControl(arg);
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
