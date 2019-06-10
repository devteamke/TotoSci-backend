const mongoose = require('mongoose');

const { Schema } = mongoose;

const ClassSchema = new Schema({
    name:{
		type:String,
	},
    year:{
        type:Number   
    },
	students:{
	    type:Number,	
	},
	parent:{
		type:String,
	},
  
    status:{type:String,
        enum:['active','suspended','expelled'],
        default:'active',
       required: true 
    },
   
   
}, { timestamps: true });

ClassSchema.methods.toJSON = function() {
  return {
    _id: this._id,
   
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
 
    
  };
};

mongoose.model('Class', ClasssSchema);