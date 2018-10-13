import Textarea from '../textarea';


const controls = {
	'textarea'(options = {}){
		let value = options.value;
		return new Textarea({ value });
	},
	'enum:buttons'(){},
};


export default function getControlByString(name, options = {}){
	let build = controls[name];
	if(!build) return;
	return build(options);
}
