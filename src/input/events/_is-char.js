export default function isChar(event){
	return event.key && event.key.length == 1 && !event.ctrlKey;
}