const mongoose = require('mongoose');

const { Schema } = mongoose;

const ClassListSchema = new Schema({
    studentName:{
		type:String,
	},
    performance:{
		type:Array //'[CAT, ASSIGNMENT ,QUIZ]'
	},
	attendace:{
		type:Array, //'[ {date: boolean } ]' //May be split into a different table
	}

   
   
   
}, { timestamps: true });

ClassListSchema.methods.toJSON = function() {
  return {
    _id: this._id,

    
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
 
    
  };
};

mongoose.model('ClassList', ClassListSchema);