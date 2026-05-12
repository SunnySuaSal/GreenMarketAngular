import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, default: '' },
    category: { type: String, default: '' },
    seller: { type: String, default: '' },
    description: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    items: { type: [cartItemSchema], required: true, validate: (v) => Array.isArray(v) && v.length > 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'delivered'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
    toObject: { virtuals: true },
  },
);

export const Order = mongoose.models.Order ?? mongoose.model('Order', orderSchema);
