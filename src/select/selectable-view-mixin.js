import _ from 'underscore';
export const common = {
	isSelected(){
		let selector = this.getOption('selector');
		return selector && selector.isSelected(this.model);
	},
	getText(){
		let text = this.getOption('text', { args: [this.model, this] });
		if (!text) {
			text = _.isFunction(this.model.getLabel) && this.model.getLabel() || undefined;
		}
		if (!text) {
			text = this.model.get('value');
		}
		if (!text) {
			text = this.model.id;
		}
		return text;
	},
	triggerSelect(event){
		this.triggerMethod('toggle:select', this, event);
	},

	_addSelectCssModifiers(){
		this.addCssClassModifier('select-item');
		this.addCssClassModifier((m,v) => v.isSelected() ? 'selected':'');
	},
};
export default Base => Base.extend({
	constructor(){
		Base.apply(this, arguments);
		common._addSelectCssModifiers.call(this);
	},	
	isSelected: common.isSelected,
	triggerSelect: common.triggerSelect,
}, { SelectableViewMixin: true });
