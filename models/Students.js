const mongoose = require('mongoose');

const { Schema } = mongoose;

const StudentsSchema = new Schema({
    admno:{
		type:Number,
	},
    fname:{
        type:String   
    },
    lname:{
        type:String   
    },
    sname:{
        type:String     
    },
	residence:{
	    type:String,	
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

StudentsSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    fname:this.fname,
    sname:this.sname,
    lname:this.lname,
    admno:this.admno,
    status:this.status,

   parent:this.parent,
    
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
 
    
  };
};

mongoose.model('Students', StudentsSchema);