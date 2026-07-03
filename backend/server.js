require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const historyRoutes = require('./routes/historyRoutes');

dotenv.config();
// connectDB();  ← comment this out!

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'NovaAI Backend is running! 🚀' });
});

app.post('/api/assistant/chat', async (req, res) => {
  const { messages, apiKey, instructions } = req.body;

  const BASE_SYSTEM_PROMPT = `You are Nova, an expert AI code assistant. Help users generate code, explain concepts, debug issues, and answer programming questions. Format code with markdown code blocks.

When generating runnable JavaScript, HTML, CSS, or React/JSX code, follow these rules so it can be previewed automatically:
- Put ALL code for a single request in ONE fenced code block, not split across multiple blocks.
- For React/JSX: name the root component "App" (function App() { ... }), and do not include "export default" — just define the component. Include any styling inline via a <style> tag or inline style props rather than a separate CSS block.
- For a full HTML page: include everything (HTML, inline <style>, inline <script>) in one self-contained code block.
- For plain JavaScript meant to be run and inspected: always include console.log statements to display results, since code with no output will show nothing when executed.`;

  const systemPrompt = instructions
    ? `${BASE_SYSTEM_PROMPT}\n\nAdditional user instructions:\n${instructions}`
    : BASE_SYSTEM_PROMPT;

  try {
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      max_tokens: 1024
    });

    return res.json({
      content: [{ text: completion.choices[0].message.content }]
    });

  } catch (groqError) {
    console.error('GROQ CALL FAILED:', groqError);

    if (groqError.status !== 429) {
      if (groqError.status === 401) {
        return res.status(401).json({
          message: 'Invalid Groq API key. Please check your key in Profile.'
        });
      }
      return res.status(500).json({ message: 'AI request failed', error: groqError.message });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: systemPrompt
      });

      const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const chat = model.startChat({ history });
      const lastMessage = messages[messages.length - 1].content;
      const result = await chat.sendMessage(lastMessage);
      const text = result.response.text();

      return res.json({
        content: [{ text }],
        fallback: 'gemini'
      });

    } catch (geminiError) {
      console.error('GEMINI FALLBACK FAILED:', geminiError);
      return res.status(500).json({
        message: "Both Groq and Gemini failed. Groq's daily limit was hit, and the Gemini fallback also errored.",
        error: geminiError.message
      });
    }
  }
});

const LANGUAGE_MAP = {
  javascript: { language: 'javascript', version: '18.15.0' },
  python: { language: 'python', version: '3.10.0' },
  java: { language: 'java', version: '15.0.2' },
  cpp: { language: 'cpp', version: '10.2.0' },
  c: { language: 'c', version: '10.2.0' }
};

app.post('/api/assistant/run', async (req, res) => {
  try {
    const { code, language } = req.body;
    const lang = LANGUAGE_MAP[language] || LANGUAGE_MAP.javascript;

    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: lang.language,
        version: lang.version,
        files: [{ content: code }]
      })
    });

    const result = await response.json();
    console.log('RAW PISTON RESPONSE:', JSON.stringify(result, null, 2));

    if (!response.ok || !result.run) {
      console.error('PISTON REJECTED REQUEST:', result);
      return res.status(502).json({
        status: 'Error',
        stdout: '',
        stderr: result.message || 'Piston returned no run result. Check server logs for raw response.',
        compile_output: ''
      });
    }

    res.json({
      stdout: result.run.stdout ?? '',
      stderr: result.run.stderr ?? '',
      compile_output: result.compile?.stderr ?? '',
      status: result.run.code === 0 ? 'Success' : 'Error'
    });
  } catch (error) {
    console.error('PISTON CALL FAILED:', error.message);
    res.status(500).json({ message: 'Code execution failed', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});