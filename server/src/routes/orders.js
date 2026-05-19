import { Router } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';

export const ordersRouter = Router();

function isValidObjectId(id) {
  return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}

function mapOrder(o) {
  return {
    id: o._id.toString(),
    date: o.date,
    customerUsername: o.customerUsername,
    items: o.items.map((item) => ({
      ...item,
      id: item.productId,
    })),
    total: o.total,
    status: o.status,
  };
}

ordersRouter.get('/', async (req, res, next) => {
  try {
    const customer =
      typeof req.query.customer === 'string' ? req.query.customer.trim() : '';
    const filter = customer ? { customerUsername: customer } : {};
    const list = await Order.find(filter).sort({ createdAt: -1 }).lean();
    res.json(list.map(mapOrder));
  } catch (err) {
    next(err);
  }
});

ordersRouter.post('/', async (req, res, next) => {
  try {
    const itemsInput = req.body?.items;
    const customerUsername =
      typeof req.body?.customerUsername === 'string' ? req.body.customerUsername.trim() : '';

    if (!customerUsername) {
      res.status(400).json({ message: 'customerUsername requerido' });
      return;
    }
    if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
      res.status(400).json({ message: 'items no puede estar vacío' });
      return;
    }

    const lineItems = [];
    let total = 0;

    for (const row of itemsInput) {
      const qty = Number(row.quantity);
      if (!Number.isFinite(qty) || qty < 1) {
        res.status(400).json({ message: 'Cantidad inválida' });
        return;
      }
      if (!row.productId || !isValidObjectId(row.productId)) {
        res.status(400).json({ message: 'productId inválido' });
        return;
      }

      const product = await Product.findById(row.productId);
      if (!product) {
        res.status(404).json({ message: `Producto no encontrado: ${row.productId}` });
        return;
      }
      if (product.stock < qty) {
        res.status(400).json({ message: `Stock insuficiente para ${product.name}` });
        return;
      }

      product.stock -= qty;
      await product.save();

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

    const created = await Order.create({
      date: new Date().toLocaleDateString('es-ES'),
      customerUsername,
      items: lineItems,
      total,
      status: 'pending',
    });

    res.status(201).json(mapOrder(created.toObject()));
  } catch (err) {
    next(err);
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
    res.json(mapOrder(doc.toObject()));
  } catch (err) {
    next(err);
  }
});
