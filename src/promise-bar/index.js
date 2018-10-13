import promiseBarMixin from './mixin';
import { CollectionView } from '../config';
import Button from '../button';

export default promiseBarMixin(CollectionView).extend({
	buttonView: Button
});

export {
	promiseBarMixin
};
