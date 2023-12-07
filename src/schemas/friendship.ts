import { Schema, model } from "mongoose";

const friendshipSchema = new Schema({
  user1: { type: Schema.Types.ObjectId, ref: "User", required: true },
  user2: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted"], default: "pending" },
});

const friendshipModel = model("friendship", friendshipSchema);

export default friendshipModel;
