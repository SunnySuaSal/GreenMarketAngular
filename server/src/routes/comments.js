import { Router } from 'express';
import mongoose from 'mongoose';
import { Comment } from '../models/Comment.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';

export const commentsRouter = Router({ mergeParams: true });

function isValidObjectId(id) {
  return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}

function mapComment(c) {
  return {
    id: c._id.toString(),
    productId: c.productId.toString(),
    username: c.username,
    text: c.text,
    rating: c.rating,
    createdAt: c.createdAt,
  };
}

async function syncProductRating(productId) {
  const stats = await Comment.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const avg = stats[0]?.avgRating ?? 0;
  const count = stats[0]?.count ?? 0;

  await Product.findByIdAndUpdate(productId, {
    $set: {
      rating: count > 0 ? Math.round(avg * 10) / 10 : 0,
      reviews: count,
    },
  });
}

commentsRouter.get('/', async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!isValidObjectId(productId)) {
      res.status(400).json({ message: 'productId inválido' });
      return;
    }

    const list = await Comment.find({ productId }).sort({ createdAt: -1 }).lean();
    res.json(list.map(mapComment));
  } catch (err) {
    next(err);
  }
});

commentsRouter.post('/', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const rating = Number(req.body?.rating);

    if (!isValidObjectId(productId)) {
      res.status(400).json({ message: 'productId inválido' });
      return;
    }
    if (!username) {
      res.status(400).json({ message: 'username requerido' });
      return;
    }
    if (!text) {
      res.status(400).json({ message: 'El comentario no puede estar vacío' });
      return;
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ message: 'Valoración entre 1 y 5 requerida' });
      return;
    }

    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ message: 'Usuario no registrado' });
      return;
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }

    const doc = await Comment.create({
      productId,
      username: user.username,
      text,
      rating,
    });

    await syncProductRating(productId);

    const updated = await Product.findById(productId).lean();
    res.status(201).json({
      comment: mapComment(doc.toObject()),
      product: {
        id: updated._id.toString(),
        rating: updated.rating,
        reviews: updated.reviews,
      },
    });
  } catch (err) {
    next(err);
  }
});
