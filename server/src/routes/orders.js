import { Router } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';

export const ordersRouter = Router();

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

ordersRouter.get('/', async (_req, res, next) => {
  try {
    const list = await Order.find().sort({ createdAt: -1 }).lean();
    const mapped = list.map((o) => ({
      id: o._id.toString(),
      date: o.date,
      items: o.items.map((item) => ({
        ...item,
        id: item.productId,
      })),
      total: o.total,
      status: o.status,
    }));
    res.json(mapped);
  } catch (err) {
    next(err);
  }
});

ordersRouter.post('/', async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const itemsInput = req.body?.items;
    if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
      await session.abortTransaction();
      res.status(400).json({ message: 'items no puede estar vacío' });
      return;
    }

    const lineItems = [];
    let total = 0;

    for (const row of itemsInput) {
      const qty = Number(row.quantity);
      if (!Number.isFinite(qty) || qty < 1) {
        await session.abortTransaction();
        res.status(400).json({ message: 'Cantidad inválida' });
        return;
      }
      if (!row.productId || !isValidObjectId(row.productId)) {
        await session.abortTransaction();
        res.status(400).json({ message: 'productId inválido' });
        return;
      }

      const product = await Product.findById(row.productId).session(session);
      if (!product) {
        await session.abortTransaction();
        res.status(404).json({ message: `Producto no encontrado: ${row.productId}` });
        return;
      }
      if (product.stock < qty) {
        await session.abortTransaction();
        res.status(400).json({ message: `Stock insuficiente para ${product.name}` });
        return;
      }

      product.stock -= qty;
      await product.save({ session });

      const lineTotal = product.price * qty;
      total += lineTotal;

      lineItems.push({
        productId: product._id.toString(),
        quantity: qty,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        seller: product.seller,
        description: product.description,
        stock: product.stock,
        rating: product.rating,
        reviews: product.reviews,
      });
    }

    const order = await Order.create(
      [
        {
          date: new Date().toLocaleDateString('es-ES'),
          items: lineItems,
          total,
          status: 'pending',
        },
      ],
      { session },
    );

    await session.commitTransaction();

    const created = order[0];
    res.status(201).json({
      id: created._id.toString(),
      date: created.date,
      items: created.items.map((item) => ({
        ...item.toObject?.() ?? item,
        id: item.productId,
      })),
      total: created.total,
      status: created.status,
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
});

ordersRouter.patch('/:id/status', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Id inválido' });
      return;
    }
    const status = req.body?.status;
    if (!['pending', 'confirmed', 'delivered'].includes(status)) {
      res.status(400).json({ message: 'Estado inválido' });
      return;
    }
    const doc = await Order.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true, runValidators: true });
    if (!doc) {
      res.status(404).json({ message: 'Pedido no encontrado' });
      return;
    }
    res.json({
      id: doc._id.toString(),
      date: doc.date,
      items: doc.items.map((item) => ({
        ...item.toObject?.() ?? item,
        id: item.productId,
      })),
      total: doc.total,
      status: doc.status,
    });
  } catch (err) {
    next(err);
  }
});
