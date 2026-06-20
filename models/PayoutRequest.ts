import mongoose, { Schema, Document } from 'mongoose';

export interface IPayoutRequest extends Document {
  sellerId: mongoose.Types.ObjectId;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  paymentDetails: string; // e.g. EasyPaisa number, bank account details, etc.
  createdAt: Date;
  resolvedAt?: Date;
}

const PayoutRequestSchema = new Schema<IPayoutRequest>({
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  paymentDetails: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
});

export default mongoose.models.PayoutRequest || mongoose.model<IPayoutRequest>('PayoutRequest', PayoutRequestSchema);
