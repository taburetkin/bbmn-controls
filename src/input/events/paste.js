export default function(eventContext) {
	let { context, event } = eventContext;

	
	if (context.triggerMethod('paste', event) === false) { return; }


	let text = event.originalEvent.clipboardData.getData('text/plain');
	if (!text) return;
	if (!context.isValueValid(text)) {
		event.preventDefault();
		event.stopPropagation();
	}
}
