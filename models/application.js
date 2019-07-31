const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");

const { Schema } = mongoose;

const ApplicationsSchema = new Schema(
  {


    parent: {
      email: {
        type: String
      },
      fname: {
        type: String
      },

      lname: {
        type: String
      },
      role: {
        type: String,

      },
      gender: {
        type: String,
        enum: ["male", "female"]
      },
      phone_number: {
        main: {
          type: String
        },
        alt: {
          type: String
        }
      },
    },

    student: {
      fname: {
        type: String
      },

      lname: {
        type: String
      },
      DOB: {
        type: Date
      },
      school: {
        type: Schema.ObjectId,
        ref: "Schools"
      },
      isSponsored: {
        type: Boolean,
        default: false
      }
    },

    response: {
      type: Object,
      default: null

    },




    addedBy: {
      type: Schema.ObjectId,
      ref: "Users"
    },

    //Required for chief trainer

  },
  { timestamps: true }
);

ApplicationsSchema.methods.toJSON = function () {
  return {
    _id: this._id,
    student: this.student,
    parent: this.parent,
    response: this.response,
    addedBy: this.addedBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

ApplicationsSchema.index(
  {
    _id: "text",
    fname: "text",
    sname: "text",
    lname: "text",
    email: "text",
    role: "text",
    status: "text",
    county: "text",
    subcounty: "text",
    residence: "text"
  },
  {
    weights: {
      email: 5,
      fname: 4,
      sname: 4,
      idnumber: 5,
      oname: 4,
      county: 4,
      subcounty: 4,
      role: 3,
      status: 2,
      _id: 1
    }
  }
);

ApplicationsSchema.plugin(mongoosePaginate);
mongoose.model("Applications", ApplicationsSchema);
