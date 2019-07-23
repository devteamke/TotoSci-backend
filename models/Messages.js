const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-aggregate-paginate-v2');

const { Schema } = mongoose;

const MessagesSchema = new Schema(
  {
    sender: {
      type: Schema.ObjectId,
      ref: 'Users'
    },
    content: {
      type: String
    },
    conversation: {
      type: Schema.ObjectId,
      ref: 'Conversations'
    },
    attachments: [
      {
        type: Object
      }
    ],
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

MessagesSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    sender: this.sender,
    content: this.content,
    conversation: this.conversation,
    read: this.read,
    attachments: this.attachments,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

MessagesSchema.plugin(mongoosePaginate);
mongoose.model('Messages', MessagesSchema);
