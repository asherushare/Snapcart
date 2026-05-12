import mongoose from "mongoose";

export type RepeatFrequency = "weekly" | "monthly";
export type RepeatStatus = "active" | "paused";

export interface IRepeatOrder {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  grocery: mongoose.Types.ObjectId;
  quantity: number;
  frequency: RepeatFrequency;
  status: RepeatStatus;
  nextRunAt: Date;
  lastRunAt?: Date;
  lastReminderSentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const repeatOrderSchema = new mongoose.Schema<IRepeatOrder>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    grocery: { type: mongoose.Schema.Types.ObjectId, ref: "Grocery", required: true },
    quantity: { type: Number, required: true, min: 1, max: 50 },
    frequency: { type: String, enum: ["weekly", "monthly"], required: true },
    status: { type: String, enum: ["active", "paused"], default: "active" },
    nextRunAt: { type: Date, required: true, index: true },
    lastRunAt: { type: Date },
    lastReminderSentAt: { type: Date },
  },
  { timestamps: true },
);

repeatOrderSchema.index({ user: 1, grocery: 1 }, { unique: true });

if (process.env.NODE_ENV !== "production" && mongoose.models.RepeatOrder) {
  mongoose.deleteModel("RepeatOrder");
}

const RepeatOrder =
  mongoose.models.RepeatOrder ||
  mongoose.model<IRepeatOrder>("RepeatOrder", repeatOrderSchema);

export default RepeatOrder;

