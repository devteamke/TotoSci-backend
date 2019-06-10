const mongoose = require('mongoose');

const { Schema } = mongoose;

const CourseSchema = new Schema({
    name:{
		type:String,
	},
    subject:{
		type:Array
	},
	fee:{
		type:Array //of objects 
	},
	period:{
		type:String
	}
  
   
   
   
}, { timestamps: true });

CourseSchema.methods.toJSON = function() {
  return {
    _id: this._id,

    
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
 
    
  };
};

mongoose.model('Course', CoursesSchema);