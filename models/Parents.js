const mongoose = require('mongoose');

const { Schema } = mongoose;

const ParentsSchema = new Schema({
    pId:{
		type:String,
		unique:true
	},
    
    trans:[{
            type:String
        }
        ],
    invoice:[
        {
         type:String
        }
        ],
    balance:{
        type:Number
    },
}, { timestamps: true });

ParentsSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    pId:this.pId,
    trans:this.trans,
    
    invoice:this.status,

   balance:this.balance,
    
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
 
    
  };
};

mongoose.model('Parents', ParentsSchema);