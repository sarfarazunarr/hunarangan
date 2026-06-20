import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  phone: string;
  role: 'buyer' | 'seller' | 'admin';
  name: string;
  bio: {
    en: string;
    ur: string;
    sd: string;
  };
  location: string; // e.g. "Karachi", "Lahore", "Hyderabad", "Peshawar", "Quetta"
  profileImage: string;
  email: string;
  cnic: string;
  address: string;
  gender?: 'male' | 'female' | 'other' | '';
  pin?: string;
  failedLoginAttempts: number;
  tempOtp?: string;
  tempOtpExpiry?: Date;
  tempOtpSmsId?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  phone: { type: String, required: true, unique: true, index: true },
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  name: { type: String, required: true },
  bio: {
    en: { type: String, default: '' },
    ur: { type: String, default: '' },
    sd: { type: String, default: '' },
  },
  location: { type: String, required: true, default: 'Karachi' },
  profileImage: { type: String, default: '' },
  email: { type: String, default: '' },
  cnic: { type: String, default: '' },
  address: { type: String, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
  pin: { type: String, default: '' },
  failedLoginAttempts: { type: Number, default: 0 },
  tempOtp: { type: String },
  tempOtpExpiry: { type: Date },
  tempOtpSmsId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
