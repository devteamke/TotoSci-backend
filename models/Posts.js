const mongoose = require('mongoose');

const { Schema } = mongoose;

const PostsSchema = new Schema({
 by:String,
 title:String,
 place_id:String,
 image:String,
 rating:Number,
 body:String,
 
 
}, { timestamps: true });

PostsSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    by:this.by,
    title:this.title,
    place_id:this.place_id,
    title:this.title,
    image:this.image,
    rating:this.rating,
    body:this.body,
    likes:{type:Number,
        default:0
    },
    comments:{type:Number,
        default:0
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    
  };
};

mongoose.model('Posts', PostsSchema);