import getOption from './_get-option.js';
export default function(eventContext) {
	let { context, input, event } = eventContext;

	if (context.triggerMethod('focus', event) === false) { return; }

	if (getOption(context, 'selectOnFocus', true)) {
		input.select();
	}
}
