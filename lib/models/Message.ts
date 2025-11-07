import mongoose, { Schema, Document, Types } from "mongoose";
import dbConnect from "../db";

dbConnect();

export interface IMessage extends Document {
  sender: Types.ObjectId;
  content: string;
  room?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    room: {
      type: String,
      default: "general",
    },
  },
  {
    timestamps: true,
  }
);

const Message =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
