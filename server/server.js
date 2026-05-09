import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5173",
    "X-Title": "AI Study Assistant",
  },
});

const MODEL = "openrouter/auto";

console.log("API key loaded:", process.env.OPENAI_API_KEY ? "YES ✓" : "NO ✗");
console.log("Using model:", MODEL);

app.get("/", (req, res) => {
  res.json({ status: "AI Study Assistant API running" });
});

app.post("/api/summarize", async (req, res) => {
  try {
    const { text } = req.body;
    console.log("Summarize request, text length:", text?.length);

    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: "Text too short." });
    }

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert study assistant. Summarize the provided text clearly and concisely using bullet points. Keep it to 150-250 words. Write in the same language as the input text.",
        },
        {
          role: "user",
          content: `Summarize this study material:\n\n${text}`,
        },
      ],
      max_tokens: 500,
    });

    const summary = completion.choices[0].message.content;
    console.log("Summary generated OK");
    res.json({ summary });
  } catch (error) {
    console.error("SUMMARIZE ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/quiz", async (req, res) => {
  try {
    const { text } = req.body;
    console.log("Quiz request, text length:", text?.length);

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: "Text too short." });
    }

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a quiz generator. Generate exactly 5 multiple choice questions based on the study material.
Respond ONLY with a valid JSON array. No markdown, no explanation, just raw JSON.
Format:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "The correct option text exactly as written in options"
  }
]
Generate in the same language as the input.`,
        },
        {
          role: "user",
          content: `Generate a quiz from:\n\n${text}`,
        },
      ],
      max_tokens: 1000,
    });

    const raw = completion.choices[0].message.content;
    const clean = raw.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(clean);
    console.log("Quiz generated OK, questions:", questions.length);
    res.json({ questions });
  } catch (error) {
    console.error("QUIZ ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));