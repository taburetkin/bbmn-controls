import _ from 'underscore';
import { getOption } from 'bbmn-utils';
const _getOption = (context, key, checkAlso) => getOption(context, key, { args:[context], checkAlso });

export default function getInputType(inputView, opts = {}){
	
	let valueType = _getOption(inputView, 'valueType', opts);
	
	if(opts.valueOptions && opts.valueOptions.type) {
		valueType = opts.valueOptions.type;
	}

	if (valueType == null) {
		let value = inputView.getControlValue();
		if ( value == null) {
			valueType = 'string';
		} else {
			if(_.isNumber(value))
				valueType = 'number';
			else if(_.isDate(value))
				valueType = 'datetime';
			else
				valueType = 'string';
		}		
	}

	if (valueType == 'number') {
		inputView._valueIsNumber = true;
	}

	let type = _getOption(inputView, 'inputType', opts);
	if(type == null){
		type = _getOption(inputView.valueOptions, 'inputType', opts.valueOptions);
	}
	if (!type) {
		if (inputView._valueIsNumber) {
			type = _getOption(inputView, 'inputNumberType', opts) || 'number';
		} else if (valueType == 'string') {
			type = 'text';
		} else if (valueType == 'datetime') {
			type = 'datetime';
		} else {
			type = 'text';
		}
	}
	inputView.inputType = type;
	inputView.valueType = valueType;
	return type;
}
