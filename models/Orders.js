const mongoose = require('mongoose');

const { Schema } = mongoose;

const OrdersSchema = new Schema({
 employee:String,
 amount:Number,
 orderItems:[{
    itemId : String,
    itemName:String,
    qty: Number,
    unitPrice: Number,
    totalPrice: Number,
    
     }],
}, { timestamps: true });

OrdersSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    by:this.employee,
    paid:this.amount,
    orderItems:this.orderItems,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    
  };
};

mongoose.model('Orders', OrdersSchema);