const mongoose = require('mongoose');

const { Schema } = mongoose;

const ReviewSchema = new Schema({
    user_id:String,
    username:String,
    place_id:String,
    review:String,
    rating:Number,
   
 
}, { timestamps: true });

ReviewSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    user_id:this.user_id,
    username:this.username,
    review:this.review,
    rating:this.rating,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    
  };
};

mongoose.model('Review', ReviewSchema);