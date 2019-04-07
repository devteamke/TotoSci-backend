const mongoose = require('mongoose');

const { Schema } = mongoose;

const PlaceLikeSchema = new Schema({
 user_id:String,

 place_id:String,

 
}, { timestamps: true });

PlaceLikeSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    user_id:this.user_id,
   
    place_id:this.place_id,

    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    
  };
};

mongoose.model('PlaceLike', PlaceLikeSchema);