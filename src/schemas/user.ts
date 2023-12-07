import { Schema, model } from "mongoose";
import { IUser } from "../types";

interface IUserSchema extends IUser {
  password: String;
  email: String;
}

const userSchema = new Schema<IUserSchema>({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
});

const userModel = model("user", userSchema);

export default userModel;
