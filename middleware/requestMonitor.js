const ApiRequestLog = require('../models/ApiRequestLog');

const requestMonitor = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', async () => {
    try {
      const responseTime = Date.now() - start;
      const statusCode = res.statusCode;
      const errorFlag = statusCode >= 400;

      // Do not log the ops/api-stats route itself to avoid infinite loop of logs if queried constantly
      if (req.originalUrl.includes('/api/ops/api-stats')) return;

      await ApiRequestLog.create({
        route: req.originalUrl,
        method: req.method,
        statusCode,
        responseTime,
        userRole: req.user ? req.user.role : 'unauthenticated',
        errorFlag
      });
    } catch (err) {
      console.error('Failed to log API request:', err.message);
    }
  });

  next();
};

module.exports = requestMonitor;
