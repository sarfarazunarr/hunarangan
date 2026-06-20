import mongoose, { Schema, Document } from 'mongoose';

export interface IInvestmentRequest extends Document {
  sellerId: mongoose.Types.ObjectId;
  name: string;
  cnic: string;
  phone: string;
  businessName: string;
  businessDetails: string;
  amountRequested: number;
  purpose: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: Date;
  resolvedAt?: Date;
}

const InvestmentRequestSchema = new Schema<IInvestmentRequest>({
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  cnic: { type: String, required: true },
  phone: { type: String, required: true },
  businessName: { type: String, required: true },
  businessDetails: { type: String, required: true },
  amountRequested: { type: Number, required: true },
  purpose: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
});

export default mongoose.models.InvestmentRequest || mongoose.model<IInvestmentRequest>('InvestmentRequest', InvestmentRequestSchema);
