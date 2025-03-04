require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err));

// Define Schema & Model
const BalanceSchema = new mongoose.Schema({ amount: Number });
const Balance = mongoose.model('Balance', BalanceSchema);

// Razorpay Webhook Route
app.post('/razorpay-webhook', async (req, res) => {
    try {
        const { event } = req.body;

        if (event === 'payment.captured') {
            // Increase balance by ₹1
            let balanceDoc = await Balance.findOne();
            if (!balanceDoc) {
                balanceDoc = new Balance({ amount: 1 });
            } else {
                balanceDoc.amount += 1;
            }
            await balanceDoc.save();
            console.log('✅ Payment captured, balance updated:', balanceDoc.amount);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ Webhook Error:', error);
        res.status(500).json({ success: false });
    }
});

// API to Get Balance
app.get('/get-balance', async (req, res) => {
    try {
        const balanceDoc = await Balance.findOne();
        res.json({ balance: balanceDoc ? balanceDoc.amount : 0 });
    } catch (error) {
        console.error('❌ Error fetching balance:', error);
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

