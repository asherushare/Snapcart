import mongoose from "mongoose";

export interface IUser {
  _id?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  mobile: string;
  role: "user" | "deliveryBoy" | "admin";
  image?: string;
  address?: {
    line1?: string;
    line2?: string;
    landmark?: string;
    city?: string;
    pincode?: string;
  };
  vehicleType?: string;
  location?: {
    type: {
      type: StringConstructor;
      enum: ["Point"];
      default: "Point";
    };
    coordinates: {
      type: [NumberConstructor];
      default: [];
    };
  },
  socketId: string | null
  isOnline: boolean
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: false,
    },
    mobile: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["user", "deliveryBoy", "admin"],
      default: "user",
    },
    image: {
      type: String,
    },
    address: {
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
      landmark: { type: String, default: "" },
      city: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
    vehicleType: {
      type: String,
      default: "",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    socketId: {
      type: String,
      default: null,
    },
    isOnline: {
      type: Boolean,
      default: false
    },
  },

  { timestamps: true },
);

userSchema.index({location: "2dsphere"})

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;

