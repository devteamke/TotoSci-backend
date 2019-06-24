const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");

const { Schema } = mongoose;

const StudentsSchema = new Schema({
  fname: {
    type: String
  },
  lname: {
    type: String
  },
  school: { type: Schema.Types.ObjectId, ref: "Schools" },
  parent: {
    type: Schema.Types.ObjectId,
    ref: "Users"
  },
  gender: {
    type: String,
    enum: ["male", "female", ],
  },
  DOB: {
    type: Date
  },
  isSponsored: Boolean,
  status: {
    type: String,
    enum: ["active", "suspended", "expelled"],
    default: "active",
    required: true
  },
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: "Users"
  }
}, { timestamps: true });

StudentsSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    fname: this.fname,
    lname: this.lname,
    gender: this.gender,
    DOB: this.DOB,
    status: this.status,
    isSponsored: this.isSponsored,
    parent: this.parent,
    school: this.school,

    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

StudentsSchema.plugin(mongoosePaginate);
mongoose.model("Students", StudentsSchema);
