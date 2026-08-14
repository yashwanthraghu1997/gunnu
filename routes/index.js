// routes/index.js - Express Route Definitions for Gunnu's Voice
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Load data models
const baby = require('../data/baby');
const months = require('../data/months');
const messages = require('../data/messages');
const milestones = require('../data/milestones');
const timeline = require('../data/timeline');
const gallery = require('../data/gallery');

const customPhotosPath = path.join(__dirname, '../data/customPhotos.json');

// Helper function: Robust Google Drive URL Parser
function parseGoogleDriveUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return '';
  const trimmed = urlStr.trim();
  if (!trimmed) return '';

  if (trimmed.includes('drive.google.com/thumbnail')) {
    return trimmed;
  }

  let fileId = null;

  // Match /d/FILE_ID/ or /d/FILE_ID
  const matchD = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) {
    fileId = matchD[1];
  } else {
    // Match id=FILE_ID
    const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId && matchId[1]) {
      fileId = matchId[1];
    }
  }

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  // Prepend https:// if protocol is missing on standard URLs
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/') && !trimmed.startsWith('data:')) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

// Helper function: Load custom photos map
function getCustomPhotosMap() {
  try {
    if (fs.existsSync(customPhotosPath)) {
      const raw = fs.readFileSync(customPhotosPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading customPhotos.json:", err);
  }
  return {};
}

// Helper function: Save custom photos map
function saveCustomPhotosMap(mapData) {
  try {
    fs.writeFileSync(customPhotosPath, JSON.stringify(mapData, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing customPhotos.json:", err);
  }
}

// Helper function: Calculate age & dynamic chapter progress based on DOB
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

  const nextMonthDate = new Date(dob);
  nextMonthDate.setMonth(dob.getMonth() + currentChapterNum);
  let daysUntilNextMonth = Math.ceil((nextMonthDate - now) / (1000 * 60 * 60 * 24));
  if (daysUntilNextMonth <= 0) daysUntilNextMonth = 1;

  return { years, months: monthsCount, days, totalDays, currentChapterNum, daysUntilNextMonth };
}

// Age-Based Dynamic Month Status Generator with Month-Wise Custom Photo Merge
function getDynamicMonths(currentChapterNum) {
  const customMap = getCustomPhotosMap();
  return months.map(m => {
    let status = 'locked';
    if (m.id < currentChapterNum) {
      status = 'completed';
    } else if (m.id === currentChapterNum) {
      status = 'current';
    } else {
      status = 'locked';
    }
    const monthImage = parseGoogleDriveUrl(customMap[String(m.id)]) || m.image;
    return { ...m, status, image: monthImage };
  });
}

function getDynamicTimeline(totalDays, currentChapterNum) {
  return timeline.map(t => {
    let status = 'locked';
    if (t.day <= totalDays) {
      status = 'completed';
    } else if (t.day <= (currentChapterNum * 30) && t.day > ((currentChapterNum - 1) * 30)) {
      status = 'current';
    } else {
      status = 'locked';
    }
    return { ...t, status };
  });
}

// 1. Root route: Intro Experience
router.get('/', (req, res) => {
  const age = calculateAge(baby.dob);
  res.render('intro/master', {
    baby,
    age,
    title: "Congratulations Mumma & Papa ❤️ - Gunnu's Voice"
  });
});

// 2. Intro route
router.get('/intro', (req, res) => {
  const age = calculateAge(baby.dob);
  res.render('intro/master', {
    baby,
    age,
    title: "Welcome - Gunnu's Voice Intro"
  });
});

// 3. Dashboard Route
router.get('/dashboard', (req, res) => {
  const age = calculateAge(baby.dob);
  const dynamicMonths = getDynamicMonths(age.currentChapterNum);
  const dynamicTimeline = getDynamicTimeline(age.totalDays, age.currentChapterNum);

  const currentMonthData = dynamicMonths.find(m => m.id === age.currentChapterNum) || dynamicMonths[0];

  const randomMsgIndex = Math.floor(Math.random() * messages.length);
  const todaysMessage = messages[randomMsgIndex];

  res.render('dashboard', {
    baby,
    age,
    months: dynamicMonths,
    currentMonth: currentMonthData,
    todaysMessage,
    milestones,
    timeline: dynamicTimeline,
    gallery,
    title: "Dashboard - Gunnu's Voice"
  });
});

// 4. Chapter Detail Route
router.get('/chapter/:id', (req, res) => {
  const age = calculateAge(baby.dob);
  const chapterId = parseInt(req.params.id, 10);
  const dynamicMonths = getDynamicMonths(age.currentChapterNum);
  const chapter = dynamicMonths.find(m => m.id === chapterId);

  if (!chapter) {
    return res.redirect('/dashboard');
  }

  const isLocked = chapterId > age.currentChapterNum;

  const prevChapter = dynamicMonths.find(m => m.id === chapterId - 1);
  const nextChapter = dynamicMonths.find(m => m.id === chapterId + 1);

  res.render('chapter', {
    baby,
    chapter,
    isLocked,
    prevChapter: (prevChapter && prevChapter.id <= age.currentChapterNum) ? prevChapter : null,
    nextChapter: (nextChapter && nextChapter.id <= age.currentChapterNum) ? nextChapter : null,
    age,
    title: isLocked ? `Chapter ${chapter.id} Locked - Gunnu's Voice` : `Month ${chapter.id}: ${chapter.title} - Gunnu's Voice`
  });
});

// 5. Client API route
router.get('/api/data', (req, res) => {
  const age = calculateAge(baby.dob);
  const dynamicMonths = getDynamicMonths(age.currentChapterNum);
  const dynamicTimeline = getDynamicTimeline(age.totalDays, age.currentChapterNum);

  res.json({
    baby,
    age,
    months: dynamicMonths,
    messages,
    milestones,
    timeline: dynamicTimeline,
    gallery
  });
});

// 6. POST API Route: Update Photo per Month ID from File or Google Drive URL (With Password Protection)
router.post('/api/photo/month', (req, res) => {
  const { monthId, photoUrl, driveUrl, password } = req.body;
  const rawUrl = driveUrl || photoUrl;

  if (!monthId || !rawUrl) {
    return res.status(400).json({ success: false, message: "Missing monthId or photo data." });
  }

  // Password verification is strictly required
  if (!password || typeof password !== 'string' || password.trim() === '') {
    return res.status(401).json({ success: false, message: "Please enter your password to update the photo!" });
  }

  const validPasswords = ['gunnu', 'mohit', 'akanksha', '1234', 'password', 'love', 'baby', 'arika'];
  const trimmed = password.trim().toLowerCase();

  if (!validPasswords.includes(trimmed)) {
    return res.status(401).json({ success: false, message: "Incorrect password. Please try again." });
  }

  const processedUrl = parseGoogleDriveUrl(rawUrl.trim());
  const customMap = getCustomPhotosMap();
  customMap[String(monthId)] = processedUrl;
  saveCustomPhotosMap(customMap);

  res.json({
    success: true,
    monthId,
    photoUrl: processedUrl,
    message: `Month ${monthId} photo updated successfully!`
  });
});

// Album Data Helpers
const albumDataPath = path.join(__dirname, '../data/albumData.json');

function getAlbumPages() {
  try {
    if (fs.existsSync(albumDataPath)) {
      const raw = fs.readFileSync(albumDataPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading albumData.json:", err);
  }
  return [
    {
      id: "page_1",
      type: "photo",
      title: "Welcome to Little Gunnu's World",
      image: "/images/momma-pappa.jpeg",
      caption: "Wrapped in warmth and endless love with Mumma & Papa",
      date: "28 July 2026"
    },
    {
      id: "page_2",
      type: "text",
      title: "First Moments Together",
      content: "Today you smiled for the first time. Mumma and Papa will never forget this moment. You brought so much sunshine into our hearts, little angel. ❤️",
      date: "30 July 2026"
    },
    {
      id: "page_3",
      type: "photo",
      title: "Sweet Baby Dreams",
      image: "/images/gunnu.jpeg",
      caption: "Tiny fingers, cute little coos, and peaceful sleep",
      date: "2 August 2026"
    },
    {
      id: "page_4",
      type: "name_reveal",
      title: "A Sacred Identity",
      pretitle: "Yesterday... I received my name.",
      subtitle: "Mumma & Papa chose it with so much love.",
      name: "GUNNU",
      tagline: "My name. My first little identity.",
      date: "7 August 2026"
    },
    {
      id: "page_5",
      type: "photo",
      title: "Blush Pink Photoshoot",
      image: "/images/baby-month3.png",
      caption: "Holding my head high with my cute little blush smile!",
      date: "8 August 2026"
    },
    {
      id: "page_6",
      type: "photo",
      title: "Memory Tree of Love",
      image: "/images/memory-tree.png",
      caption: "Rooted in love, blooming every single day",
      date: "8 August 2026"
    }
  ];
}

function saveAlbumPages(pages) {
  try {
    fs.writeFileSync(albumDataPath, JSON.stringify(pages, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing albumData.json:", err);
  }
}

// 7. GET Album Page Route
router.get('/album', (req, res) => {
  const age = calculateAge(baby.dob);
  const pages = getAlbumPages();
  res.render('album', {
    baby,
    age,
    pages,
    title: "My Little Album ❤️ - Gunnu's Physical Memory Book"
  });
});

// 8. GET /api/album - Retrieve album pages
router.get('/api/album', (req, res) => {
  const pages = getAlbumPages();
  res.json({ success: true, pages });
});

// 9. POST /api/album - Save album pages with password verification
router.post('/api/album', (req, res) => {
  const { password, pages } = req.body;

  // Simple password verification - allow standard family passwords (e.g. 'gunnu', 'mohit', 'akanksha', '1234' or any provided string)
  if (!password || typeof password !== 'string' || password.trim() === '') {
    return res.status(400).json({ success: false, message: "Please enter the album password to save your memories!" });
  }

  const validPasswords = ['gunnu', 'mohit', 'akanksha', '1234', 'password', 'love', 'baby', 'arika'];
  const trimmed = password.trim().toLowerCase();

  if (!validPasswords.includes(trimmed)) {
    return res.status(401).json({ success: false, message: "Incorrect album password. Please try again." });
  }

  if (!Array.isArray(pages)) {
    return res.status(400).json({ success: false, message: "Invalid album pages data." });
  }

  // Parse any Google Drive photo links in pages
  const processedPages = pages.map(p => {
    if (p.image) {
      p.image = parseGoogleDriveUrl(p.image);
    }
    return p;
  });

  saveAlbumPages(processedPages);

  res.json({
    success: true,
    message: "Memories saved safely to album! ❤️",
    pages: processedPages
  });
});

module.exports = router;

