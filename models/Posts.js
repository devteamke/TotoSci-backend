const mongoose = require('mongoose');

const { Schema } = mongoose;

const PostsSchema = new Schema({
 by:String,
 title:String,
 place_id:String,
 place_name:String,
 image:String,
 rating:Number,
 body:String,
  likes:{type:Number,
        default:0
    },
    comments:{type:Number,
        default:0
    },
 
 
}, { timestamps: true });

PostsSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    by:this.by,
    title:this.title,
    place_id:this.place_id,
    place_name:this.place_name,
    title:this.title,
    image:this.image,
    rating:this.rating,
    body:this.body,
    likes:this.likes,
    comments:this.comments,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    
  };
};

mongoose.model('Posts', PostsSchema);