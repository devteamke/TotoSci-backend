const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");

const { Schema } = mongoose;

const RequestsSchema = new Schema(
  {
    to: [
      {
        type: Schema.ObjectId,
        ref: "Users"
      }
    ],
    subject: {
      type: String
    },

    additionalInfo: Object, // Should include record type , record id ,

    response: Object, // whether  denied or accepted  and reason and by who

    addedBy: {
      type: Schema.ObjectId,
      ref: "Users"
    }
  },
  { timestamps: true }
);

RequestsSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    to: this.to,
    subject: this.subject,
    additionalInfo: this.additionalInfo,
    response: this.response,
    addedBy: this.addedBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

RequestsSchema.plugin(mongoosePaginate);
mongoose.model("Requests", RequestsSchema);
