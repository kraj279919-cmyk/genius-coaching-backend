const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB Database
connectDB();

// Initialize Express application
const app = express();

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// --- Security & Standard Middlewares ---
// 1. Set security HTTP headers
app.use(helmet());

// 2. Allow cross-origin requests (CORS Allowlist)
const allowedOrigins = ['http://localhost:3000', 'https://your-production-domain.com'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 3. Rate Limiting for all API requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, 
  legacyHeaders: false, 
});
app.use('/api/', apiLimiter);

// 4. Body parsers
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. Data Sanitization against NoSQL query injection
// Custom middleware to avoid setting read-only req.query
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  next();
});

// 6. Data Sanitization against XSS
// Custom middleware to avoid setting read-only req.query
const { clean } = require('xss-clean/lib/xss');
app.use((req, res, next) => {
  if (req.body) req.body = clean(req.body);
  if (req.params) req.params = clean(req.params);
  next();
});

// Phase 13.8 - Request Monitor Middleware
const requestMonitor = require('./middleware/requestMonitor');
app.use(requestMonitor);

// --- Test Route ---
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: "Genius Coaching Backend Live" });
});

// Phase 13.8 - Version API
const { getVersionInfo } = require('./controllers/opsController');
app.get('/api/version', getVersionInfo);

// --- API Routes ---
app.use('/api/ops', require('./routes/opsRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/homework', require('./routes/homeworkRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));


// --- New API Routes (Phase 15 Expansion) ---
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/website', require('./routes/websiteRoutes'));
app.use('/api/doubts', require('./routes/doubtRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
// --- Error Handling Middlewares ---
// Handle 404 (Not Found) errors
app.use(notFound);
// Global error handler for all other errors
app.use(errorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
