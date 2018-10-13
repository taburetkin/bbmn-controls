import _ from 'underscore';
import { View } from 'backbone.marionette';

export default Base => {
	if (Base == null) {
		Base = View;
	}
	Base.extend({

		triggerNameEvent: true,
		stopEvent: true,

		constructor(options){
			Base.apply(this, arguments);
			this.mergeOptions(options, ['name']);
		},
		tagName:'button',
		template: _.template('<i></i><span><%= text %></span><i></i>'),
		events:{
			'click'(e) {
				let stop = this.getOption('stopEvent');
				if (stop) {
					e.stopPropagation();
					e.preventDefault();
				}
				this.beforeClick().then(
					data => {
						this.triggerMethod('click', data, e, this);
						if (this.name) {
							this.triggerMethod('click:'+this.name, data, e, this);
						}
					},
					error => {
						this.triggerMethod('click:fail', error, this.name, e, this);
						if (this.name) {
							this.triggerMethod('click:'+this.name+':fail', error, e, this);
						}
					}
				);
			}
		},
		beforeClick(){
			let result = this.triggerMethod('before:click');
			if(result && _.isFunction(result.then) ) {
				return result;
			} else {
				return Promise.resolve(result);
			}
		},
		templateContext(){
			return {
				text: this.getOption('text')
			};
		},
		disable(){
			this.$el.prop('disabled', true);
		},
		enable(){
			this.$el.prop('disabled', false);
		},
	});
};
