import { Router } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';

export const productsRouter = Router();

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

productsRouter.get('/', async (_req, res, next) => {
  try {
    const list = await Product.find().sort({ name: 1 }).lean();
    const mapped = list.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      price: p.price,
      image: p.image,
      category: p.category,
      seller: p.seller,
      description: p.description,
      stock: p.stock,
      rating: p.rating,
      reviews: p.reviews,
    }));
    res.json(mapped);
  } catch (err) {
    next(err);
  }
});

productsRouter.get('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Id inválido' });
      return;
    }
    const p = await Product.findById(req.params.id).lean();
    if (!p) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }
    res.json({
      id: p._id.toString(),
      name: p.name,
      price: p.price,
      image: p.image,
      category: p.category,
      seller: p.seller,
      description: p.description,
      stock: p.stock,
      rating: p.rating,
      reviews: p.reviews,
    });
  } catch (err) {
    next(err);
  }
});

productsRouter.post('/', async (req, res, next) => {
  try {
    const body = req.body ?? {};
    const doc = await Product.create({
      name: body.name,
      price: body.price,
      image: body.image ?? '',
      category: body.category,
      seller: body.seller,
      description: body.description ?? '',
      stock: body.stock ?? 0,
      rating: body.rating ?? 0,
      reviews: body.reviews ?? 0,
    });
    res.status(201).json(doc.toJSON());
  } catch (err) {
    next(err);
  }
});

/** Ajuste atómico de stock (delta puede ser negativo). */
productsRouter.patch('/:id/stock', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Id inválido' });
      return;
    }
    const delta = Number(req.body?.delta);
    if (!Number.isFinite(delta)) {
      res.status(400).json({ message: 'delta numérico requerido' });
      return;
    }
    const doc = await Product.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }
    const nextStock = Math.max(0, doc.stock + delta);
    doc.stock = nextStock;
    await doc.save();
    res.json(doc.toJSON());
  } catch (err) {
    next(err);
  }
});

productsRouter.patch('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Id inválido' });
      return;
    }
    const allowed = ['name', 'price', 'image', 'category', 'seller', 'description', 'stock', 'rating', 'reviews'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const doc = await Product.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!doc) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }
    res.json(doc.toJSON());
  } catch (err) {
    next(err);
  }
});

productsRouter.delete('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Id inválido' });
      return;
    }
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
