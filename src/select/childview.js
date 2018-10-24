import _ from 'underscore';
import mixin, { common } from './selectable-view-mixin';
import { View } from 'bbmn-components';
import { mix } from 'bbmn-utils';

export default mix(View).with(mixin).extend({
	renderOnModelChange: true,
	template:_.template('<i></i><span><%= text %></span><i></i>'),
	templateContext(){
		return {
			text: this.getText()
		};
	},
	triggers: {
		'click':'toggle:select'
	},
	getText: common.getText
});
