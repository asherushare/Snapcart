import mongoose from "mongoose";

export interface IMood {
  _id?: mongoose.Types.ObjectId;
  slug: string;
  name: string;
  subtitle?: string;
  description?: string;
  image?: string;
  categoryNames: string[];
  keywords: string[];
  manualGroceryIds: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const moodSchema = new mongoose.Schema<IMood>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    subtitle: { type: String },
    description: { type: String },
    image: { type: String },
    categoryNames: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
    manualGroceryIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Grocery",
      default: [],
    },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production" && mongoose.models.Mood) {
  mongoose.deleteModel("Mood");
}

const Mood = mongoose.models.Mood || mongoose.model<IMood>("Mood", moodSchema);

export default Mood;

