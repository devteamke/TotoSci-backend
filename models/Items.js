const mongoose = require('mongoose');

const { Schema } = mongoose;

const ItemsSchema = new Schema({
 name:String,
 category:{type:String,
    enum:['drink','food','other'],
        
    },
 price:Number,
 description:String,
 type:{ type:String,
      required:true
 },
 suppliers:[{type:String}],
 qty:{type:Number,
        default:0
    }
}, { timestamps: true });

ItemsSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    name:this.name,
    category:this.category,
    price:this.price,
    qty:this.qty,
    description:this.description,
    type:this.type,
    suppliers:this.suppliers,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    
  };
};

mongoose.model('Items', ItemsSchema);