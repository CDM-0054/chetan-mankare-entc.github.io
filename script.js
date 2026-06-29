// ─── ADMIN MODE ───
const ADMIN_PASSWORD = 'chetan123';
let isAdmin = localStorage.getItem('isAdmin') === 'true';

// ─── SUBJECT DATA ───
const subjectsData = [
  {
    code: 'ET31201',
    name: 'Electrical Circuits and Networks',
    chapters: ['Laws and Definition', 'Mesh and Nodal Analysis', 'Network Theorems', 'Two Port Network', 'Resonant Circuit', 'Filter and Attenuator']
  },
  {
    code: 'ET31203',
    name: 'Principles of Electronic Communication',
    chapters: ['Basics of Electronic Communication', 'AM and FM Modulation', 'Transmitters and Receivers', 'Wave Propagation', 'Antennas']
  },
  {
    code: 'ET31204',
    name: 'Linear Integrated Circuits',
    chapters: ['Fundamentals of Op-Amp', 'Op-Amp Configuration', 'Linear Application of Op-Amp', 'Filters and Oscillators', 'Timers']
  },
  {
    code: 'ET31206',
    name: 'Digital Techniques',
    chapters: ['Number System and Codes', 'Logic Gates and Logic Families', 'Combinational Logic Circuits', 'Sequential Logic Circuits', 'Converters and Memories']
  },
  {
    code: 'ET51201',
    name: 'Python Programming',
    chapters: ['Fundamentals of Python', 'Control Flow Statements', 'Data Structures in Python', 'File I/O Handling', 'Functions and Packages', 'Automation in Python']
  }
];

// ─── SHEETDB CONFIG ───
const API_URL = 'https://sheetdb.io/api/v1/0qetabo87bu71';
const USER_ID = 'chetan';
localStorage.setItem('userId', USER_ID);

console.log('👤 User ID:', USER_ID);
console.log('📊 Connected to SheetDB:', API_URL ? 'Yes' : 'No (using localStorage)');

// ─── GET PROGRESS ───
async function getProgress() {
  try {
    console.log('📊 Fetching progress from SheetDB...');
    
    // Check if API is available
    if (!API_URL || API_URL === 'https://sheetdb.io/api/v1/0qetabo87bu71') {
      console.warn('⚠️ Using localStorage (SheetDB not configured)');
      const local = localStorage.getItem('subjectProgress');
      return local ? JSON.parse(local) : getDefaultProgress();
    }
    
    // Fetch from SheetDB
    const response = await fetch(`${API_URL}?sheet=Sheet1`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📊 Data from SheetDB:', data);
    
    if (!data || data.length === 0) {
      console.warn('⚠️ No data found in SheetDB');
      return getDefaultProgress();
    }
    
    const progress = getDefaultProgress();
    data.forEach(row => {
      if (progress[row.SubjectCode]) {
        const index = parseInt(row.ChapterIndex);
        if (index < progress[row.SubjectCode].length) {
          progress[row.SubjectCode][index] = row.Status === 'TRUE' || row.Status === 'true';
        }
      }
    });
    
    // Save to localStorage as backup
    localStorage.setItem('subjectProgress', JSON.stringify(progress));
    console.log('✅ Progress loaded from SheetDB');
    return progress;
    
  } catch (error) {
    console.error('❌ Error fetching from SheetDB:', error);
    // Fallback to localStorage
    const local = localStorage.getItem('subjectProgress');
    if (local) {
      console.log('📊 Using localStorage backup');
      return JSON.parse(local);
    }
    return getDefaultProgress();
  }
}

function getDefaultProgress() {
  const progress = {};
  subjectsData.forEach(sub => {
    progress[sub.code] = sub.chapters.map(() => false);
  });
  return progress;
}

// ─── SAVE PROGRESS ───
async function saveProgress(progress) {
  localStorage.setItem('subjectProgress', JSON.stringify(progress));
  if (!API_URL || API_URL === 'https://sheetdb.io/api/v1/0qetabo87bu71') return;
  try {
    await fetch(`${API_URL}/UserID/${USER_ID}`, { method: 'DELETE' });
    const records = [];
    Object.keys(progress).forEach(code => {
      progress[code].forEach((status, index) => {
        records.push({ UserID: USER_ID, SubjectCode: code, ChapterIndex: index, Status: status ? 'TRUE' : 'FALSE' });
      });
    });
    await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(records) });
    updateSyncStatus(true);
  } catch(e) { updateSyncStatus(false); }
}

// ─── CHECK ADMIN ───
function checkAdmin() {
  const badge = document.querySelector('.admin-badge .dot');
  const text = document.querySelector('.admin-badge .status');
  if (isAdmin) {
    if (badge) badge.classList.add('active');
    if (text) text.textContent = 'Admin Mode';
    document.querySelectorAll('.chapter').forEach(el => { el.style.pointerEvents = 'auto'; el.style.opacity = '1'; });
    document.querySelectorAll('.subject-card').forEach(el => { el.style.cursor = 'pointer'; });
  } else {
    if (badge) badge.classList.remove('active');
    if (text) text.textContent = 'View Only';
    document.querySelectorAll('.chapter').forEach(el => { el.style.pointerEvents = 'none'; el.style.opacity = '0.7'; });
    document.querySelectorAll('.subject-card').forEach(el => { el.style.cursor = 'default'; });
    document.querySelectorAll('.checkbox').forEach(el => { el.style.cursor = 'default'; });
  }
}

// ─── ADMIN UI ───
function showAdminPrompt() {
  document.getElementById('adminPrompt').classList.add('show');
  document.getElementById('adminInput').value = '';
  document.getElementById('adminInput').focus();
  document.getElementById('adminError').textContent = '';
}
function hideAdminPrompt() {
  document.getElementById('adminPrompt').classList.remove('show');
}
function adminLogin() {
  const input = document.getElementById('adminInput');
  const error = document.getElementById('adminError');
  if (input.value === ADMIN_PASSWORD) {
    isAdmin = true;
    localStorage.setItem('isAdmin', 'true');
    hideAdminPrompt();
    checkAdmin();
    renderSubjects();
    console.log('🔐 Admin mode activated!');
  } else {
    error.textContent = '❌ Incorrect password. Try again.';
    input.value = '';
    input.focus();
  }
}
function adminLogout() {
  if (confirm('Logout from admin mode?')) {
    isAdmin = false;
    localStorage.setItem('isAdmin', 'false');
    checkAdmin();
    renderSubjects();
    console.log('🔒 Admin mode deactivated.');
  }
}
function toggleAdmin() { isAdmin ? adminLogout() : showAdminPrompt(); }

// ─── RENDER SUBJECT CARDS ───
async function renderSubjects() {
  const container = document.getElementById('subjectsContainer');
  if (!container) return;
  const progress = await getProgress();
  
  container.innerHTML = subjectsData.map((sub) => {
    const subProgress = progress[sub.code] || sub.chapters.map(() => false);
    const done = subProgress.filter(Boolean).length;
    const total = sub.chapters.length;
    const pct = Math.round((done / total) * 100);
    const dots = subProgress.map(status => `<span class="dot ${status ? 'done' : ''}"></span>`).join('');
    
    return `
      <a href="subjects/${sub.code.toLowerCase()}.html" class="subject-card-link">
        <div class="subject-card">
          <div class="subject-card-header">
            <span class="code">${sub.code}</span>
            <span class="name">${sub.name}</span>
          </div>
          <div class="subject-card-body">
            <div class="progress-row">
              <span class="label">Progress</span>
              <span class="pct">${pct}%</span>
            </div>
            <div class="mini-bar"><div class="fill" style="width: ${pct}%;"></div></div>
            <div class="chapters-preview">${dots}</div>
          </div>
          <div class="subject-card-footer">
            <span class="chapters-count">${done}/${total} chapters</span>
            <span class="view-link">View Details →</span>
          </div>
        </div>
      </a>
    `;
  }).join('');
  
  await updateGraph(progress);
  checkAdmin();
}

// ─── UPDATE GRAPH ───
async function updateGraph(progress) {
  const graph = document.getElementById('progressGraph');
  const totalDoneEl = document.getElementById('totalChaptersDone');
  const totalEl = document.getElementById('totalChapters');
  const overallEl = document.getElementById('overallProgress');
  if (!graph) return;
  
  let totalDone = 0, totalChapters = 0;
  const bars = subjectsData.map(sub => {
    const subProgress = progress[sub.code] || sub.chapters.map(() => false);
    const done = subProgress.filter(Boolean).length;
    const total = sub.chapters.length;
    totalDone += done;
    totalChapters += total;
    return { done, total, pct: Math.round((done / total) * 100), name: sub.name };
  });
  
  graph.innerHTML = bars.map(bar => `
    <div class="progress-bar-item" title="${bar.name}: ${bar.pct}%">
      <div class="bar" style="height: ${Math.max(bar.pct, 2)}%;">
        <div class="fill" style="height: ${bar.pct}%;"></div>
      </div>
      <span class="label">${bar.pct}%</span>
    </div>
  `).join('');
  
  if (totalDoneEl) totalDoneEl.textContent = totalDone;
  if (totalEl) totalEl.textContent = totalChapters;
  if (overallEl) overallEl.textContent = Math.round((totalDone / totalChapters) * 100) || 0;
}

// ─── ADMIN UI ELEMENTS ───
function addAdminUI() {
  const prompt = document.createElement('div');
  prompt.className = 'admin-prompt';
  prompt.id = 'adminPrompt';
  prompt.innerHTML = `
    <h2>🔐 Admin Access</h2>
    <p>Enter the admin password to enable editing</p>
    <input type="password" id="adminInput" placeholder="Enter password...">
    <div class="error" id="adminError"></div>
    <div class="btn-group">
      <button class="btn-admin primary" onclick="adminLogin()">Unlock</button>
      <button class="btn-admin secondary" onclick="hideAdminPrompt()">Cancel</button>
    </div>
  `;
  document.body.appendChild(prompt);
  
  const badge = document.createElement('div');
  badge.className = 'admin-badge';
  badge.onclick = toggleAdmin;
  badge.innerHTML = `
    <span class="dot ${isAdmin ? 'active' : ''}"></span>
    <span class="status">${isAdmin ? 'Admin Mode' : 'View Only'}</span>
    <span style="font-size:0.5rem;opacity:0.5;">${isAdmin ? '🔓' : '🔒'}</span>
  `;
  document.body.appendChild(badge);
}

// ─── SYNC STATUS ───
let syncStatusEl = null;
function createSyncStatus() {
  if (document.querySelector('.sync-status')) return;
  const status = document.createElement('div');
  status.className = 'sync-status';
  status.style.cssText = `
    position: fixed; bottom: 80px; right: 20px;
    background: rgba(13,18,36,0.8);
    backdrop-filter: blur(8px);
    padding: 8px 14px;
    border-radius: 20px;
    border: 1px solid var(--border);
    font-family: var(--font-mono);
    font-size: 0.6rem;
    color: var(--muted);
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s;
  `;
  status.innerHTML = `
    <span class="sync-dot" style="color: var(--neon);">●</span>
    <span class="sync-text">Cloud Sync ${API_URL && API_URL !== 'https://sheetdb.io/api/v1/0qetabo87bu71' ? 'Active' : 'Offline'}</span>
  `;
  document.body.appendChild(status);
  syncStatusEl = status;
}
function updateSyncStatus(ok) {
  if (!syncStatusEl) return;
  const dot = syncStatusEl.querySelector('.sync-dot');
  const text = syncStatusEl.querySelector('.sync-text');
  if (ok) {
    dot.style.color = 'var(--neon)';
    text.textContent = '✅ Synced';
    syncStatusEl.style.borderColor = 'rgba(0,245,196,0.3)';
  } else {
    dot.style.color = 'var(--neon3)';
    text.textContent = '⚠️ Offline';
    syncStatusEl.style.borderColor = 'rgba(255,58,110,0.3)';
  }
}

// ─── KEYBOARD SHORTCUTS ───
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && document.getElementById('adminPrompt').classList.contains('show')) adminLogin();
  if (e.key === 'Escape' && document.getElementById('adminPrompt').classList.contains('show')) hideAdminPrompt();
});

// ─── STARFIELD ───
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let W, H, stars = [];
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
resize(); window.addEventListener('resize', resize);
for (let i = 0; i < 180; i++) {
  stars.push({ x: Math.random() * 2000, y: Math.random() * 2000, r: Math.random() * 1.2 + .3, a: Math.random(), s: Math.random() * .3 + .05 });
}
function drawStars() {
  ctx.clearRect(0, 0, W, H);
  stars.forEach(s => {
    s.a += s.s * .005;
    const alpha = .3 + .5 * Math.abs(Math.sin(s.a));
    ctx.beginPath();
    ctx.arc(s.x % W, s.y % H, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180, 220, 255, ${alpha})`;
    ctx.fill();
  });
  requestAnimationFrame(drawStars);
}
drawStars();

// ─── TYPED TEXT ───
const phrases = ['Turning hobby into profession', 'Never stop learning', 'ENTC Diploma Student', 'Embedded Systems Enthusiast', 'Learning everyday'];
let pi = 0, ci = 0, deleting = false;
const el = document.getElementById('typed-text');
function type() {
  const phrase = phrases[pi];
  if (!deleting) {
    el.textContent = phrase.slice(0, ++ci);
    if (ci === phrase.length) { deleting = true; return setTimeout(type, 1800); }
  } else {
    el.textContent = phrase.slice(0, --ci);
    if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
  }
  setTimeout(type, deleting ? 45 : 75);
}
type();

// ─── HAMBURGER MENU ───
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const body = document.body;
if (hamburger && navLinks) {
  hamburger.addEventListener('click', function(e) {
    e.stopPropagation();
    this.classList.toggle('active');
    navLinks.classList.toggle('open');
    body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
      body.style.overflow = '';
    });
  });
  document.addEventListener('click', function(e) {
    if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !hamburger.contains(e.target)) {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
      body.style.overflow = '';
    }
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
      body.style.overflow = '';
    }
  });
}

// ─── DYNAMIC GREETING ───
function updateGreeting() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = document.querySelector('.greeting');
  if (!greeting) return;
  let msg = '';
  if (hour < 6) msg = '🌙 Late Night Learning!';
  else if (hour < 12) msg = '🌅 Good Morning! Ready to learn?';
  else if (hour < 17) msg = '☀️ Good Afternoon! Stay curious!';
  else if (hour < 21) msg = '🌇 Good Evening! Keep building!';
  else msg = '🌙 Good Night! Rest and recharge!';
  greeting.textContent = msg;
}
updateGreeting();
setInterval(updateGreeting, 60000);

// ─── PROGRESS BAR ───
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progressBar = document.querySelector('.progress-bar');
  if (progressBar) progressBar.style.width = ((scrollTop / docHeight) * 100) + '%';
});

// ─── BACK TO TOP ───
const backButton = document.getElementById('backToTop');
if (backButton) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) { backButton.style.display = 'flex'; backButton.style.opacity = '1'; }
    else { backButton.style.opacity = '0'; setTimeout(() => { if (window.scrollY <= 400) backButton.style.display = 'none'; }, 300); }
  });
  backButton.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
}

// ─── CURSOR TRAIL ───
if (window.innerWidth >= 768) {
  let trailTimeout;
  document.addEventListener('mousemove', function(e) {
    if (trailTimeout) return;
    trailTimeout = setTimeout(() => {
      const trail = document.createElement('div');
      trail.className = 'cursor-trail';
      trail.style.left = e.pageX + 'px';
      trail.style.top = e.pageY + 'px';
      document.body.appendChild(trail);
      setTimeout(() => trail.remove(), 800);
      trailTimeout = null;
    }, 50);
  });
}

// ─── SKILL BAR ANIMATION ───
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.skill-bar-fill').forEach(bar => bar.classList.add('animate'));
      e.target.querySelectorAll('.reveal').forEach(r => r.classList.add('visible'));
    }
  });
}, { threshold: .15 });
document.querySelectorAll('section').forEach(s => observer.observe(s));
document.querySelectorAll('.reveal').forEach(el => {
  new IntersectionObserver(([e]) => { if (e.isIntersecting) e.target.classList.add('visible'); }, { threshold: .12 }).observe(el);
});

// ─── DYNAMIC FOOTER ───
function updateFooter() {
  const yearSpan = document.querySelector('.current-year');
  const updateSpan = document.querySelector('.last-updated');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();
  if (updateSpan) {
    const now = new Date();
    updateSpan.textContent = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
updateFooter();

// ─── ACTIVE NAV LINK ───
const sections = document.querySelectorAll('section');
const navItems = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => { if (window.scrollY >= section.offsetTop - 120) current = section.getAttribute('id'); });
  navItems.forEach(link => { link.style.color = link.getAttribute('href') === `#${current}` ? 'var(--neon)' : ''; });
});

// ─── SMOOTH SCROLL ───
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - 70, behavior: 'smooth' });
    }
  });
});

// ─── VISIT COUNTER ───
function updateVisitCount() {
  let visits = localStorage.getItem('portfolioVisits');
  if (visits === null) visits = 0;
  visits = parseInt(visits) + 1;
  localStorage.setItem('portfolioVisits', visits);
  const counter = document.querySelector('.visit-counter');
  if (counter) counter.textContent = `👀 ${visits} visits`;
}
updateVisitCount();

// ─── SAVE NOTES TO GOOGLE SHEETS ───
async function saveNotes(subjectCode, chapterIndex, notes) {
  const progress = await getProgress();
  const noteKey = `notes_${subjectCode}_${chapterIndex}`;
  progress[noteKey] = notes;
  await saveProgress(progress);
  return true;
}

async function getNotes(subjectCode, chapterIndex) {
  const progress = await getProgress();
  const noteKey = `notes_${subjectCode}_${chapterIndex}`;
  return progress[noteKey] || '';
}

// ─── COPY CODE FUNCTION ───
function copyCode(button) {
  const codeBlock = button.closest('.code-section').querySelector('.code-body');
  const text = codeBlock.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const originalText = button.textContent;
    button.textContent = '✅ Copied!';
    setTimeout(() => button.textContent = originalText, 2000);
  }).catch(() => {
    const range = document.createRange();
    range.selectNode(codeBlock);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    const originalText = button.textContent;
    button.textContent = '✅ Copied!';
    setTimeout(() => button.textContent = originalText, 2000);
  });
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded', async () => {
  addAdminUI();
  createSyncStatus();
  await renderSubjects();
  checkAdmin();
  if (API_URL && API_URL !== 'https://sheetdb.io/api/v1/0qetabo87bu71') updateSyncStatus(true);
  console.log('📚 Subjects loaded! Click a card to view chapters.');
  console.log('🔐 Admin mode:', isAdmin ? 'ON' : 'OFF');
});

// ─── LOAD USERNAME ───
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('usernameInput');
  if (input) {
    input.value = localStorage.getItem('userId') || '';
    input.addEventListener('keydown', function(e) { if (e.key === 'Enter') changeUser(); });
  }
});

// ─── CONSOLE ───
console.log('%c🚀 Chetan Mankare - ENTC Portfolio', 'font-size: 20px; color: #00f5c4; font-weight: bold;');
console.log('%c📚 Track your semester progress with cloud sync!', 'font-size: 14px; color: #7b2fff;');
console.log('%c🔐 Click the "View Only" badge to unlock admin mode', 'font-size: 14px; color: #c8d8f0;');
console.log('✅ Portfolio fully loaded! 🚀');
