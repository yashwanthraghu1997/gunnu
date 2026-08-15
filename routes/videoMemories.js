// routes/videoMemories.js - Express Routes for Baby Video Memories
const express = require('express');
const router = express.Router();
const baby = require('../data/baby');
const { getVideoMemoriesAsync, saveVideoMemoriesAsync } = require('../data/videoMemories');

// Helper: Calculate age
function calculateAge(dobStr) {
  const dob = new Date(dobStr);
  const now = new Date();

  let years = now.getFullYear() - dob.getFullYear();
  let monthsCount = now.getMonth() - dob.getMonth();
  let days = now.getDate() - dob.getDate();

  if (days < 0) {
    monthsCount--;
    const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthDays;
  }
  if (monthsCount < 0) {
    years--;
    monthsCount += 12;
  }

  const diffTime = Math.abs(now - dob);
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  let currentChapterNum = monthsCount + 1;
  if (currentChapterNum < 1) currentChapterNum = 1;
  if (currentChapterNum > 12) currentChapterNum = 12;

  return { years, months: monthsCount, days, totalDays, currentChapterNum };
}

// Helper: Robust Google Drive URL Parser
function parseGoogleDriveUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return '';
  const trimmed = urlStr.trim();
  if (!trimmed) return '';

  let fileId = null;
  const matchD = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) {
    fileId = matchD[1];
  } else {
    const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId && matchId[1]) {
      fileId = matchId[1];
    }
  }

  if (fileId) {
    // Return standard preview/stream URL structure
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/') && !trimmed.startsWith('data:')) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

// Valid password list matching site protection
const VALID_PASSWORDS = ['gunnu@987'];

function verifyPassword(password) {
  if (!password || typeof password !== 'string') return false;
  const trimmed = password.trim();
  return trimmed === 'gunnu@987' || trimmed.toLowerCase() === 'gunnu@987';
}

// 1. GET /video-memories - Render Video Memories Page
router.get('/video-memories', async (req, res) => {
  try {
    const age = calculateAge(baby.dob);
    const videoMemories = await getVideoMemoriesAsync();

    res.render('video-memories', {
      baby,
      age,
      videoMemories,
      title: "Little Moments ❤️ - Gunnu's Video Memories"
    });
  } catch (err) {
    console.error("Error rendering /video-memories:", err);
    res.status(500).send("Error loading Video Memories page.");
  }
});

// 2. GET /api/video-memories - Retrieve JSON list of video memories
router.get('/api/video-memories', async (req, res) => {
  try {
    const videoMemories = await getVideoMemoriesAsync();
    res.json({ success: true, memories: videoMemories });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch video memories." });
  }
});

// 3. POST /video-memories/upload OR POST /api/video-memories - Add new video memory
router.post(['/video-memories/upload', '/api/video-memories'], async (req, res) => {
  try {
    const { videoUrl, driveUrl, thumbnail, title, date, babyAge, description, quote, password } = req.body;
    const rawVideoUrl = driveUrl || videoUrl;

    if (!rawVideoUrl || !rawVideoUrl.trim()) {
      return res.status(400).json({ success: false, message: "Please provide a valid video URL or Google Drive link!" });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Please enter a title for your memory." });
    }

    if (!verifyPassword(password)) {
      return res.status(401).json({ success: false, message: "Incorrect password. Please enter the album password to save your video memory!" });
    }

    const processedVideoUrl = parseGoogleDriveUrl(rawVideoUrl.trim());
    let processedThumbnail = thumbnail ? thumbnail.trim() : '';

    // If thumbnail is empty but it's a Google Drive link, extract thumbnail automatically
    if (!processedThumbnail && (rawVideoUrl.includes('drive.google.com') || rawVideoUrl.includes('/d/'))) {
      const match = rawVideoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || rawVideoUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        processedThumbnail = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
      }
    }

    const memories = await getVideoMemoriesAsync();
    const newId = memories.length > 0 ? Math.max(...memories.map(m => m.id)) + 1 : 1;

    const newMemory = {
      id: newId,
      videoUrl: processedVideoUrl,
      rawVideoUrl: rawVideoUrl.trim(),
      thumbnail: processedThumbnail || '/images/gunnu.jpeg',
      title: title.trim(),
      date: date ? date.trim() : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      babyAge: babyAge ? babyAge.trim() : 'Baby Memory',
      description: description ? description.trim() : '',
      quote: quote ? quote.trim() : ''
    };

    memories.push(newMemory);
    await saveVideoMemoriesAsync(memories);

    res.json({
      success: true,
      message: "Video memory saved beautifully! ❤️",
      memory: newMemory,
      memories
    });
  } catch (err) {
    console.error("Error adding video memory:", err);
    res.status(500).json({ success: false, message: "Error saving video memory." });
  }
});

// 4. PUT /api/video-memories/:id - Edit an existing video memory
router.put('/api/video-memories/:id', async (req, res) => {
  try {
    const memoryId = parseInt(req.params.id, 10);
    const { videoUrl, driveUrl, thumbnail, title, date, babyAge, description, quote, password } = req.body;

    if (!verifyPassword(password)) {
      return res.status(401).json({ success: false, message: "Incorrect password. Please enter the album password to update your video memory!" });
    }

    const memories = await getVideoMemoriesAsync();
    const index = memories.findIndex(m => m.id === memoryId);

    if (index === -1) {
      return res.status(404).json({ success: false, message: "Video memory not found." });
    }

    const rawVideoUrl = driveUrl || videoUrl || memories[index].videoUrl;
    const processedVideoUrl = parseGoogleDriveUrl(rawVideoUrl.trim());

    memories[index] = {
      ...memories[index],
      videoUrl: processedVideoUrl,
      rawVideoUrl: rawVideoUrl.trim(),
      thumbnail: thumbnail ? thumbnail.trim() : memories[index].thumbnail,
      title: title ? title.trim() : memories[index].title,
      date: date ? date.trim() : memories[index].date,
      babyAge: babyAge ? babyAge.trim() : memories[index].babyAge,
      description: description ? description.trim() : memories[index].description,
      quote: quote !== undefined ? quote.trim() : memories[index].quote
    };

    await saveVideoMemoriesAsync(memories);

    res.json({
      success: true,
      message: "Memory updated successfully! ❤️",
      memory: memories[index],
      memories
    });
  } catch (err) {
    console.error("Error updating video memory:", err);
    res.status(500).json({ success: false, message: "Error updating video memory." });
  }
});

// 5. DELETE /api/video-memories/:id - Delete a video memory
router.delete('/api/video-memories/:id', async (req, res) => {
  try {
    const memoryId = parseInt(req.params.id, 10);
    const { password } = req.body;

    if (!verifyPassword(password)) {
      return res.status(401).json({ success: false, message: "Incorrect password. Unable to delete memory." });
    }

    let memories = await getVideoMemoriesAsync();
    const existingCount = memories.length;
    memories = memories.filter(m => m.id !== memoryId);

    if (memories.length === existingCount) {
      return res.status(404).json({ success: false, message: "Memory not found." });
    }

    await saveVideoMemoriesAsync(memories);

    res.json({
      success: true,
      message: "Memory deleted.",
      memories
    });
  } catch (err) {
    console.error("Error deleting video memory:", err);
    res.status(500).json({ success: false, message: "Error deleting video memory." });
  }
});

module.exports = router;
