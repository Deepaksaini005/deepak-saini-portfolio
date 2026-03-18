const express     = require('express');
const mongoose    = require('mongoose');
const cors        = require('cors');
const dotenv      = require('dotenv');
const nodemailer  = require('nodemailer');
const rateLimit   = require('express-rate-limit');
const helmet      = require('helmet');
const morgan      = require('morgan');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));

// ─── Serve Static Files (HTML, CSS, JS) ────────────────────────
app.use(express.static(__dirname));

// ─── Rate Limiting ────────────────────────────────────────────
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 min
  max: 5,
  message: { success: false, message: 'Too many messages. Try again in 15 minutes.' }
});

// ─── MongoDB Connection ───────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/deepak_portfolio', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅  MongoDB connected'))
.catch(err => console.error('❌  MongoDB error:', err.message));

// ─── Schemas & Models ─────────────────────────────────────────

// Contact Message
const messageSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true, maxlength: 100 },
  email:     { type: String, required: true, trim: true, lowercase: true,
               match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  subject:   { type: String, trim: true, maxlength: 200, default: 'Portfolio Contact' },
  message:   { type: String, required: true, trim: true, maxlength: 2000 },
  ip:        { type: String },
  read:      { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const Message = mongoose.model('Message', messageSchema);

// Page View Analytics
const viewSchema = new mongoose.Schema({
  page:      { type: String, default: 'home' },
  userAgent: { type: String },
  ip:        { type: String },
  referrer:  { type: String },
  createdAt: { type: Date, default: Date.now },
});
const PageView = mongoose.model('PageView', viewSchema);

// Project Click tracking
const clickSchema = new mongoose.Schema({
  project:   { type: String, required: true },
  url:       { type: String },
  ip:        { type: String },
  createdAt: { type: Date, default: Date.now },
});
const ProjectClick = mongoose.model('ProjectClick', clickSchema);

// ─── Nodemailer Transporter ───────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,   // App Password (not Gmail password)
  },
});

// ─── Routes ───────────────────────────────────────────────────

// Home route — serve index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'Server is running 🚀',
    db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/contact — Save message + send email notification
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required.' });
    }

    // Save to DB
    const msg = await Message.create({
      name, email,
      subject: subject || `Portfolio Contact from ${name}`,
      message,
      ip: req.ip,
    });

    // Email to Deepak
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({
        from:    `"Portfolio Bot" <${process.env.EMAIL_USER}>`,
        to:      process.env.EMAIL_TO || 'sainideepaksaini1234567890@gmail.com',
        subject: `📬 New Message: ${msg.subject}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0d0a22;color:#f0eef8;padding:32px;border-radius:12px;border:1px solid rgba(255,61,107,.3)">
            <h2 style="color:#FF3D6B;margin:0 0 20px;font-size:1.4rem">New Portfolio Message</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#8b8ea8;width:80px">From</td><td style="color:#f0eef8;font-weight:600">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#8b8ea8">Email</td><td><a href="mailto:${email}" style="color:#FF3D6B">${email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#8b8ea8">Subject</td><td style="color:#f0eef8">${msg.subject}</td></tr>
            </table>
            <div style="margin:20px 0;padding:16px;background:rgba(255,255,255,.04);border-radius:8px;border-left:3px solid #FF3D6B">
              <p style="margin:0;color:#c0bdd8;line-height:1.7">${message.replace(/\n/g,'<br>')}</p>
            </div>
            <p style="color:#4a4d6b;font-size:.8rem;margin:0">Received: ${new Date().toLocaleString('en-IN', {timeZone:'Asia/Kolkata'})}</p>
          </div>
        `,
      });

      // Auto-reply to sender
      await transporter.sendMail({
        from:    `"Deepak Saini" <${process.env.EMAIL_USER}>`,
        to:      email,
        subject: `Got your message, ${name}! 👋`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0d0a22;color:#f0eef8;padding:32px;border-radius:12px">
            <h2 style="color:#FF3D6B;margin:0 0 16px">Thanks for reaching out!</h2>
            <p style="color:#c0bdd8;line-height:1.7">Hi ${name},<br><br>I've received your message and will get back to you as soon as possible, usually within 24 hours.</p>
            <p style="color:#c0bdd8;line-height:1.7">In the meantime, feel free to check out my projects on <a href="https://github.com/Deepaksaini005" style="color:#FF3D6B">GitHub</a>.</p>
            <p style="color:#8b8ea8;margin-top:24px">— Deepak Saini<br><span style="color:#4a4d6b;font-size:.82rem">B.Tech Student · JECRC University · Jaipur</span></p>
          </div>
        `,
      });
    }

    res.status(201).json({ success: true, message: 'Message sent! I\'ll reply soon.' });

  } catch (err) {
    console.error('Contact error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(err.errors)[0].message });
    }
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// POST /api/track/view — Log page view
app.post('/api/track/view', async (req, res) => {
  try {
    await PageView.create({
      page:      req.body.page || 'home',
      userAgent: req.headers['user-agent'],
      ip:        req.ip,
      referrer:  req.headers.referer || '',
    });
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

// POST /api/track/click — Log project click
app.post('/api/track/click', async (req, res) => {
  try {
    const { project, url } = req.body;
    if (!project) return res.status(400).json({ success: false });
    await ProjectClick.create({ project, url, ip: req.ip });
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

// GET /api/stats — Public portfolio stats
app.get('/api/stats', async (req, res) => {
  try {
    const [totalViews, totalMessages, totalClicks] = await Promise.all([
      PageView.countDocuments(),
      Message.countDocuments(),
      ProjectClick.countDocuments(),
    ]);
    const topProjects = await ProjectClick.aggregate([
      { $group: { _id: '$project', clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 5 },
    ]);
    res.json({
      success: true,
      stats: { totalViews, totalMessages, totalClicks, topProjects }
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Portfolio backend running at http://localhost:${PORT}`);
  console.log(`📡  API health: http://localhost:${PORT}/api/health\n`);
});