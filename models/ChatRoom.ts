import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomOffer {
  title: string;
  description: string;
  amount: number;
  deliveryTime: number; // in days
  status: 'pending' | 'approved' | 'declined' | 'completed';
}

export interface IMessage {
  senderId: mongoose.Types.ObjectId;
  text: string;
  audioUrl?: string;
  customOffer?: ICustomOffer;
  timestamp: Date;
}

export interface IChatRoom extends Document {
  roomId: string; // e.g. "buyerId_sellerId"
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  messages: IMessage[];
  isDisputed: boolean;
  createdAt: Date;
}

const CustomOfferSchema = new Schema<ICustomOffer>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  deliveryTime: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'declined', 'completed'], default: 'pending' },
});

const MessageSchema = new Schema<IMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '' },
  audioUrl: { type: String },
  customOffer: { type: CustomOfferSchema, default: null },
  timestamp: { type: Date, default: Date.now },
});

const ChatRoomSchema = new Schema<IChatRoom>({
  roomId: { type: String, required: true, unique: true, index: true },
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [MessageSchema],
  isDisputed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ChatRoom || mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);
