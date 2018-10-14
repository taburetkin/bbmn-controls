import _ from 'underscore';
import { View } from 'bbmn-components';

export default View.extend({
	className:'control-validate-wrapper',
	cssClassModifiers:[
		(m,v) => v.errorMessage ? 'error' : ''
	],
	getTemplate(){		
		return () => this.errorMessage;
	},
	showError(error){
		if(_.isArray(error)){
			error = error.join(', ').trim();
		}
		this.errorMessage = error;
		this.render();
	},
	hideError(){
		this.errorMessage = '';
		this.render();
	}
});
