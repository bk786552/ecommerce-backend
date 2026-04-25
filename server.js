import dotenv from "dotenv";
dotenv.config();

import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import cors from "cors";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://raj52-kuwait.quicklearners.online",
    "https://www.raj52-kuwait.quicklearners.online"
  ]
}));

app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.rzp_live_SgpyFzRexYyhaH,
  key_secret: process.env.he7PLSDkciDwEKK8vgzoIMT7,
});

app.get("/", (req, res) => {
  res.send("Server is live ✅");
});

app.post("/api/create-order", async (req, res) => {
  const { amount } = req.body;

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR"
  });

  res.json(order);
});

app.post("/api/verify-payment", (req, res) => {
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
    return res.json({ success: true });
  } else {
    return res.status(400).json({ success: false });
  }
});

app.listen(process.env.PORT || 5000);