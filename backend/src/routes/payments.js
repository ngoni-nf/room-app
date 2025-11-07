// payments.js - Stripe payment processing endpoints

import express from 'express';
import verifyFirebaseToken from '../middleware/verifyFirebaseToken.js';
import Stripe from 'stripe';
import { firestore } from '../firebaseAdmin.js';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

const router = express.Router();

/**
 * POST /api/payments/create-intent
 * Headers: Authorization: Bearer <idToken>
 * Body: { bookingId }
 *
 * Creates a Stripe PaymentIntent for a booking
 * Returns client_secret for client-side payment confirmation
 */
router.post('/create-intent', verifyFirebaseToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }
    
    // Get booking from Firestore
    const bookingDoc = await firestore.collection('bookings').doc(bookingId).get();
    
    if (!bookingDoc.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = bookingDoc.data();
    
    // Verify user owns the booking
    if (req.user.uid !== booking.clientUid) {
      return res.status(403).json({ error: 'Not authorized to pay for this booking' });
    }
    
    const amount = Math.round((booking.price || 0) * 100); // Convert to cents
    
    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd', // TODO: make configurable per region
      metadata: {
        bookingId,
        clientUid: req.user.uid,
        serviceName: booking.serviceName,
      },
    });
    
    // Save payment intent ID to booking for later reference
    await firestore.collection('bookings').doc(bookingId).update({
      paymentIntentId: paymentIntent.id,
      paymentStatus: 'requires_payment',
      updatedAt: new Date(),
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('create-intent error', err);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

/**
 * POST /api/payments/webhook
 * Stripe webhook endpoint for handling payment events
 *
 * Important: This endpoint must receive raw body (not JSON parsed)
 * GitHub will invoke this with raw body from Stripe
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return res.status(400).send('Webhook secret not configured');
    }
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle different Stripe events
    try {
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.bookingId;
        
        console.log(`Payment succeeded for booking: ${bookingId}`);
        
        // Update booking as paid
        await firestore.collection('bookings').doc(bookingId).update({
          paymentStatus: 'paid',
          paymentIntentId: paymentIntent.id,
          updatedAt: new Date(),
        });
      } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.bookingId;
        
        console.log(`Payment failed for booking: ${bookingId}`);
        
        // Update booking as failed
        await firestore.collection('bookings').doc(bookingId).update({
          paymentStatus: 'failed',
          paymentFailureReason: paymentIntent.last_payment_error?.message || 'Unknown',
          updatedAt: new Date(),
        });
      } else if (event.type === 'charge.refunded') {
        const charge = event.data.object;
        const bookingId = charge.metadata.bookingId;
        
        console.log(`Charge refunded for booking: ${bookingId}`);
        
        // Update booking as refunded
        await firestore.collection('bookings').doc(bookingId).update({
          paymentStatus: 'refunded',
          refundedAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (err) {
      console.error('Error processing webhook event:', err);
      // Still return 200 to prevent Stripe from retrying
    }
    
    res.json({ received: true });
  }
);

/**
 * GET /api/payments/status/:bookingId
 * Headers: Authorization: Bearer <idToken>
 *
 * Get payment status for a booking
 */
router.get('/status/:bookingId', verifyFirebaseToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const bookingDoc = await firestore.collection('bookings').doc(bookingId).get();
    
    if (!bookingDoc.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = bookingDoc.data();
    
    // Verify user owns the booking
    if (req.user.uid !== booking.clientUid && req.user.uid !== booking.stylistUid) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    res.json({
      paymentStatus: booking.paymentStatus || 'pending',
      price: booking.price,
      paymentIntentId: booking.paymentIntentId || null,
    });
  } catch (err) {
    console.error('get payment status error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
