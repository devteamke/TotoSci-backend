const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");

const { Schema } = mongoose;

const CoursesSchema = new Schema(
  {
    name: {
      type: String
    },
    description: {
      type: String
    },
    charge: {
      type: Number //of objects
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "Users"
    }
  },
  { timestamps: true }
);

CoursesSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    name: this.name,
    description: this.description,
    fee: this.fee,

    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};
CoursesSchema.plugin(mongoosePaginate);
mongoose.model("Courses", CoursesSchema);
