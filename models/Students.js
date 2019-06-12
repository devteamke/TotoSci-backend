const mongoose = require('mongoose');

const { Schema } = mongoose;

const StudentsSchema = new Schema({
 
    fname:{
        type:String   
    },
    lname:{
        type:String   
    },
   
	parent:{
		 type: Schema.Types.ObjectId, 
		 ref: 'Users' 
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
    lname:this.lname,
   
    status:this.status,

   parent:this.parent,
    
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
 
    
  };
};

mongoose.model('Students', StudentsSchema);