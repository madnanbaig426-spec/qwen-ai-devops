const express = require("express");

const app = express();
const PORT = 3000;
const AI_SERVER_URL = "http://localhost:8000";

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Qwen AI Web Server is running",
    status: "success"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "qwen-ai-web-server"
  });
});

app.post("/api/chat", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({
      error: "Prompt is required"
    });
  }

  try {
    const response = await fetch(`${AI_SERVER_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt
      })
    });

    if (!response.ok) {
      return res.status(502).json({
        error: "AI server returned an error"
      });
    }

    const data = await response.json();

    res.json({
      prompt: prompt,
      response: data.response
    });

  } catch (error) {
    res.status(503).json({
      error: "AI server is unavailable"
    });
  }
});

app.listen(PORT, () => {
  console.log("Web server running on http://localhost:" + PORT);
});
