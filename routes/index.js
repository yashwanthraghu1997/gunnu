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
  if (!urlStr) return null;
  let fileId = null;
  
  // Match /d/FILE_ID/
  const matchD = urlStr.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) {
    fileId = matchD[1];
  } else {
    // Match id=FILE_ID
    const matchId = urlStr.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId && matchId[1]) {
      fileId = matchId[1];
    }
  }

  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return urlStr; // Return unchanged if direct URL
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

// 6. POST API Route: Update Photo per Month ID from Google Drive URL
router.post('/api/photo/month', (req, res) => {
  const { monthId, photoUrl, driveUrl } = req.body;
  const rawUrl = driveUrl || photoUrl;

  if (!monthId || !rawUrl) {
    return res.status(400).json({ success: false, message: "Missing monthId or Drive URL" });
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

module.exports = router;
