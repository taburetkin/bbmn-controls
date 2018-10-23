import { View } from '../config';
import inputMixin from './mixin';

import { defineControl } from '../controls';
const InputControl = inputMixin(View);

defineControl('default', InputControl);
defineControl('text', InputControl);
defineControl('number', InputControl);

export default InputControl;
export {
	inputMixin
};
