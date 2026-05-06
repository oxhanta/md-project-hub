import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
const upload = multer({ storage: multer.memoryStorage() });
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public')); // Serve the frontend

// Initialize Google Gemini client
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// JSON Schema for extraction (matching PRD)
const extractionSchema = {
  "type": "object",
  "properties": {
    "summary": { "type": "string" },
    "report_period": { "type": "string" },
    "projects": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "category": { "type": "string", "enum": ["Capital infrastructure", "Network rehabilitation", "Transmission pipeline", "Waterworks", "Distribution network", "Water treatment plant", "Other"] },
          "region": { "type": "string", "enum": ["State-wide", "North", "South", "West"] },
          "handler": { "type": "string" },
          "status": { "type": "string", "enum": ["Ongoing", "Active", "Delayed", "Completed", "Critical"] },
          "completion": { "type": "integer" },
          "contractor": { "type": "string" },
          "notes": { "type": "string" }
        },
        "required": ["name", "category", "region", "handler", "status", "completion"]
      }
    },
    "engagements": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "partner": { "type": "string", "enum": ["WaterAid", "JICA", "IFC", "SUEZ", "World Bank", "Government", "PPP stakeholder", "Other"] },
          "date": { "type": "string" },
          "location": { "type": "string" },
          "related": { "type": "string" },
          "notes": { "type": "string" }
        },
        "required": ["title", "partner", "date"]
      }
    },
    "metrics": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "key": { "type": "string" },
          "value": { "type": "string" },
          "note": { "type": "string" }
        },
        "required": ["key", "value"]
      }
    },
    "flags": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "severity": { "type": "string", "enum": ["Critical", "Warning", "Info", "Safe"] },
          "description": { "type": "string" }
        },
        "required": ["title", "severity", "description"]
      }
    }
  },
  "required": ["summary", "report_period", "projects", "engagements", "metrics", "flags"]
};

// API Endpoint for Document Analysis
app.post('/api/analyze', upload.single('file'), async (req, res) => {
  let text = req.body.text;
  const mode = req.body.mode;

  if (req.file) {
    try {
      if (req.file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(req.file.buffer);
        text = pdfData.text;
      } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || req.file.mimetype === 'application/msword') {
        const docData = await mammoth.extractRawText({ buffer: req.file.buffer });
        text = docData.value;
      } else {
        text = req.file.buffer.toString('utf8');
      }
    } catch (err) {
      console.error("File parsing error:", err);
      return res.status(400).json({ error: 'Failed to parse the uploaded document.' });
    }
  }

  if (!text) {
    return res.status(400).json({ error: 'Text content or a valid file is required' });
  }
  
  if (!process.env.GEMINI_API_KEY || !genAI) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  // Truncate to first 6,000 characters as per PRD
  const truncatedText = text.substring(0, 6000);

  let systemPrompt = `You are an expert analyst for the Lagos Water Corporation (LWC) with deep domain knowledge of water utility operations.
Your task is to extract structured data from operational reports.
IMPORTANT INSTRUCTIONS:
- You must ONLY return a valid, raw JSON object. 
- Do NOT wrap the JSON in markdown code blocks (e.g., \`\`\`json).
- Do NOT include any introductory or concluding text.
- Ensure all dates are in ISO format (YYYY-MM-DD).
- If a specific field is not found in the text, use a sensible default (like an empty string or empty array) rather than omitting the key.
- For 'flags', you must extract any risks or issues. Even if the document is completely risk-free or positive, you MUST provide at least one flag with severity 'Safe' or 'Info' giving a general positive assessment and advice (e.g., "The document indicates healthy operations with no major risks...").`;

  if (mode === 'projects_only') {
     systemPrompt += `\nFocus ONLY on extracting projects. Return an empty array for engagements, metrics, and flags, and empty strings for summary and report_period.`;
  } else if (mode === 'engagements_only') {
     systemPrompt += `\nFocus ONLY on extracting engagements. Return an empty array for projects, metrics, and flags, and empty strings for summary and report_period.`;
  } else if (mode === 'metrics_only') {
     systemPrompt += `\nFocus ONLY on extracting metrics. Return an empty array for projects, engagements, and flags, and empty strings for summary and report_period.`;
  }

  try {
    const modelInstance = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      }
    });

    const prompt = `${systemPrompt}\n\nConform strictly to this JSON schema:\n${JSON.stringify(extractionSchema, null, 2)}\n\nExtract information from the following report:\n\n${truncatedText}`;
    
    const result = await modelInstance.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Parse to ensure valid JSON before sending back
    let parsedJson;
    try {
      parsedJson = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", responseText);
      return res.status(500).json({ error: 'Failed to extract valid JSON from the document.', details: responseText });
    }

    res.json(parsedJson);

  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during analysis.' });
  }
});

app.listen(port, () => {
  console.log(`LWC Project Intelligence Hub server running at http://localhost:${port}`);
});
