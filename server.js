require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Database Schema
const BalanceSchema = new mongoose.Schema({
    balance: { type: Number, default: 0 }
});
const Balance = mongoose.model('Balance', BalanceSchema);

// Get Current Balance
app.get('/get-balance', async (req, res) => {
    try {
        let balanceData = await Balance.findOne();
        if (!balanceData) {
            balanceData = await Balance.create({ balance: 0 });
        }
        res.json({ balance: balanceData.balance });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Razorpay Webhook (Detect Payment Success)
app.post('/razorpay-webhook', async (req, res) => {
    try {
        const { event } = req.body;
        if (event === "payment.captured") {
            let balanceData = await Balance.findOne();
            if (!balanceData) {
                balanceData = await Balance.create({ balance: 0 });
            }
            balanceData.balance += 1;  // Increase balance
            await balanceData.save();
        }
        res.status(200).json({ status: "Webhook received" });
    } catch (error) {
        res.status(500).json({ error: "Webhook processing failed" });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
