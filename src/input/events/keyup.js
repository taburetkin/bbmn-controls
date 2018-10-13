import getOption from './_get-option.js';
export default function(eventContext) {
	let { context, event } = eventContext;

	if (context.triggerMethod('keyup', event) === false) { return; }

	if (event.keyCode == 13) {
		
		let shouldDone = getOption(context, 'doneOnEnter', true);
		if (shouldDone) {

			event.stopPropagation();
			event.preventDefault();
			context.controlDone();

		}

	}


}
