const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");

const { Schema } = mongoose;

const AttendanceSchema = new Schema(
  {
    lesson_time: {
      type: Object
    },
    learnt: { type: String },
    week: {
      type: String
    },
    remarks: {
      type: String
    },
    present: [
      {
        type: Schema.ObjectId,
        ref: "StudentsSchema"
      }
    ],
    _class: {
      type: Schema.ObjectId,
      ref: "ClassSchema"
    }
  },
  { timestamps: true }
);

AttendanceSchema.methods.toJSON = function() {
  return {
    _id: this._id,

    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

AttendanceSchema.plugin(mongoosePaginate);
mongoose.model("Attendance", AttendanceSchema);
