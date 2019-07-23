const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-aggregate-paginate-v2');

const { Schema } = mongoose;

const ContactSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    replied: {
      type: Boolean,
      default: false
    },
    replied_by: {
      type: Schema.ObjectId,
      ref: 'Users'
    },
    reply_message: {
      type: String
    }
  },
  { timestamps: true }
);

ContactSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    subject: this.subject,
    message: this.message,
    replied: this.replied,
    replied_by: this.replied_by,
    reply_message: this.reply_message,

    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

ContactSchema.plugin(mongoosePaginate);
mongoose.model('Contact', ContactSchema);
