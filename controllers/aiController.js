const { GoogleGenAI } = require('@google/genai');
const catchAsync = require('../utils/catchAsync');
const ConfigService = require('../utils/configService');
const logAction = require('../utils/auditLogger');
const JobQueue = require('../models/JobQueue');

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = 'gemini-2.5-flash';

/**
 * Helper to check AI Feature Flag
 */
const checkAiEnabled = async () => {
  const config = await ConfigService.getConfig();
  if (!config.aiEnabled) {
    throw new Error('AI features are currently disabled by the Director.');
  }
};

/**
 * Log AI Usage Job
 */
const logAiUsage = async (type, payloadSummary) => {
  await JobQueue.create({
    type: `AI_${type}`,
    payloadSummary,
    status: 'completed'
  });
};

/**
 * POST /api/ai/notice-writer
 * AI Notice Writer for Director
 */
const generateNotice = catchAsync(async (req, res) => {
  await checkAiEnabled();
  const { topic } = req.body;
  if (!topic) {
    res.status(400);
    throw new Error('Please provide a topic for the notice.');
  }

  const prompt = `You are an expert school administrator. Draft a professional notice based on this topic: "${topic}". 
  Return a raw JSON object (NO MARKDOWN WRAPPERS OR BACKTICKS) with exactly these keys:
  - "title": A clear, concise title.
  - "body": The full body of the notice.
  - "category": Choose one of [academic, event, holiday, exam, fee, general].
  - "priority": Choose [normal, high, urgent].
  - "targetAudience": A suggestion like "All Students", "Class 10", "Teachers Only".`;

  const response = await ai.models.generateContent({ model, contents: prompt });
  let result;
  try {
    const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    result = JSON.parse(cleanText);
  } catch (e) {
    res.status(500);
    throw new Error('AI returned an invalid format. Please try again.');
  }

  await logAction(req, 'AI_NOTICE_GENERATED', `Generated notice for topic: ${topic}`, 'AI');
  await logAiUsage('NOTICE_WRITER', `Topic: ${topic}`);

  res.json(result);
});

/**
 * POST /api/ai/content-writer
 * AI Content Writer for CMS
 */
const generateContent = catchAsync(async (req, res) => {
  await checkAiEnabled();
  const { type, promptContext } = req.body; // type: 'hero', 'about', 'motivational', etc.

  const prompt = `Write a professional, inspiring ${type} text for a Coaching Institute website. Context: "${promptContext}". Keep it concise and impactful. Return ONLY the text, no quotes or markdown.`;

  const response = await ai.models.generateContent({ model, contents: prompt });
  const text = response.text.trim();

  await logAction(req, 'AI_CONTENT_GENERATED', `Generated website content type: ${type}`, 'AI');
  await logAiUsage('CONTENT_WRITER', `Type: ${type}`);

  res.json({ content: text });
});

/**
 * POST /api/ai/test-generator
 * AI Test Generator for Teachers
 */
const generateTest = catchAsync(async (req, res) => {
  await checkAiEnabled();
  const { subject, topic, difficulty, numQuestions } = req.body;

  const prompt = `Create a ${difficulty} difficulty test for ${subject} on the topic "${topic}". Generate exactly ${numQuestions} questions.
  Return a raw JSON object (NO MARKDOWN WRAPPERS) with:
  "mcq": [ { "question": "...", "options": ["A","B","C","D"], "answer": "correct option" } ],
  "short": [ "question 1", "question 2" ],
  "long": [ "question 1" ]`;

  const response = await ai.models.generateContent({ model, contents: prompt });
  let result;
  try {
    const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    result = JSON.parse(cleanText);
  } catch (e) {
    res.status(500);
    throw new Error('AI returned an invalid format.');
  }

  await logAction(req, 'AI_TEST_GENERATED', `Generated ${subject} test for topic: ${topic}`, 'AI');
  await logAiUsage('TEST_GENERATOR', `Subject: ${subject}, Topic: ${topic}`);

  res.json(result);
});

/**
 * POST /api/ai/result-analysis
 * Analyze Student Results
 */
const analyzeResult = catchAsync(async (req, res) => {
  await checkAiEnabled();
  const { studentName, marksData } = req.body; 
  // marksData expected as array of { subject, marks, outOf }

  if (!marksData || marksData.length < 2) {
    return res.json({ analysis: "Not enough data to provide a meaningful analysis. Need at least 2 subjects." });
  }

  const prompt = `Analyze these exam results for ${studentName}: ${JSON.stringify(marksData)}.
  Return a short, encouraging summary identifying their strongest subject, weakest subject, and one actionable improvement suggestion. No markdown.`;

  const response = await ai.models.generateContent({ model, contents: prompt });
  
  await logAiUsage('RESULT_ANALYSIS', `Student: ${studentName}`);
  res.json({ analysis: response.text.trim() });
});

/**
 * POST /api/ai/attendance-analysis
 * Analyze Class Attendance
 */
const analyzeAttendance = catchAsync(async (req, res) => {
  await checkAiEnabled();
  const { className, attendanceData } = req.body;

  const prompt = `Analyze this attendance data for ${className}: ${JSON.stringify(attendanceData)}.
  Identify students at high risk (low attendance), explain the general trend, and suggest one action for the teacher. Be brief.`;

  const response = await ai.models.generateContent({ model, contents: prompt });
  
  await logAiUsage('ATTENDANCE_ANALYSIS', `Class: ${className}`);
  res.json({ analysis: response.text.trim() });
});

/**
 * POST /api/ai/chat
 * General Role-Aware Chat Assistant
 */
const chatAssistant = catchAsync(async (req, res) => {
  await checkAiEnabled();
  const { message } = req.body;
  const role = req.user.role;

  let systemInstruction = "You are a helpful assistant.";
  if (role === 'student') {
    systemInstruction = "You are a friendly, encouraging educational tutor for a student. Only answer educational questions. If they ask for private data, secrets, or inappropriate topics, politely decline.";
  } else if (role === 'teacher') {
    systemInstruction = "You are an assistant for a school teacher. Help them with lesson planning, student management advice, and grading tips.";
  } else if (role === 'admin' || role === 'director') {
    systemInstruction = "You are an ERP assistant for a school director. Help them with administration, leadership, analytics, and writing formal notices.";
  }

  const prompt = `${systemInstruction}\nUser message: ${message}`;
  
  const response = await ai.models.generateContent({ model, contents: prompt });
  
  await logAiUsage('CHAT', `Role: ${role}, Message length: ${message.length}`);
  res.json({ reply: response.text.trim() });
});

module.exports = {
  generateNotice,
  generateContent,
  generateTest,
  analyzeResult,
  analyzeAttendance,
  chatAssistant
};
