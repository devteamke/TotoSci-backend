const mongoose = require("mongoose");

const { Schema } = mongoose;

const FeeSchema = new Schema(
  {
    pId: {
      type: String,
      unique: true
    },

    trans: [
      {
        type: String
      }
    ],
    invoice: [
      {
        type: String
      }
    ],
    balance: {
      type: Number
    }
  },
  { timestamps: true }
);

FeeSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    pId: this.pId,
    trans: this.trans,

    invoice: this.invoice,
    balance: this.balance,

    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

mongoose.model("Fee", FeeSchema);
