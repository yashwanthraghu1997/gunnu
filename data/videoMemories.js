// data/videoMemories.js - JSONBin Powered Data Helper Module for Baby Video Memories
const fs = require('fs');
const path = require('path');

const videoMemoriesPath = path.join(__dirname, 'videoMemories.json');
const jsonbinConfigPath = path.join(__dirname, 'jsonbinConfig.json');

function getJsonbinConfig() {
  let secretKey = process.env.JSONBIN_SECRET_KEY || '$2a$10$Eo1YVcMrHGgogTzSKqZuoOD1vjy.ISiYg2G9A4EkTJoelivpx5H6u';
  let binVideos = process.env.JSONBIN_BIN_VIDEOS || '6a80a6fbda38895dfee92c56';

  try {
    if (fs.existsSync(jsonbinConfigPath)) {
      const raw = fs.readFileSync(jsonbinConfigPath, 'utf8');
      const cfg = JSON.parse(raw);
      if (cfg.secretKey) secretKey = cfg.secretKey;
      if (cfg.binVideos) binVideos = cfg.binVideos;
    }
  } catch (e) {}

  return { secretKey, binVideos };
}

// Read local videoMemories.json
function getVideoMemoriesLocal() {
  try {
    if (fs.existsSync(videoMemoriesPath)) {
      const raw = fs.readFileSync(videoMemoriesPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return [parsed];
    }
  } catch (err) {
    console.error("Error reading local videoMemories.json:", err);
  }
  return [];
}

// Save local videoMemories.json
function saveVideoMemoriesLocal(memories) {
  try {
    fs.writeFileSync(videoMemoriesPath, JSON.stringify(memories, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing local videoMemories.json:", err);
  }
}

// Async loader: Strictly prioritize JSONBin API bin ID 6a80a6fbda38895dfee92c56
async function getVideoMemoriesAsync() {
  const cfg = getJsonbinConfig();
  if (cfg.secretKey && cfg.binVideos) {
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${cfg.binVideos}/latest`, {
        headers: { 'X-Master-Key': cfg.secretKey }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.record) {
          let list = [];
          if (Array.isArray(data.record)) {
            list = data.record;
          } else if (typeof data.record === 'object') {
            list = [data.record];
          }
          // Save a copy locally as cache
          saveVideoMemoriesLocal(list);
          return list;
        }
      } else {
        console.error(`JSONBin fetch status ${res.status} for bin ${cfg.binVideos}`);
      }
    } catch (err) {
      console.error("JSONBin video memories load error:", err);
    }
  }

  // Fall back to local file if fetch fails
  return getVideoMemoriesLocal();
}

// Async saver: Syncs changes back to JSONBin bin ID 6a80a6fbda38895dfee92c56
async function saveVideoMemoriesAsync(memories) {
  saveVideoMemoriesLocal(memories);
  const cfg = getJsonbinConfig();
  if (cfg.secretKey && cfg.binVideos) {
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${cfg.binVideos}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': cfg.secretKey
        },
        body: JSON.stringify(memories)
      });
      if (!res.ok) {
        console.error(`JSONBin save failed with status ${res.status}`);
      }
    } catch (err) {
      console.error("JSONBin video memories save error:", err);
    }
  }
}

module.exports = {
  getJsonbinConfig,
  getVideoMemoriesLocal,
  saveVideoMemoriesLocal,
  getVideoMemoriesAsync,
  saveVideoMemoriesAsync
};
