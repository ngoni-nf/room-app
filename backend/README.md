# Room App Backend

## Features

- Firebase Firestore integration
- REST API (Auth, Booking, Stylist, Payments)
- Firebase Auth for email/phone sign-in
- Stripe payment processing
- FCM push notifications
- Production-ready error handling

## Setup Instructions

### 1. Prerequisites

- Node.js 16+
- npm or yarn
- Firebase project created
- Stripe account

### 2. Installation

```bash
npm install
```

### 3. Environment Configuration

```bash
cp .env.example .env
```

Update `.env` with your credentials:
- Firebase Service Account JSON
- Stripe Secret Key
- Port (default 5000)

### 4. Firebase Setup

1. Go to Firebase Console → Project Settings
2. Download Service Account JSON
3. Place in `config/firebaseServiceAccount.json`
4. Add to `.gitignore` - NEVER commit!

### 5. Run Server

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user profile
- `GET /api/auth/me` - Get current user profile

### Bookings
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id/status` - Update booking status
- `GET /api/bookings/user/:uid` - Get user bookings

### Payments
- `POST /api/payments/create-intent` - Create Stripe PaymentIntent
- `POST /api/payments/webhook` - Stripe webhook

## Code Quality & Improvements

### Security Features Implemented

1. **Firebase Token Verification** - All protected routes verify ID tokens
2. **Input Validation** - Request body validation on all endpoints
3. **Error Handling** - Try-catch blocks with descriptive error messages
4. **CORS Configuration** - Restricted to allowed origins
5. **Environment Variables** - Sensitive data never hardcoded

### Recommendations for Production

1. **Add Request Validation**
   ```bash
   npm install joi
   ```
   Validate all inputs using joi schemas

2. **Implement Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

3. **Add Request Logging**
   ```bash
   npm install winston morgan
   ```

4. **Database Indexing**
   - Add indexes on: users, bookings, createdAt fields
   - Use Firestore composite indexes for complex queries

5. **Role-Based Access Control (RBAC)**
   - Add server-side role validation
   - Check `users/{uid}.role` in middleware

6. **Unit Testing**
   ```bash
   npm install --save-dev jest supertest
   ```
   Write tests for critical functions

7. **API Documentation**
   - Use Swagger/OpenAPI
   - Document request/response schemas

8. **Monitoring & Alerting**
   - Integrate with Cloud Logging
   - Set up error rate alerts

## Errors & Fixes

### Known Issues & Solutions

1. **Firebase Initialization Error**
   - Ensure service account JSON path is correct
   - Check FIREBASE_PROJECT_ID matches JSON file

2. **Stripe Webhook Signature Error**
   - Use raw body for webhook route (implemented)
   - Verify webhook secret in .env

3. **CORS Errors**
   - Add Flutter/React URLs to CORS whitelist
   - Update in production with actual domains

## Testing

### Local Testing with curl

```bash
# Health check
curl http://localhost:5000/health

# Create PaymentIntent (requires ID token)
curl -X POST http://localhost:5000/api/payments/create-intent \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "booking123"}'
```

### Stripe Webhook Testing

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

## Deployment

### Deploy to Cloud Run

```bash
gcloud run deploy room-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Environment Variables in Cloud Run
- Set via Console or gcloud CLI
- Use Secret Manager for sensitive data

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Verify ID token is valid and not expired |
| 403 Forbidden | Check user role and permissions |
| 500 Server Error | Check Firebase credentials and network |
| Webhook not firing | Verify webhook secret in .env |

## Support

For issues, check:
1. Firebase Console logs
2. Server console output
3. Stripe Dashboard for payment errors
4. Browser DevTools Network tab for API calls
