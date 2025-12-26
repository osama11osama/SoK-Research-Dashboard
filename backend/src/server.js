require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const papersRoutes = require('./routes/papers');
const notesRoutes = require('./routes/notes');
const adminRoutes = require('./routes/admin');
const statsRoutes = require('./routes/stats');
const tagsRoutes = require('./routes/tags');
const threatModelsRoutes = require('./routes/threat-models');
const favoritesRoutes = require('./routes/favorites');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sok_research';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
// Mount notes routes before papers routes to avoid route conflicts
app.use('/api/papers/:paperId/notes', notesRoutes);
app.use('/api/papers', papersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/threat-models', threatModelsRoutes);
app.use('/api/favorites', favoritesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check if we should seed initial papers (only if database is empty)
    if (process.env.AUTO_SEED_PAPERS === 'true') {
      const Paper = require('./models/Paper');
      const paperCount = await Paper.countDocuments();
      if (paperCount === 0) {
        console.log('Database is empty. Auto-seeding initial papers...');
        try {
          const { seedPapers } = require('./scripts/seed-papers');
          await seedPapers();
        } catch (err) {
          console.error('Error auto-seeding papers:', err);
        }
      }
    }
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;

