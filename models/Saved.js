const mongoose = require('mongoose');

const { Schema } = mongoose;

const SavedSchema = new Schema({
    user_id:String,
    type:{
        type:String,
        enum:['place','post'],
        },
    post_id:String,
    place_id:String,
   
 
}, { timestamps: true });

SavedSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    by:this.by,
    post_id:this.post_id,
    place_id:this.place_id,

    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    
  };
};

mongoose.model('Saved', SavedSchema);