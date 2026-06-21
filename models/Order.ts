import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  customOfferDetails?: {
    title: string;
    description: string;
    deliveryTime: number;
  };
  amount: number;
  paymentMethod: 'COD' | 'Mock_EasyPaisa' | 'Mock_JazzCash' | 'Mock_Card';
  paymentStatus: 'Pending' | 'Paid_Escrow' | 'Released_To_Seller';
  deliveryStatus: 'Placed' | 'Packed' | 'Shipped' | 'Delivered';
  shippingAddress: string;
  recipientPhone: string;
  recipientName: string;
  notes: string;
  shipmentHistory?: {
    location: string;
    status: string;
    timestamp: Date;
  }[];
  createdAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  customOfferDetails: {
    title: { type: String },
    description: { type: String },
    deliveryTime: { type: Number },
  },
  amount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ['COD', 'Mock_EasyPaisa', 'Mock_JazzCash', 'Mock_Card'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid_Escrow', 'Released_To_Seller'],
    default: 'Pending',
  },
  deliveryStatus: {
    type: String,
    enum: ['Placed', 'Packed', 'Shipped', 'Delivered'],
    default: 'Placed',
  },
  shippingAddress: { type: String, default: '' },
  recipientPhone: { type: String, default: '' },
  recipientName: { type: String, default: '' },
  notes: { type: String, default: '' },
  shipmentHistory: [{
    location: { type: String, required: true },
    status: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
