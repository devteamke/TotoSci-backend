const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");

const { Schema } = mongoose;

const FeedbackSchema = new Schema(
  {
    _class: {
      type: Schema.ObjectId,
      ref: "ClassSchema"
    },
    student: {
      type: Schema.ObjectId,
      ref: "StudentsSchema"
    },
    lesson: {
      type: String
    },
    remarks: {
      type: String
    },
    addedBy: {
      type: Schema.ObjectId,
      ref: "Users"
    }
  },
  { timestamps: true }
);

FeedbackSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    _class: this._class,
    student: this.student,
    lesson: this.lesson,
    remarks: this.remarks,
    addedBy: this.addedBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

FeedbackSchema.plugin(mongoosePaginate);
mongoose.model("Feedback", FeedbackSchema);
