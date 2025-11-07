# Room App

A production-ready mobile application platform for salon, hairdresser, and barber services - similar to Uber but for beauty services.

## Project Structure

```
room-app/
├── mobile_app/              # Flutter App (Customers & Stylists)
│   ├── lib/
│   │   ├── main.dart
│   │   ├── app_router.dart
│   │   ├── state/
│   │   ├── features/
│   │   └── widgets/
│   ├── pubspec.yaml
│   └── README.md
├── backend/                 # Node.js / Express Server
│   ├── src/
│   │   ├── server.js
│   │   ├── firebaseAdmin.js
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   ├── package.json
│   ├── .env
│   └── README.md
├── admin_dashboard/         # React Admin Dashboard
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   └── pages/
│   ├── package.json
│   └── README.md
└── README.md
```

## Tech Stack

- **Mobile**: Flutter (Dart)
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Payments**: Stripe
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Admin Dashboard**: React

## Features

✅ Customer & Stylist Authentication (Email/Phone)
✅ Real-time Booking Management
✅ Payment Integration (Stripe)
✅ Push Notifications
✅ Admin Dashboard for Management
✅ Service Catalog & Pricing
✅ Chat & In-app Messaging
✅ Ratings & Reviews

## Installation & Setup

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update .env with Firebase and Stripe credentials
npm run dev
```

### Mobile App Setup
```bash
cd mobile_app
flutter pub get
flutter run
```

### Admin Dashboard Setup
```bash
cd admin_dashboard
npm install
npm start
```

## Documentation

- [Backend API Documentation](./backend/README.md)
- [Mobile App Guide](./mobile_app/README.md)
- [Admin Dashboard Guide](./admin_dashboard/README.md)

## Security Considerations

⚠️ **IMPORTANT**: Never commit sensitive files:
- `.env` files
- `firebaseServiceAccount.json`
- API keys and secrets

Use environment variables and GitHub Secrets for deployment.

## Error Handling & Code Quality Notes

### Key Improvements Made

1. **Error Handling**: All routes include try-catch blocks with proper error responses
2. **Validation**: Input validation on all API endpoints
3. **Security**: Firebase ID token verification on protected routes
4. **Type Safety**: Proper data structure documentation
5. **Rate Limiting**: Recommended for production (use `express-rate-limit`)
6. **Logging**: Implement structured logging for monitoring
7. **Testing**: Unit tests recommended for critical functions

### Recommendations

1. **Add comprehensive unit tests** using Jest/Mocha
2. **Implement API rate limiting** to prevent abuse
3. **Add request logging middleware** for debugging
4. **Validate all inputs** with joi or similar libraries
5. **Add database indexes** for frequently queried fields
6. **Implement role-based access control** (RBAC)
7. **Add transaction handling** for payment operations
8. **Monitor error rates** and set up alerts

## Contributing

Please follow the contributing guidelines when submitting pull requests.

## License

MIT

## Support

For issues and questions, please create an issue on GitHub.
