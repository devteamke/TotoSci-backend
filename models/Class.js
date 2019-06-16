const mongoose = require("mongoose");

const { Schema } = mongoose;

const ClassSchema = new Schema(
  {
    name: {
      type: String
    },

    course: {
      type: Schema.ObjectId,
      ref: "CoursesSchema"
    },

    students: [
      {
        type: Schema.ObjectId,
        ref: "StudentsSchema"
      }
    ],
    trainer: {
      type: Schema.ObjectId,
      ref: "UsersSchema"
    },

    instructors: [
      {
        type: Schema.ObjectId,
        ref: "UsersSchema"
      }
    ]
  },
  { timestamps: true }
);

ClassSchema.methods.toJSON = function() {
  return {
    _id: this._id,

    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

mongoose.model("Class", ClassSchema);
