// server.js
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ជៀស CORS
app.use(cors());
app.use(express.json());

// Endpoint សម្រាប់ទាញយកវីដេអូ TikTok
app.get("/download", async (req, res) => {
  const tiktokUrl = req.query.url;
  if (!tiktokUrl) return res.status(400).json({ error: "សូមផ្តល់ URL TikTok" });

  const encodedUrl = encodeURIComponent(tiktokUrl);

  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY, // ✅ API Key
      "x-rapidapi-host": "tiktok-download-without-watermark.p.rapidapi.com"
    }
  };

  try {
    const response = await fetch(
      `https://tiktok-download-without-watermark.p.rapidapi.com/analysis?url=${encodedUrl}&hd=0`,
      options
    );
    const data = await response.json();

    if (data.video && data.video.playAddr) {
      res.json({ videoUrl: data.video.playAddr });
    } else {
      res.status(404).json({ error: "មិនអាចទាញយកវីដេអូនេះបាន" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "មានបញ្ហាក្នុងការទាញយក" });
  }
});

app.listen(PORT, () => console.log(`Server ដំណើរការ នៅ http://localhost:${PORT}`));
