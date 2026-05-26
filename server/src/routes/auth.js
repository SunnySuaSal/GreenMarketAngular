import { Router } from 'express';
import { User } from '../models/User.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res, next) => {
  try {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!username || !password) {
      res.status(400).json({ message: 'Usuario y contraseña requeridos' });
      return;
    }

    const user = await User.findOne({ username }).select('+passwordHash');
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
      return;
    }

    res.json({
      id: user._id.toString(),
      username: user.username,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/register', async (req, res, next) => {
  try {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!username || username.length < 2) {
      res.status(400).json({ message: 'Usuario inválido (mínimo 2 caracteres)' });
      return;
    }
    if (!password || password.length < 4) {
      res.status(400).json({ message: 'Contraseña inválida (mínimo 4 caracteres)' });
      return;
    }

    const exists = await User.findOne({ username });
    if (exists) {
      res.status(409).json({ message: 'Ese usuario ya existe' });
      return;
    }

    const user = await User.create({
      username,
      passwordHash: hashPassword(password),
      role: 'user',
    });

    res.status(201).json({
      id: user._id.toString(),
      username: user.username,
      role: user.role,
    });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409).json({ message: 'Ese usuario ya existe' });
      return;
    }
    next(err);
  }
});
