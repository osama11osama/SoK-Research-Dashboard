require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sok_research';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function bootstrapAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if any users exist
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Users already exist. Use the registration endpoint to create the first user.');
      process.exit(0);
    }

    console.log('No users found. Creating first super admin account...\n');

    const username = await question('Username: ');
    const password = await question('Password: ');
    const displayName = await question('Display Name: ');

    if (!username || !password || !displayName) {
      console.error('All fields are required');
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('Password must be at least 8 characters');
      process.exit(1);
    }

    const passwordHash = await User.hashPassword(password);

    const admin = await User.create({
      username: username.toLowerCase(),
      passwordHash,
      displayName,
      role: 'SUPER_ADMIN',
      status: 'APPROVED',
      approvedAt: new Date()
    });

    console.log(`\nSuper admin account created successfully!`);
    console.log(`Username: ${admin.username}`);
    console.log(`Display Name: ${admin.displayName}`);
    console.log(`Role: ${admin.role}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

bootstrapAdmin().finally(() => {
  rl.close();
});

