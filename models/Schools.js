const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");

const { Schema } = mongoose;

const SchoolsSchema = new Schema(
  {
    name: {
      type: String
    },
    county: {
      type: String
    },
    sub_county: {
      type: String
    },
    school_type: {
      type: String,
      enum: ["supervised", "unsupervised", "school-based"]
    },
    school_code: {
      type: String
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "Users"
    }
  },
  { timestamps: true }
);

SchoolsSchema.methods.toJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    county: this.county,
    sub_county: this.sub_county,
    addedBy: this.addedBy,

    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

SchoolsSchema.plugin(mongoosePaginate);
mongoose.model("Schools", SchoolsSchema);
