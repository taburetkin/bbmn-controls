import _ from 'underscore';

export default {
	_createSchema(){
		let schema = this.getOption('schema', { args: [ this.model, this ] });
		let Schema = this.getSchemaClass();

		if(schema instanceof Schema){
			return schema;
		}

		
		if(schema == null || _.isObject(schema)) {
			return this.createSchema(Schema, schema);
		}
		
	},
	getSchema(){
		if(this._schema) { return this._schema; }
		
		this._schema = this._createSchema();
		return this._schema;
	},
	createSchema(Schema, options = {}){
		return new Schema(options);
	},
	getSchemaClass(){
		return this.getOption('schemaClass');
	},
};
