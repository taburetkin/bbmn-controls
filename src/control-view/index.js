import _ from 'underscore';
import { View, CollectionView } from '../config';
import controlViewMixin from './mixin';
import PromiseBar from '../promise-bar';

const textView = View.extend({
	template: _.template('<%= text %>'),
	templateContext(){		
		return {
			text: this.getOption('text')
		};
	}
});

const ControlView = controlViewMixin(CollectionView).extend({
	renderAllCustoms: true,
	buttonsView: PromiseBar,
	textView,
	fixButton(btn){
		if (btn.name != btn.text) { return btn; }

		if (btn.text === 'rejectSoft') {
			btn.text = 'cancel';
		}

		return btn;
	}
});
export default ControlView;
export {
	controlViewMixin,
	ControlView
};
