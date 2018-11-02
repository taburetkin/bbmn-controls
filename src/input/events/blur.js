import getOption from './_get-option.js';
export default function(eventContext) {
	let { context, event } = eventContext;

	if (context.triggerMethod('blur', event) === false) { return; }


	if (getOption(context, 'doneOnBlur', true)) {
		context.controlDone();
	}
}
