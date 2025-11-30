const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Supabase Client (Initialized in a separate file, but checking env here)
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.warn("⚠️  WARNING: SUPABASE_URL or SUPABASE_KEY is missing in .env");
}

// Routes Placeholders
app.get('/', (req, res) => {
    res.json({ message: "Wenze API (MVP V1) is running 🚀" });
});

// Import Routes (Will be created next)
// const productRoutes = require('./routes/products');
// app.use('/api/products', productRoutes);

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});


