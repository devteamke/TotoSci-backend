const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");

const { Schema } = mongoose;

const ClassSchema = new Schema(
  {
    name: {
      type: String
    },
    duration: {
      type: Number
    },
    course: {
      type: Schema.ObjectId,
      ref: "CoursesSchema"
    },
    day: {
      type: String
    },
    start_time: {
      type: Object
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

ClassSchema.plugin(mongoosePaginate);
mongoose.model("Class", ClassSchema);
