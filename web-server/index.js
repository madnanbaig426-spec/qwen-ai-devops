```javascript
const express = require("express");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Home endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Qwen AI Web Server is running",
    status: "success"
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "qwen-ai-web-server"
  });
});

// Chat API endpoint
app.post("/api/chat", (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({
      error: "Prompt is required"
    });
  }

  res.json({
    message: "Prompt received successfully",
    prompt: prompt
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Web server running on http://localhost:${PORT}`);
});
```
