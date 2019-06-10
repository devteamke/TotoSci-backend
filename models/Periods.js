const mongoose = require('mongoose');

const { Schema } = mongoose;

const PeriodSchema = new Schema({
  	name:{
		type:String,
	},
    start:{
		type:Date
	},
	end:{
		type:Date
	},
	courses:[
		{
			type:String
		}
	]
	   
}, { timestamps: true });

PeriodSchema.methods.toJSON = function() {
  return {
    _id: this._id,

    
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
 
    
  };
};

mongoose.model('Period', PeriodsSchema);