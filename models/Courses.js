const mongoose = require("mongoose");

const { Schema } = mongoose;

const CourseSchema = new Schema(
  {
    title: {
      type: String
    },
    description: {
      type: Array
    },
    fee: {
      type: Number //of objects
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "Users"
    }
  },
  { timestamps: true }
);

CourseSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    title: this.title,
    description: this.description,
    fee: this.fee,

    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

mongoose.model("Course", CourseSchema);
