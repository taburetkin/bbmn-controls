import _ from 'underscore';
import getInputType from './get-input-type.js';

import { getOption } from 'bbmn-utils';

function fixAttributes(attrs, view, opts)
{
	let tagName = getOption(view, opts, 'tagName');
	if(['select', 'textarea'].indexOf(tagName) > -1) {
		delete attrs.value;
		delete attrs.type;
	}
	return attrs;
}

export default function setInputAttributes(inputView, opts = {}) {

	let attributes = getOption(inputView, opts, 'attributes');

	let check = _.extend({}, inputView, opts, inputView.valueOptions, opts.valueOptions);

	let restrictionKeys = {
		'maxLength':'maxlength', 
		'minLength':'minlength',
		'minValue':'min', 
		'maxValue':'max', 
		'valuePattern':'pattern',
		'required':'required',
		'value':'value'
	};

	let restrictions = {};
	_(restrictionKeys).each((key2, key) => {
		let value = check[key];
		if (value != null)
			restrictions[key2] = value;
	});

	let newattributes = _.extend({
		value: inputView.value,
		type: getInputType(inputView, opts),
	}, restrictions, attributes);
	
	inputView.attributes = fixAttributes(newattributes, inputView, opts);

	if(opts.attributes)
		delete opts.attributes;
}
