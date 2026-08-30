// =================================================================
// 📌 LISTE DES PROGRAMMES DE BASE (Gullstalgie)
// =================================================================
const MES_LIENS = [
    { id: "oggy", title: "Oggy et les Cafards - Compil", url: "https://www.youtube.com/watch?v=d0b4rOQYA3s", duration: 1619 },
    { id: "zig1", title: "Zig et Sharko - Compil 1", url: "https://www.youtube.com/watch?v=PQwwHx-oMLQ", duration: 1320 },
    { id: "zig2", title: "Zig et Sharko - Compil 2", url: "https://youtu.be/Tth57ZeRT2M", duration: 862 },
    { id: "spies", title: "Totally Spies - Compil", url: "https://www.youtube.com/watch?v=5gWKb_cvjgo", duration: 1328 },
    { id: "foot1", title: "Foot de Rue - Compil 1", url: "https://www.youtube.com/watch?v=OalJZhbmO8E", duration: 1448 },
    { id: "foot2", title: "Foot de Rue - Compil 2", url: "https://www.youtube.com/watch?v=uujM_Tj5j7Y", duration: 1305 },
    { id: "dalton", title: "Les Dalton - Compil", url: "https://www.youtube.com/watch?v=gwJkgB9pIbo", duration: 2358 },
    { id: "mbc1", title: "Monster Buster Club - Compil 1", url: "https://www.youtube.com/watch?v=w6rJSEjLslE", duration: 1906 },
    { id: "mbc2", title: "Monster Buster Club - Compil 2", url: "https://www.youtube.com/watch?v=kM4rUc6Pcr8", duration: 1306 }
];

const PROGRAMME_NUIT = {
    title: "Gullstalgie S'endort (La nuit)",
    url: "https://www.youtube.com/watch?v=-yuoDTFEat8",
    duration: 28800
};

const state = {
  started: false,
  adminOverride: null,
  ytPlayer: null,
  currentMediaUrl: null
};

const refs = {
  startScreen: document.getElementById("start-screen"),
  startButton: document.getElementById("start-button"),
  mediaStage: document.getElementById("media-stage"),
  clock: document.getElementById("clock")
};

let ytApiReady = false;
let ytApiLoading = false;
const pendingYtCallbacks = [];

function loadYouTubeApi(callback) {
  if (ytApiReady && window.YT && window.YT.Player) {
    callback();
    return;
  }
  pendingYtCallbacks.push(callback);
  if (ytApiLoading) return;
  ytApiLoading = true;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function () {
  ytApiReady = true;
  pendingYtCallbacks.forEach((cb) => cb());
  pendingYtCallbacks.length = 0;
};

function detectMediaType(url) {
  const normalized = String(url || "").trim().toLowerCase();
  if (!normalized) return "unknown";
  if (normalized.includes("archive.org")) return "archive";
  if (normalized.includes("youtube.com") || normalized.includes("youtu.be")) return "youtube";
  return "unknown";
}

function extractYoutubeId(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace(/^\//, "").split(/[/?#]/)[0];
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.searchParams.get("v")) return parsed.searchParams.get("v");
      const match = parsed.pathname.match(/\/(?:embed|shorts|live)\/([^/?#]+)/i);
      if (match) return match[1];
    }
  } catch (e) {}
  const match = String(url).match(/(?:v=|\/)([A-Za-z0-9_-]{11})(?:[?#&]|$)/);
  return match ? match[1] : "";
}

function formatClock(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getDaySeed() {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function pseudoRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function buildDayQueue() {
  const seed = getDaySeed();
  let pool = [...MES_LIENS];
  
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom(seed + i) * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  for (let i = 0; i < pool.length - 1; i++) {
    if (pool[i].id === pool[i+1].id) {
      for (let k = i + 2; k < pool.length; k++) {
        if (pool[k].id !== pool[i].id) {
          [pool[i+1], pool[k]] = [pool[k], pool[i+1]];
          break;
        }
      }
    }
  }

  const finalQueue = [];
  pool.forEach((item, index) => {
    finalQueue.push({ title: "Jingle Gullstalgie Présente", url: "https://www.youtube.com/watch?v=U8A3A0LpniM", duration: 7 });
    finalQueue.push(item);
    finalQueue.push({ title: "Jingle Pub", url: "https://www.youtube.com/watch?v=YSks9u1s7rw", duration: 6 });
    
    if (index % 2 === 0) {
      finalQueue.push({ title: "Pub P'tit Filou Tub's", url: "https://www.youtube.com/watch?v=YhcQvxoq0O0", duration: 16 });
    } else {
      finalQueue.push({ title: "Pub Miel Pops", url: "https://www.youtube.com/watch?v=dgXkrRkFZ18", duration: 35 });
    }
  });

  return finalQueue;
}

function getCurrentMinutes() {
  if (state.adminOverride) {
    const [hours, minutes] = state.adminOverride.split(":").map(Number);
    return hours * 60 + minutes;
  }
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function computeMode(currentMins) {
  const nightStart = 22 * 60;
  const morningStart = 6 * 60;
  return (currentMins >= nightStart || currentMins < morningStart) ? "night" : "day";
}

function getActiveMediaForCurrentTime() {
  const queue = buildDayQueue();
  const currentMins = getCurrentMinutes();
  const mode = computeMode(currentMins);

  const now = new Date();
  const secondsSinceMidnight = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();

  if (mode === "night") {
    const seekOffset = secondsSinceMidnight % PROGRAMME_NUIT.duration;
    return { media: PROGRAMME_NUIT, seekOffset };
  }

  const totalPlaylistDuration = queue.reduce((acc, m) => acc + m.duration, 0) || 3600;
  const elapsedSecondsTotal = secondsSinceMidnight % totalPlaylistDuration;

  let accumulated = 0;
  let activeMedia = queue[0];
  let seekOffset = 0;

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    if (elapsedSecondsTotal >= accumulated && elapsedSecondsTotal < accumulated + item.duration) {
      activeMedia = item;
      seekOffset = elapsedSecondsTotal - accumulated;
      break;
    }
    accumulated += item.duration;
  }

  return { media: activeMedia, seekOffset };
}

function destroyCurrentYtPlayer() {
  if (state.ytPlayer) {
    try { state.ytPlayer.destroy(); } catch (e) {}
    state.ytPlayer = null;
  }
}

function handleMediaEnded() {
  updateDirectSync();
}

function renderMediaSync(media, seekOffset) {
  if (state.currentMediaUrl === media.url && state.ytPlayer) {
    try {
      const currentTime = state.ytPlayer.getCurrentTime();
      if (Math.abs(currentTime - seekOffset) > 10) {
        state.ytPlayer.seekTo(seekOffset, true);
      }
    } catch (e) {}
    return;
  }

  state.currentMediaUrl = media.url;

  destroyCurrentYtPlayer();
  refs.mediaStage.innerHTML = "";

  const type = detectMediaType(media.url);
  const slotId = `yt-player-slot-${Date.now()}`;

  if (type === "youtube") {
    const ytId = extractYoutubeId(media.url);
    const container = document.createElement("div");
    container.id = slotId;
    container.style.cssText = "width:100%;height:100%;position:relative;";
    
    const fallbackBtn = document.createElement("button");
    fallbackBtn.textContent = "▶ Cliquer ici si la vidéo est bloquée";
    fallbackBtn.style.cssText = "position:absolute; bottom:20px; left:50%; transform:translateX(-50%); z-index:99; background:#e74c3c; color:white; border:none; padding:10px 20px; border-radius:5px; font-weight:bold; cursor:pointer; display:none;";
    
    refs.mediaStage.appendChild(container);
    refs.mediaStage.appendChild(fallbackBtn);

    const safetyTimer = setTimeout(() => {
      if (fallbackBtn) fallbackBtn.style.display = "block";
    }, 3000);

    fallbackBtn.onclick = () => {
      if (state.ytPlayer && typeof state.ytPlayer.playVideo === "function") {
        state.ytPlayer.playVideo();
        fallbackBtn.style.display = "none";
      }
    };

    loadYouTubeApi(() => {
      state.ytPlayer = new YT.Player(slotId, {
        videoId: ytId,
        playerVars: { 
          autoplay: 1, 
          controls: 0, 
          disablekb: 1, 
          fs: 0, 
          modestbranding: 1, 
          playsinline: 1, 
          rel: 0,
          cc_load_policy: 0,
          hl: 'fr',
          start: Math.floor(seekOffset)
        },
        events: {
          onReady: (e) => {
            clearTimeout(safetyTimer);
            e.target.setPlaybackQuality('hd1080');
            e.target.seekTo(seekOffset, true);
            e.target.playVideo();
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              clearTimeout(safetyTimer);
              e.target.setPlaybackQuality('hd1080');
              fallbackBtn.style.display = "none";
            }
            if (e.data === YT.PlayerState.ENDED) {
              handleMediaEnded();
            }
          }
        }
      });
    });
  } else {
    const ytId = extractYoutubeId(media.url);
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&controls=0&disablekb=1&cc_load_policy=0&vq=hd1080&start=${Math.floor(seekOffset)}`;
    iframe.style.cssText = "width:100%;height:100%;border:0;";
    refs.mediaStage.appendChild(iframe);
  }
}

function updateDirectSync() {
  const displayTime = state.adminOverride ? state.adminOverride : formatClock(new Date());
  if (refs.clock) refs.clock.textContent = displayTime;
  if (!state.started) return;

  const { media, seekOffset } = getActiveMediaForCurrentTime();
  
  if (state.currentMediaUrl !== media.url || !state.ytPlayer) {
    renderMediaSync(media, seekOffset);
  }
}

function startProgram() {
  if (!state.started) {
    state.started = true;
    if (refs.startScreen) refs.startScreen.classList.add("hidden");
  }
  updateDirectSync();
}

function init() {
  refs.startButton?.addEventListener("click", startProgram);
  updateDirectSync();
  setInterval(updateDirectSync, 1000); 
}

window.addEventListener("DOMContentLoaded", init);
