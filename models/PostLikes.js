const mongoose = require('mongoose');

const { Schema } = mongoose;

const PostLikeSchema = new Schema({
 user_id:String,
 post_id:String,
 place_id:String,

 
}, { timestamps: true });

PostLikeSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    user_id:this.user_id,
    post_id:this.post_id,
    place_id:this.place_id,

    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    
  };
};

mongoose.model('PostLike', PostLikeSchema);