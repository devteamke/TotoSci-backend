const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");

const { Schema } = mongoose;

const ConversationsSchema = new Schema({
  subject: {
    type: String
  },
  type: {
    type: String,
    enum: ["individual", "broadcast"]
  },
  participants: [{
    type: Schema.ObjectId,
    ref: "Users"
  }],
  addedBy: {
    type: Schema.ObjectId,
    ref: "Users"
  },

}, { timestamps: true });

ConversationsSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    subject: this.subject,
    participants: this.participants,
    type: this.type,
    addedBy: this.addedBy,

    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

ConversationsSchema.plugin(mongoosePaginate);
mongoose.model("Conversations", ConversationsSchema);
