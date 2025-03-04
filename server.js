require('dotenv').config();  // Load environment variables

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const RAZORPAY_SECRET = process.env.RAZORPAY_SECRET;

// Check if environment variables are loaded
if (!MONGO_URI) {
    console.error("❌ MONGO_URI is missing in .env file!");
    process.exit(1);
}

if (!RAZORPAY_SECRET) {
    console.error("❌ RAZORPAY_SECRET is missing in .env file!");
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });

// Create Schema and Model
const BalanceSchema = new mongoose.Schema({ balance: { type: Number, default: 0 } });
const Balance = mongoose.model('nanna', BalanceSchema);

// Webhook Route for Razorpay Payment Success
app.post('/razorpay-webhook', async (req, res) => {
    const secret = RAZORPAY_SECRET;

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

    const receivedSignature = req.headers['x-razorpay-signature'];

    if (expectedSignature === receivedSignature) {
        console.log("✅ Payment Verified!");

        // Update Balance (Increment)
        let balanceData = await Balance.findOne();
        if (!balanceData) {
            balanceData = new Balance({ balance: 1 });
        } else {
            balanceData.balance += 1;
        }
        await balanceData.save();

        return res.json({ success: true, message: "Balance updated!" });
    } else {
        console.log("❌ Signature Mismatch! Payment verification failed.");
        return res.status(400).json({ success: false, message: "Invalid signature" });
    }
});

// API to Get Updated Balance
app.get('/get-balance', async (req, res) => {
    const balanceData = await Balance.findOne();
    res.json({ balance: balanceData ? balanceData.balance : 0 });
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
