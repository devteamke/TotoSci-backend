const mongoose = require('mongoose');

const { Schema } = mongoose;

const CommentsSchema = new Schema({
 username:String,
 post_id:String,
 comment:String,
 status:{type:Number,
    default:1  
 }, //1 -read, 2-
 
}, { timestamps: true });

CommentsSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    username:this.username,
    post_id:this.post_id,
    comment:this.comment,

    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    
  };
};

mongoose.model('Comments', CommentsSchema);