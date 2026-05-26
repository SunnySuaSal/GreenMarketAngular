import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDb } from '../src/db/connect.js';
import { Product } from '../src/models/Product.js';
import { Comment } from '../src/models/Comment.js';
import { User } from '../src/models/User.js';
import { hashPassword } from '../src/utils/password.js';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/greenmarket';

const SEED_PRODUCTS = [
  {
    name: 'Tomates Organicos',
    price: 3.99,
    image:
      'https://images.unsplash.com/photo-1657288089316-c0350003ca49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwdmVnZXRhYmxlcyUyMGZyZXNoJTIwcHJvZHVjZXxlbnwxfHx8fDE3NTcyNjQwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Verduras',
    seller: 'Granja Verde',
    description: 'Tomates organicos frescos cultivados localmente',
    stock: 25,
    rating: 0,
    reviews: 0,
  },
  {
    name: 'Manzanas Locales',
    price: 2.5,
    image:
      'https://images.unsplash.com/photo-1606448423038-3de11e152e0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb2NhbCUyMGZhcm1lcnMlMjBtYXJrZXQlMjBmcnVpdHN8ZW58MXx8fHwxNzU3MzQ4NzM1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Frutas',
    seller: 'Huerto Familiar',
    description: 'Manzanas crujientes de productores locales',
    stock: 40,
    rating: 0,
    reviews: 0,
  },
  {
    name: 'Pan Artesanal',
    price: 4.25,
    image:
      'https://images.unsplash.com/photo-1697782590575-419b95a52325?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGZvb2QlMjBwcm9kdWN0c3xlbnwxfHx8fDE3NTczNDg3MzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Panaderia',
    seller: 'Panaderia Tradicional',
    description: 'Pan artesanal horneado diariamente',
    stock: 15,
    rating: 0,
    reviews: 0,
  },
  {
    name: 'Verduras Mixtas',
    price: 5.75,
    image:
      'https://images.unsplash.com/photo-1570913196376-dacb677ef459?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxlY28lMjBmcmllbmRseSUyMHNob3BwaW5nfGVufDF8fHx8MTc1NzM0ODczNXww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Verduras',
    seller: 'EcoVerde',
    description: 'Seleccion de verduras de temporada',
    stock: 18,
    rating: 0,
    reviews: 0,
  },
];

const SEED_USERS = [
  { username: 'admin', password: 'admin', role: 'admin' },
  { username: 'juan', password: '1234', role: 'user' },
  { username: 'maria', password: '1234', role: 'user' },
];

await connectDb(MONGODB_URI);
await Product.deleteMany({});
await User.deleteMany({});
await Comment.deleteMany({});

await Product.insertMany(SEED_PRODUCTS);
await User.insertMany(
  SEED_USERS.map((u) => ({
    username: u.username,
    passwordHash: hashPassword(u.password),
    role: u.role,
  })),
);

console.log(`Sembrados ${SEED_PRODUCTS.length} productos y ${SEED_USERS.length} usuarios en ${MONGODB_URI}`);
console.log('Usuarios demo: admin/admin, juan/1234, maria/1234');
await mongoose.disconnect();
