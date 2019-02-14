const mongoose = require('mongoose');

const { Schema } = mongoose;

const PlacesSchema = new Schema({
 name:String,
 place_id:String,
 location:Object,
 phone_number:String,
 photos: [{
            type: String
            }],
 rating:Number,
 vicinity:String,

 
 
}, { timestamps: true });

PlacesSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    place_id:this.place_id,
    name:this.name,
    location:this.location,
    photos:this.photos,
    phone_number:this.phone_number,
    rating:this.rating,
    vicinity:this.vicinity,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    
  };
};

mongoose.model('Places', PlacesSchema);