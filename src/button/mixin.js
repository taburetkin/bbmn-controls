import _ from 'underscore';
import { View } from 'backbone.marionette';

export default Base => {
	if (Base == null) {
		Base = View;
	}
	return Base.extend({

		triggerNameEvent: true,
		stopEvent: true,
		leftIcon: true,
		rightIcon: true,
		forceText: true,
		beforeClickIsAlwaysPromise: true,
		constructor(options){
			Base.apply(this, arguments);
			this.mergeOptions(options, ['name']);
		},

		tagName:'button',
		getTemplate(){
			let html = [];
			let icon = '<i></i>';
			
			if (this.getOption('leftIcon')) {
				html.push(icon);
			}
			
			let forceText = this.getOption('forceText');
			if (this.getText() || forceText) {
				html.push('<span><%= text %></span>');
			}

			if (this.getOption('rightIcon')) {
				html.push(icon);
			}
			return _.template(html.join(''));
		},
		events(){
			if(this.getOption('noevent')){
				return;
			}
			let events = {
				click(e) {
					let stop = this.getOption('stopEvent');
					if (stop) {
						e.stopPropagation();
						e.preventDefault();
					}

					let before = this.beforeClick();
					if (before && before.then) {
						before.then(
							data => this.triggerClick(data, e),
							error => this.triggerError(error, e)
						);
					} else {
						this.triggerClick(before, e);
					}
				}
			};
			return events;
		},
		beforeClick(){
			let result = this.triggerMethod('before:click');
			if(result && _.isFunction(result.then) ) {
				return result;
			} else {
				if (this.getOption('beforeClickIsAlwaysPromise')) {
					return Promise.resolve(result);
				} else {
					return result;
				}
			}
		},
		triggerClick(data, event){
			let options = {
				event,
				name: this.name,
				buttonView: this,
			};
			this.triggerMethod('click', data, options);
			if (this.name) {
				this.triggerMethod('click:' + this.name, data, options);
			}
		},
		triggerError(error, event){
			let options = {
				event,
				name: this.name,
				buttonView: this,
			};			
			this.triggerMethod('click:fail', error, options);
			if (this.name) {
				this.triggerMethod('click:'+this.name+':fail', error, options);
			}
		},
		getText(){
			return this.getOption('text');
		},
		templateContext(){
			return {
				text: this.getText()
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
