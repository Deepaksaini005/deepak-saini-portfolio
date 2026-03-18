# 🚀 Portfolio Backend Setup Guide

Your portfolio is now fully connected! Here's how to run it.

## 📋 Prerequisites

- **Node.js 18+** — Download from [nodejs.org](https://nodejs.org)
- **MongoDB** — Either:
  - Local: [Install MongoDB Community](https://www.mongodb.com/try/download/community)
  - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)

## ⚙️ Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Create `.env` File
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Then edit `.env` with:
- `MONGO_URI` — Your MongoDB connection string
- `EMAIL_USER` & `EMAIL_PASS` — Gmail credentials for contact form emails
- `EMAIL_TO` — Your email address to receive messages

### 3. Start the Server
```bash
# Development (with auto-reload)
npm run dev

# OR production
npm start
```

### 4. Access Your Portfolio
Open your browser and go to:
```
http://localhost:5000
```

## 🔌 What's Connected

### Frontend → Backend
✅ **Contact Form** — Saves messages to MongoDB, sends email notifications
✅ **Analytics Tracking** — Logs page views and project clicks
✅ **Health Check** — `GET /api/health` verifies backend status

### API Endpoints
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/health` | Server + DB status |
| POST | `/api/contact` | Submit contact form |
| POST | `/api/track/view` | Log page view |
| POST | `/api/track/click` | Track project clicks |
| GET | `/api/stats` | Get analytics stats |

## 📧 Email Setup (Optional but Recommended)

### Using Gmail:
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Windows Computer"
3. Copy the 16-character password
4. Paste into `.env` as `EMAIL_PASS`

### Using Other Email Providers:
Update the Nodemailer config in `Sarver.js` line ~70 for your provider.

## 🗄️ MongoDB Setup

### Local MongoDB
```bash
# Windows
mongod

# Mac/Linux
brew services start mongodb-community
```

### MongoDB Atlas (Cloud)
1. Create account at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string → paste in `.env` as `MONGO_URI`

## 🧪 Testing

### Test Contact Form
1. Open `http://localhost:5000`
2. Scroll to Contact section
3. Fill form and submit
4. Check console for responses

### Test API Health
```bash
curl http://localhost:5000/api/health
```

### View Analytics
```bash
curl http://localhost:5000/api/stats
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Port 5000 already in use" | Change PORT in `.env` |
| "MongoDB connection failed" | Check MONGO_URI in `.env` |
| "Contact form not sending emails" | Verify EMAIL_USER & EMAIL_PASS |
| "Static files not loading" | Ensure `.env` is at root level |
| CORS errors | Update FRONTEND_URL in `.env` |

## 📱 Deployment

### Deploy on Render / Railway / Heroku:
1. Push code to GitHub
2. Connect repo to deployment platform
3. Set environment variables from `.env`
4. Deploy! ✨

## 📞 Support
If you encounter issues, check:
- Server logs in terminal
- MongoDB connection status
- Firewall/port 5000 access
- `.env` file is in root directory

---

**Your portfolio is now production-ready!** 🎉
