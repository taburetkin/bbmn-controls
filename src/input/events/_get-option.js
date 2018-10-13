import { getOption } from 'bbmn-utils';
export default (context, key, ifNull) => getOption(context, key, { args:[context], default: ifNull });

