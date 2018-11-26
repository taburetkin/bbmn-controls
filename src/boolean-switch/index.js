import _ from 'underscore';
import { ControlView } from '../control-view';
import { toBool, isEmptyValue } from 'bbmn-utils';
export default ControlView.extend({
	template:_.template('<i></i><small></small>'),
	constructor(){
		ControlView.apply(this, arguments);
		this.addCssClassModifier((m,v) => v.getState());
		this.addCssClassModifier('boolean-switch');
		this._initClickHandler();
		this.on('control:change', this.refreshStateLabel);
		this.refreshStateLabel();
	},
	ui:{
		label:'span'
	},
	getState(){
		let val = this.getControlValue({ transform: toBool });
		if (val == null) {
			val = false;
		}
		return 'is-' + val.toString();
	},
	clickSelector: '',
	_initClickHandler(){
		let event = ('click ' + this.getOption('clickSelector')).trim();
		this.delegateEvents({
			[event]:'clickHandler'
		});
	},
	clickHandler(event){
		event.stopPropagation();
		let val = this.getControlValue();
		this.setControlValue(!val);
	},
	refreshStateLabel(){
		let labels = this.getOption('labels');
		if(!_.isObject(labels)){
			return;
		}
		let val = this.getControlValue() === true;
		let label = labels[val];
		if (isEmptyValue(label)) {
			return;
		}
		this.ui.label.html(label);
		if (!this.model) {
			this.refreshCssClass();
		}
	},
	prepareValueBeforeSet(value){
		return toBool(value);
	}
});
