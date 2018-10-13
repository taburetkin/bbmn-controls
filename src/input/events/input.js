export default function(eventContext) {

	let { context, input, event } = eventContext;

	if (context.triggerMethod('input', event) === false) { return; }


	context.setControlValue(event.target.value).then(newvalue => {
		if (event.target.value != (newvalue || '').toString()) {
			input.value = newvalue;
		}
	});

}
