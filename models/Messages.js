const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");

const { Schema } = mongoose;

const MessagesSchema = new Schema({
  sender: {
    type: Schema.ObjectId,
    ref: "Users"
  },
  content: {
    type: String
  },
  conversation: {
    type: Schema.ObjectId,
    ref: "Conversations"
  },

}, { timestamps: true });

MessagesSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    subject: this.subject,
    participants: this.participants,

    addedBy: this.addedBy,

    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

MessagesSchema.plugin(mongoosePaginate);
mongoose.model("Messages", MessagesSchema);
