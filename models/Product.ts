import mongoose, { Schema, Document } from 'mongoose';

export interface IReview {
  buyerId: mongoose.Types.ObjectId;
  buyerName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface IFaq {
  question: { en: string; ur: string; sd: string };
  answer: { en: string; ur: string; sd: string };
}

export interface IProduct extends Document {
  sellerId: mongoose.Types.ObjectId;
  title: {
    en: string;
    ur: string;
    sd: string;
  };
  description: {
    en: string;
    ur: string;
    sd: string;
  };
  shortDescription?: {
    en: string;
    ur: string;
    sd: string;
  };
  price: number;
  images: string[];
  category: string; // e.g. "Rilli", "Ajrak", "Biryani", "Embroidery", "Organic Food"
  isCustomService: boolean;
  reviews: IReview[];
  faqs: IFaq[];
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: {
    en: { type: String, required: true },
    ur: { type: String, default: '' },
    sd: { type: String, default: '' },
  },
  description: {
    en: { type: String, required: true },
    ur: { type: String, default: '' },
    sd: { type: String, default: '' },
  },
  shortDescription: {
    en: { type: String, default: '' },
    ur: { type: String, default: '' },
    sd: { type: String, default: '' },
  },
  price: { type: Number, required: true },
  images: [{ type: String }],
  category: { type: String, required: true, index: true },
  isCustomService: { type: Boolean, default: false },
  reviews: [{
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    buyerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  faqs: [{
    question: {
      en: { type: String, default: '' },
      ur: { type: String, default: '' },
      sd: { type: String, default: '' },
    },
    answer: {
      en: { type: String, default: '' },
      ur: { type: String, default: '' },
      sd: { type: String, default: '' },
    }
  }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
