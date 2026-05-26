import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    username: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        ret.productId = ret.productId?.toString?.() ?? ret.productId;
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

export const Comment = mongoose.models.Comment ?? mongoose.model('Comment', commentSchema);
