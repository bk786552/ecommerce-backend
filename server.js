import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import cors from "cors";
 
const app = express();
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      "https://raj52-kuwait.quicklearners.online",
      "https://www.raj52-kuwait.quicklearners.online"
    ];

    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));
app.use(cors());
app.use(express.json());

// 🔐 NEVER expose these on frontend
const razorpay = new Razorpay({
  key_id: "rzp_live_SgpyFzRexYyhaH",        // rzp_live_...
  key_secret: "he7PLSDkciDwEKK8vgzoIMT7" // keep secret!
});

// 1) Create order
app.post("/api/create-order", async (req, res) => {
  try {
    const { amount } = req.body; // in rupees

    const options = {
      amount: amount * 100, // paisa
      currency: "INR",
      receipt: "rcpt_" + Date.now()
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

// 2) Verify payment signature
app.post("/api/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RZP_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // ✅ VERIFIED
      return res.json({ success: true });
    } else {
      // ❌ TAMPERED / INVALID
      return res.status(400).json({ success: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
console.log("KEY:", process.env.RZP_KEY_ID);