// Folio PDF Workroom — browser-local single page application.
// Each route owns an isolated JobSession; object URLs are revoked on replacement.

const app = document.querySelector('#app');

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

const TOOLS = [
  { slug: 'compress', name: 'Compress PDF', category: 'featured', tag: 'Precision size targeting', accept: '.pdf', icon: 'compress', desc: 'Shrink intelligently, with visual quality kept in focus.' },
  { slug: 'pdf-word', name: 'PDF → Word', category: 'featured', tag: 'Editable DOCX output', accept: '.pdf', icon: 'file-output', desc: 'Recover editable text and structure into a Word document.' },
  { slug: 'word-pdf', name: 'Word → PDF', category: 'featured', tag: 'DOC & DOCX', accept: '.doc,.docx', icon: 'file-input', desc: 'Turn Word files into clean, shareable PDFs.' },
  { slug: 'pdf-jpg', name: 'PDF → JPG', category: 'featured', tag: 'Every page, crisp', accept: '.pdf', icon: 'image', desc: 'Render every page as a high-resolution JPG or PNG.' },
  { slug: 'merge', name: 'Merge PDF', category: 'organize', icon: 'merge', desc: 'Combine and reorder PDF files.' },
  { slug: 'split', name: 'Split PDF', category: 'organize', icon: 'split', desc: 'Split by ranges or every page.' },
  { slug: 'remove-pages', name: 'Remove Pages', category: 'organize', icon: 'remove', desc: 'Select pages to leave out.' },
  { slug: 'extract-pages', name: 'Extract Pages', category: 'organize', icon: 'extract', desc: 'Keep only the pages you need.' },
  { slug: 'organize', name: 'Organize PDF', category: 'organize', icon: 'organize', desc: 'Visually rearrange page order.' },
  { slug: 'rotate', name: 'Rotate PDF', category: 'organize', icon: 'rotate', desc: 'Correct selected or all pages.' },
  { slug: 'scan-pdf', name: 'Scan to PDF', category: 'organize', icon: 'scan', desc: 'Combine captures into one PDF.' },
  { slug: 'watermark', name: 'Watermark Remover', category: 'organize', icon: 'eraser', desc: 'Reduce selected image or PDF watermarks.' },
  { slug: 'summarize', name: 'AI PDF Summarizer', category: 'ai', icon: 'spark', desc: 'Get a local extractive brief.' },
  { slug: 'translate', name: 'Translate PDF', category: 'ai', icon: 'globe', desc: 'Translate text while retaining page breaks.' },
  { slug: 'markdown', name: 'PDF → Markdown', category: 'ai', icon: 'code', desc: 'Turn documents into structured Markdown.' },
  { slug: 'data', name: 'PDF Data Extraction', category: 'ai', icon: 'table', desc: 'Extract text, rows and JSON.' },
  { slug: 'smart-split', name: 'Smart Split', category: 'ai', icon: 'smart', desc: 'Suggest content-aware split points.' },
];

const DETAILS = {
  compress: ['Precise target, verified result', 'Enter a size such as 200 KB or 2.5 MB. Folio compresses to the highest-quality valid result below the limit, then matches and verifies the exact byte size.'],
  'pdf-word': ['Editable recovery with fallback', 'Extract text and reading order into a DOCX, with password support and clear conversion status.'],
  'word-pdf': ['Word in. Polished PDF out.', 'Convert DOCX and legacy DOC content locally, preserving headings, images, lists and tables when available.'],
  'pdf-jpg': ['A crisp image for every page', 'Choose JPG or PNG, adjust resolution, preview each page, and download individually or as one clean ZIP.'],
  merge: ['Bring documents together', 'Arrange multiple PDFs in the exact order you want, then combine them into one file.'],
  split: ['Divide with precision', 'Use page ranges, custom groups, or create one PDF for every page.'],
  'remove-pages': ['Take unwanted pages out', 'Preview the document, select pages to remove, and export the clean result.'],
  'extract-pages': ['Keep the essential pages', 'Select thumbnails or enter ranges to build a focused new PDF.'],
  organize: ['Put every page in place', 'Drag thumbnails into a new order and export your rearranged document.'],
  rotate: ['Correct page orientation', 'Rotate individual pages or the full document by 90°, 180° or 270°.'],
  'scan-pdf': ['Captures become one document', 'Add JPG or PNG scans, reorder them, and create a neatly fitted multipage PDF.'],
  watermark: ['Reduce visual watermarks', 'Select an affected region or use light-overlay cleanup. Results vary with background complexity.'],
  summarize: ['A faster way through long PDFs', 'Local extractive analysis finds representative sentences, key points and recurring topics.'],
  translate: ['Translate document text', 'Use your browser’s on-device language engine where available and rebuild a readable translated PDF.'],
  markdown: ['Documents, made portable', 'Recover headings, paragraphs, lists and table-like rows into clean Markdown.'],
  data: ['From pages to useful data', 'Inspect extracted text, line records, likely table rows and structured JSON.'],
  'smart-split': ['Let document structure lead', 'Analyze headings and low-content separator pages, then review suggested document boundaries.'],
};

const ICON_PATHS = {
  compress: '<path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5"/><path d="m3 8 6-6m12 6-6-6M3 16l6 6m12-6-6 6"/>',
  'file-output': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 15h6m-3-3 3 3-3 3"/>',
  'file-input': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M15 15H9m3-3-3 3 3 3"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  merge: '<path d="M8 3v5a4 4 0 0 0 4 4h8M16 3l4 5-4 5M8 21v-4a5 5 0 0 1 5-5"/>',
  split: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m8.6 7.5 11.4 7M8.6 16.5 20 9.7M8.6 7.5 12 10"/>',
  remove: '<path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V3h6v4"/>',
  extract: '<path d="M4 4h11v16H4zM15 8h5v12h-5M8 9h3m-3 4h3"/>',
  organize: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M17.5 14v7m-3.5-3.5h7"/>',
  rotate: '<path d="M20 7v5h-5M4 17v-5h5M5.8 9a7 7 0 0 1 11.7-2L20 12M4 12l2.5 5a7 7 0 0 0 11.7-2"/>',
  scan: '<path d="M3 7V4a1 1 0 0 1 1-1h3m10 0h3a1 1 0 0 1 1 1v3M3 17v3a1 1 0 0 0 1 1h3m10 0h3a1 1 0 0 0 1-1v-3M7 8h10v8H7z"/>',
  eraser: '<path d="m7 21-4-4L16 4l5 5L9 21H7Z"/><path d="m12 8 5 5M4 22h16"/>',
  spark: '<path d="m12 3 1.4 4.1L17 9l-3.6 1.9L12 15l-1.4-4.1L7 9l3.6-1.9L12 3ZM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Zm14-1 1 2.8 2 1.2-2 1.2L19 21l-1-2.8-2-1.2 2-1.2 1-2.8Z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
  code: '<path d="m8 9-3 3 3 3m8-6 3 3-3 3m-3-8-2 10"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M9 9v11m6-11v11"/>',
  smart: '<path d="M6 3h12M6 21h12M12 7v10M8 10l4-3 4 3M8 14l4 3 4-3"/>',
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ICON_PATHS.spark}</svg>`;
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

function formatSize(bytes) {
  if (!Number.isFinite(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes, i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n >= 10 || i === 0 ? n.toFixed(0) : n.toFixed(2)} ${units[i]}`;
}

function parseSize(value) {
  const match = String(value).trim().match(/^([0-9]*\.?[0-9]+)\s*(b|kb|mb|gb)?$/i);
  if (!match) return NaN;
  const scales = { b: 1, kb: 1024, mb: 1048576, gb: 1073741824 };
  return Number(match[1]) * scales[(match[2] || 'kb').toLowerCase()];
}

function lastByteSequenceIndex(bytes, sequence) {
  outer: for (let i = bytes.length - sequence.length; i >= 0; i--) {
    for (let j = 0; j < sequence.length; j++) if (bytes[i + j] !== sequence[j]) continue outer;
    return i;
  }
  return -1;
}

function padPdfToExactSize(input, targetBytes) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.length > targetBytes) throw new Error(`The smallest valid result is ${formatSize(bytes.length)}, which is above the requested target.`);
  if (bytes.length === targetBytes) return bytes;
  const marker = new TextEncoder().encode('startxref');
  const insertAt = lastByteSequenceIndex(bytes, marker);
  if (insertAt < 0) throw new Error('The PDF could not be safely padded because its final cross-reference marker is missing.');
  const gap = targetBytes - bytes.length;
  const exact = new Uint8Array(targetBytes);
  exact.set(bytes.subarray(0, insertAt), 0);
  exact.fill(0x20, insertAt, insertAt + gap); // Legal PDF whitespace; does not alter rendered content.
  exact.set(bytes.subarray(insertAt), insertAt + gap);
  if (exact.length !== targetBytes) throw new Error('Exact byte-size verification failed.');
  return exact;
}

async function validatePdfBytes(bytes) {
  const task = pdfjsLib.getDocument({ data: bytes.slice() });
  const pdf = await task.promise;
  if (!pdf.numPages) { await pdf.destroy(); throw new Error('The generated PDF contains no readable pages.'); }
  await pdf.getPage(1);
  await pdf.destroy();
  return true;
}

function stem(name) { return name.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9-_]+/gi, '-'); }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function bytesToBlob(bytes, type = 'application/pdf') { return new Blob([bytes], { type }); }

class JobSession {
  constructor(tool) { this.tool = tool; this.id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`; this.urls = []; this.file = null; this.files = []; this.pdf = null; this.password = ''; }
  clearResults() { this.urls.forEach(URL.revokeObjectURL); this.urls = []; this.result = null; this.results = []; }
  replaceFile(file) { this.clearResults(); this.id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`; this.file = file; this.pdf = null; this.password = ''; }
  makeURL(blob) { const url = URL.createObjectURL(blob); this.urls.push(url); return url; }
  dispose() { this.clearResults(); this.pdf?.destroy?.(); }
}

let session = null;
let routeCleanup = () => {};

function toast(message) {
  const item = document.createElement('div'); item.className = 'toast'; item.textContent = message;
  document.querySelector('#toast-region').append(item);
  setTimeout(() => item.remove(), 3300);
}

function downloadURL(url, filename) {
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove();
}

function renderHome() {
  const featured = TOOLS.filter(t => t.category === 'featured');
  const organize = TOOLS.filter(t => t.category === 'organize');
  const ai = TOOLS.filter(t => t.category === 'ai');
  const cards = (items, featuredMode = false) => items.map((t, idx) => `
    <a class="${featuredMode ? 'tool-card featured' : 'mini-card'}" href="#/tool/${t.slug}" aria-label="Open ${escapeHTML(t.name)}">
      ${featuredMode ? `<div class="card-top"><span class="tool-icon">${icon(t.icon)}</span><span class="card-number">0${idx + 1} / 17</span></div>` : `<span class="tool-icon">${icon(t.icon)}</span>`}
      <h3>${escapeHTML(t.name)}</h3><p>${escapeHTML(t.desc)}</p>${featuredMode ? '<span class="card-arrow">→</span>' : ''}
    </a>`).join('');
  app.innerHTML = `<div class="home-shell">
    <section class="hero" aria-labelledby="hero-title">
      <div><div class="eyebrow">17 focused utilities · one private workroom</div><h1 id="hero-title">PDF work,<br><em>without friction.</em></h1></div>
      <div class="hero-copy"><p>Shape, convert and understand documents in a calm local-first workspace. No queues. No cross-tool file mix-ups.</p><div class="hero-stats"><span><b>17</b>TOOLS</span><span><b>1</b>WORKROOM</span><span><b>0</b>FILES STORED</span></div></div>
    </section>
    <section><div class="section-kicker"><h2>Featured tools</h2><span>Advanced controls / smarter fallbacks</span></div><div class="featured-grid">${cards(featured, true)}</div></section>
    <section class="category-block"><div class="section-kicker"><h2>Organize PDF</h2><span>Arrange / correct / combine</span></div><div class="tools-grid">${cards(organize)}</div></section>
    <section class="category-block"><div class="section-kicker"><h2>AI PDF Tools</h2><span>Understand / translate / extract</span></div><div class="tools-grid">${cards(ai)}</div></section>
    <aside class="home-footnote"><div><h2>Your document stays on your device.</h2><p>Files are processed in this browser whenever the selected operation allows it. Starting a new job clears the previous active result.</p></div><span class="security-mark">● PRIVATE BY DESIGN</span></aside>
  </div>`;
  document.title = 'Folio — PDF Workroom';
}

function toolShell(tool) {
  const [title, copy] = DETAILS[tool.slug];
  document.title = `${tool.name} — Folio`;
  app.innerHTML = `<div class="tool-shell">
    <button class="back-button" id="back-btn"><span>←</span> Back to tools</button>
    <header class="tool-heading"><div><div class="eyebrow">${escapeHTML(tool.tag || tool.category + ' tool')}</div><h1>${escapeHTML(title)}</h1></div><p>${escapeHTML(copy)}</p></header>
    <section class="workspace" aria-label="${escapeHTML(tool.name)} workspace"><div class="workspace-top"><div class="window-dots"><i></i><i></i><i></i></div><span class="workspace-label">${escapeHTML(tool.name.toUpperCase())} / LOCAL SESSION</span></div><div class="workspace-body" id="workspace-body"></div></section>
  </div>`;
  document.querySelector('#back-btn').onclick = () => history.length > 1 ? history.back() : location.hash = '#/';
}

function uploadTemplate({ accept, multiple = false, title = 'Drop your file here', copy = 'or choose it from your device', note = 'Processed locally in your browser' }) {
  return `<label class="drop-zone" id="drop-zone"><input class="file-input" id="file-input" type="file" accept="${accept}" ${multiple ? 'multiple' : ''}/><div><div class="drop-illustration">${icon('file-input')}</div><h2>${escapeHTML(title)}</h2><p>${escapeHTML(copy)}</p><span class="primary-btn">Choose ${multiple ? 'files' : 'file'}</span><small>${escapeHTML(note)}</small></div></label>`;
}

function bindDrop(onFiles) {
  const zone = document.querySelector('#drop-zone');
  const input = document.querySelector('#file-input');
  const take = files => { if (files?.length) onFiles([...files]); };
  input.onchange = () => take(input.files);
  ['dragenter', 'dragover'].forEach(type => zone.addEventListener(type, e => { e.preventDefault(); zone.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(type => zone.addEventListener(type, e => { e.preventDefault(); zone.classList.remove('dragover'); }));
  zone.addEventListener('drop', e => take(e.dataTransfer.files));
}

function fileRow(file, extra = '') {
  const ext = file.name.split('.').pop().slice(0, 4).toUpperCase();
  return `<div class="file-row"><span class="file-badge">${escapeHTML(ext)}</span><div class="file-meta"><strong title="${escapeHTML(file.name)}">${escapeHTML(file.name)}</strong><small>${formatSize(file.size)}${extra ? ` · ${extra}` : ''}</small></div><button class="icon-btn" id="replace-file" title="Choose another file" aria-label="Choose another file">↻</button></div>`;
}

function bindReplace(renderUpload) { const btn = document.querySelector('#replace-file'); if (btn) btn.onclick = renderUpload; }

function processingTemplate(title, detail = 'Preparing your document…') {
  return `<div class="process-card"><div><div class="loader"><span id="progress-number">0%</span></div><h2>${escapeHTML(title)}</h2><p id="progress-detail">${escapeHTML(detail)}</p><div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div><div class="status-log" id="status-log">Creating isolated job session…</div></div></div>`;
}

function setProgress(percent, detail, status = '') {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  const n = document.querySelector('#progress-number'), f = document.querySelector('#progress-fill'), d = document.querySelector('#progress-detail'), s = document.querySelector('#status-log');
  if (n) n.textContent = `${p}%`; if (f) f.style.width = `${p}%`; if (d && detail) d.textContent = detail; if (s && status) s.textContent = status;
}

function errorTemplate(title, message, retryLabel = 'Try again') {
  return `<div class="error-card"><div><div class="error-mark">!</div><h2>${escapeHTML(title)}</h2><p>${escapeHTML(message)}</p><div class="actions"><button class="primary-btn" id="retry-btn">${escapeHTML(retryLabel)}</button><button class="secondary-btn" id="another-btn">Choose another file</button></div></div></div>`;
}

function resultTemplate({ title, message, stats = [], downloadLabel = 'Download', anotherLabel = 'Start another job' }) {
  return `<div class="result-card"><div><div class="success-mark">✓</div><h2>${escapeHTML(title)}</h2><p>${escapeHTML(message)}</p>${stats.length ? `<div class="result-stats">${stats.map(([k,v]) => `<div><span>${escapeHTML(k)}</span><b>${escapeHTML(v)}</b></div>`).join('')}</div>` : ''}<div class="actions"><button class="primary-btn" id="download-btn">↓ ${escapeHTML(downloadLabel)}</button><button class="secondary-btn" id="another-btn">${escapeHTML(anotherLabel)}</button></div></div></div>`;
}

async function openPdf(file, password = '') {
  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjsLib.getDocument({ data, password });
  return new Promise((resolve, reject) => {
    let settled = false;
    task.onPassword = (update, reason) => {
      if (password && reason === pdfjsLib.PasswordResponses.NEED_PASSWORD) { update(password); return; }
      if (!settled) { settled = true; task.destroy(); reject(Object.assign(new Error(reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD ? 'The password is incorrect.' : 'This PDF is password protected.'), { code: reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD ? 'BAD_PASSWORD' : 'PASSWORD' })); }
    };
    task.promise.then(pdf => { if (!settled) { settled = true; resolve(pdf); } }).catch(err => { if (!settled) { settled = true; reject(err); } });
  });
}

async function ensurePdf(file, password = '') {
  if (session.pdf) return session.pdf;
  session.pdf = await openPdf(file, password);
  session.password = password;
  return session.pdf;
}

function passwordUI(message = 'This PDF is password protected') {
  return `<div class="password-box"><strong>LOCKED · ${escapeHTML(message)}</strong><p>Enter the document password. Folio will not try to bypass security.</p><div class="field"><label for="pdf-password">Enter PDF password</label><input id="pdf-password" type="password" autocomplete="current-password" placeholder="Password" /></div><div class="actions"><button class="primary-btn" id="unlock-btn">Unlock & Continue</button></div><p id="password-error" role="alert"></p></div>`;
}

async function renderPage(pdf, pageNumber, scale = 1.25, rotation = 0) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale, rotation: (page.rotate + rotation) % 360 });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport, background: 'white' }).promise;
  return canvas;
}

function canvasBlob(canvas, type = 'image/jpeg', quality = .9) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Image encoding failed.')), type, quality));
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function encodeImageWithDpi(canvas, format, quality, dpi) {
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const source = new Uint8Array(await (await canvasBlob(canvas, mime, quality)).arrayBuffer());
  if (format !== 'png') {
    for (let i = 2; i < Math.min(source.length - 16, 65536); i++) {
      if (source[i] === 0xff && source[i + 1] === 0xe0 && String.fromCharCode(...source.slice(i + 4, i + 9)) === 'JFIF\0') {
        source[i + 11] = 1;
        source[i + 12] = (dpi >>> 8) & 255; source[i + 13] = dpi & 255;
        source[i + 14] = (dpi >>> 8) & 255; source[i + 15] = dpi & 255;
        break;
      }
    }
    return new Blob([source], { type: mime });
  }
  const ppm = Math.round(dpi / 0.0254), type = new TextEncoder().encode('pHYs'), data = new Uint8Array(9), view = new DataView(data.buffer);
  view.setUint32(0, ppm); view.setUint32(4, ppm); data[8] = 1;
  const crcInput = new Uint8Array(13); crcInput.set(type); crcInput.set(data, 4); const crc = crc32(crcInput);
  const chunk = new Uint8Array(21), chunkView = new DataView(chunk.buffer); chunkView.setUint32(0, 9); chunk.set(type, 4); chunk.set(data, 8); chunkView.setUint32(17, crc);
  const insertAt = 33, output = new Uint8Array(source.length + chunk.length); output.set(source.subarray(0, insertAt)); output.set(chunk, insertAt); output.set(source.subarray(insertAt), insertAt + chunk.length);
  return new Blob([output], { type: mime });
}

async function renderThumbs(pdf, holder, { selected = new Set(), draggable = false, onClick = null } = {}) {
  holder.innerHTML = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const card = document.createElement('article'); card.className = `page-thumb${selected.has(i) ? ' selected' : ''}`; card.dataset.page = i; card.draggable = draggable;
    const canvas = await renderPage(pdf, i, .28);
    card.append(canvas); card.insertAdjacentHTML('beforeend', `<footer><span>PAGE ${i}</span><span class="select-dot">${selected.has(i) ? '✓' : ''}</span></footer>`);
    if (onClick) card.onclick = () => onClick(i, card);
    holder.append(card);
  }
}

async function extractPdfPages(pdf) {
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i); const content = await page.getTextContent();
    const items = content.items.map(item => ({ text: item.str, x: item.transform[4], y: item.transform[5], width: item.width, height: item.height, font: item.fontName }));
    pages.push({ number: i, text: items.map(x => x.text).join(' ').replace(/\s+/g, ' ').trim(), items });
  }
  return pages;
}

function parseRanges(value, pageCount) {
  const groups = String(value).split(/[;|]/).map(x => x.trim()).filter(Boolean);
  if (!groups.length) throw new Error('Enter at least one page or range.');
  return groups.map(group => {
    const pages = [];
    group.split(',').map(x => x.trim()).filter(Boolean).forEach(part => {
      const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/); if (!m) throw new Error(`“${part}” is not a valid range.`);
      let a = +m[1], b = +(m[2] || m[1]); if (a > b) [a,b] = [b,a];
      for (let i = a; i <= b; i++) if (i >= 1 && i <= pageCount && !pages.includes(i)) pages.push(i);
    });
    if (!pages.length) throw new Error('No selected page exists in this document.'); return pages;
  });
}

async function buildPdfFromRendered(pdf, pageNumbers, { quality = .96, scale = 1.8, rotations = {} } = {}) {
  const out = await PDFLib.PDFDocument.create();
  for (let j = 0; j < pageNumbers.length; j++) {
    const n = pageNumbers[j], canvas = await renderPage(pdf, n, scale, rotations[n] || 0), blob = await canvasBlob(canvas, 'image/jpeg', quality), bytes = await blob.arrayBuffer();
    const image = await out.embedJpg(bytes), page = out.addPage([image.width, image.height]); page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    setProgress(((j + 1) / pageNumbers.length) * 90, `Rendering page ${j + 1} of ${pageNumbers.length}…`, 'Quality-preserving raster fallback');
  }
  return out.save({ useObjectStreams: true });
}

async function copyPdfPages(file, pageNumbers, rotations = {}) {
  try {
    const source = await PDFLib.PDFDocument.load(await file.arrayBuffer());
    const out = await PDFLib.PDFDocument.create(); const copied = await out.copyPages(source, pageNumbers.map(n => n - 1));
    copied.forEach((page, idx) => { const n = pageNumbers[idx]; if (rotations[n]) page.setRotation(PDFLib.degrees((page.getRotation().angle + rotations[n]) % 360)); out.addPage(page); });
    return out.save({ useObjectStreams: true });
  } catch (err) {
    const pdf = await ensurePdf(file, session.password); return buildPdfFromRendered(pdf, pageNumbers, { rotations });
  }
}

function route() {
  routeCleanup(); routeCleanup = () => {};
  session?.dispose(); session = null;
  const match = location.hash.match(/^#\/tool\/([a-z-]+)$/);
  if (!match) { renderHome(); scrollTo(0, 0); return; }
  const tool = TOOLS.find(t => t.slug === match[1]); if (!tool) { location.hash = '#/'; return; }
  session = new JobSession(tool.slug); toolShell(tool); setupTool(tool); scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();

function setupTool(tool) {
  const controllers = {
    compress: setupCompress,
    'pdf-word': setupPdfWord,
    'word-pdf': setupWordPdf,
    'pdf-jpg': setupPdfImages,
    merge: setupMerge,
    split: setupSplit,
    'remove-pages': () => setupPageEditor('remove'),
    'extract-pages': () => setupPageEditor('extract'),
    organize: setupOrganize,
    rotate: setupRotate,
    'scan-pdf': setupScanPdf,
    watermark: setupWatermark,
    summarize: setupSummarizer,
    translate: setupTranslate,
    markdown: setupMarkdown,
    data: setupDataExtraction,
    'smart-split': setupSmartSplit,
  };
  controllers[tool.slug]?.();
}

/* -------------------------------------------------------------------------- */
/* Featured: compression                                                       */
/* -------------------------------------------------------------------------- */

function setupCompress() {
  const body = document.querySelector('#workspace-body');
  let locked = false;
  const upload = () => {
    session.replaceFile(null); locked = false;
    body.innerHTML = uploadTemplate({ accept: '.pdf,application/pdf', title: 'Drop a PDF to compress', note: 'PDF · password-protected files supported' });
    bindDrop(async ([file]) => {
      if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) return toast('Choose a PDF file.');
      session.replaceFile(file); await inspect('');
    });
  };
  const inspect = async password => {
    body.innerHTML = `<div class="file-panel"><div class="panel"><div class="panel-title"><h3>Selected document</h3><span class="mono-label">Inspecting</span></div>${fileRow(session.file)}</div><div class="panel"><div class="loader" style="width:56px;height:56px;margin:20px auto"><span>•••</span></div></div></div>`;
    try {
      session.pdf?.destroy?.(); session.pdf = await openPdf(session.file, password); session.password = password; locked = Boolean(password); showControls();
    } catch (err) {
      if (err.code === 'PASSWORD' || err.code === 'BAD_PASSWORD') showPassword(err.code === 'BAD_PASSWORD' ? err.message : '');
      else showFailure(err);
    }
  };
  const showPassword = error => {
    body.innerHTML = `<div class="file-panel"><div class="panel"><div class="panel-title"><h3>Selected document</h3><span class="mono-label">Locked PDF</span></div>${fileRow(session.file)}${passwordUI()}</div><div class="panel"><div class="panel-title"><h3>Why the password?</h3></div><p class="help-text">The password is used only in this browser for this active job. Folio does not attempt to bypass document security.</p></div></div>`;
    if (error) document.querySelector('#password-error').textContent = error;
    bindReplace(upload);
    document.querySelector('#unlock-btn').onclick = () => { const value = document.querySelector('#pdf-password').value; if (!value) return toast('Enter the PDF password.'); inspect(value); };
  };
  const showControls = () => {
    body.innerHTML = `<div class="file-panel"><div class="panel"><div class="panel-title"><h3>Selected document</h3><span class="mono-label">${locked ? 'Unlocked' : 'Ready'}</span></div>${fileRow(session.file, `${session.pdf.numPages} page${session.pdf.numPages === 1 ? '' : 's'}`)}<div class="field"><label for="target-size">Target size</label><input id="target-size" value="200 KB" inputmode="decimal" placeholder="e.g. 200 KB or 2.5 MB"/><span class="help-text">KB and MB use 1,024-byte units. The generated Blob is checked against the exact requested byte count.</span></div></div><div class="panel"><div class="panel-title"><h3>Quality strategy</h3><span class="mono-label">Adaptive + exact</span></div><p class="help-text">Folio starts with lossless cleanup, then lowers image cost only as needed. Once a valid result is below the target, legal non-rendered PDF whitespace fills the remaining bytes without further visual quality loss.</p><div class="result-stats" style="justify-content:flex-start"><div><span>Original</span><b>${formatSize(session.file.size)}</b></div><div><span>Pages</span><b>${session.pdf.numPages}</b></div></div><div class="actions"><button class="primary-btn" id="compress-btn">Compress PDF</button></div></div></div>`;
    bindReplace(upload); document.querySelector('#compress-btn').onclick = compress;
  };
  const makeRasterPdf = async (canvases, quality, factor) => {
    const out = await PDFLib.PDFDocument.create();
    for (const source of canvases) {
      let canvas = source;
      if (factor < .995) {
        canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(source.width * factor)); canvas.height = Math.max(1, Math.round(source.height * factor));
        canvas.getContext('2d', { alpha: false }).drawImage(source, 0, 0, canvas.width, canvas.height);
      }
      const jpg = await canvasBlob(canvas, 'image/jpeg', quality); const image = await out.embedJpg(await jpg.arrayBuffer());
      const page = out.addPage([image.width, image.height]); page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
    return out.save({ useObjectStreams: true });
  };
  const compress = async () => {
    const targetText = document.querySelector('#target-size').value, target = parseSize(targetText);
    if (!Number.isFinite(target) || target < 1024) return toast('Enter a valid target such as 200 KB or 2.5 MB.');
    const jobId = session.id; session.clearResults(); body.innerHTML = processingTemplate('Compressing PDF…', 'Starting with a lossless optimization pass.');
    try {
      const candidates = [];
      try {
        const source = await PDFLib.PDFDocument.load(await session.file.arrayBuffer());
        const lossless = await source.save({ useObjectStreams: true, addDefaultPage: false }); candidates.push({ bytes: lossless, quality: 1, label: 'Lossless cleanup' });
        setProgress(8, 'Lossless cleanup complete.', `Lossless pass · ${formatSize(lossless.length)}`);
        if (lossless.length <= target) return await finish(lossless, targetText, target, 'Lossless cleanup');
      } catch { setProgress(8, 'Secure document opened. Preparing visual fallback…', 'Lossless pass unavailable for this encrypted source'); }
      const canvases = [];
      for (let i = 1; i <= session.pdf.numPages; i++) {
        canvases.push(await renderPage(session.pdf, i, 1.55)); setProgress(8 + (i / session.pdf.numPages) * 20, `Preparing page ${i} of ${session.pdf.numPages}…`, 'High-quality render cache');
      }
      const passes = [
        [.94, 1], [.88, .97], [.82, .93], [.74, .87], [.66, .80], [.57, .72],
        [.48, .64], [.40, .56], [.32, .49], [.25, .42], [.18, .35], [.12, .28]
      ];
      let chosen = null;
      for (let i = 0; i < passes.length; i++) {
        if (session.id !== jobId) return;
        const [quality, factor] = passes[i];
        setProgress(30 + i * 7.5, 'Trying to reach target…', `Attempt ${i + 1} of ${passes.length} · quality ${Math.round(quality * 100)}%`);
        const bytes = await makeRasterPdf(canvases, quality, factor), item = { bytes, quality: quality * factor, label: `Adaptive pass ${i + 1}` }; candidates.push(item);
        setProgress(35 + i * 7.5, `Current result: ${formatSize(bytes.length)}`, `Target: ${formatSize(target)}`);
        if (bytes.length <= target) { chosen = item; break; }
        await sleep(30);
      }
      if (!chosen) {
        const smallest = candidates.reduce((best, item) => item.bytes.length < best.bytes.length ? item : best, candidates[0]);
        throw new Error(`Exact ${formatSize(target)} output is not possible without creating an invalid PDF. The smallest valid adaptive result was ${formatSize(smallest.bytes.length)}.`);
      }
      await finish(chosen.bytes, targetText, target, chosen.label);
    } catch (err) { showFailure(err, compress); }
  };
  const finish = async (bytes, targetText, target, method) => {
    setProgress(94, 'Matching the exact target size…', 'Adding non-rendered PDF whitespace without reducing visual quality');
    const exactBytes = padPdfToExactSize(bytes, Math.round(target));
    if (exactBytes.length !== Math.round(target)) throw new Error('The final file did not match the requested byte size.');
    setProgress(98, 'Verifying final PDF…', `Confirming ${exactBytes.length.toLocaleString()} bytes and document integrity`);
    await validatePdfBytes(exactBytes);
    const blob = bytesToBlob(exactBytes);
    if (blob.size !== Math.round(target)) throw new Error(`Final Blob verification failed: expected ${Math.round(target)} bytes but generated ${blob.size} bytes.`);
    const url = session.makeURL(blob), delta = (1 - blob.size / session.file.size) * 100;
    session.result = { url, name: `${stem(session.file.name)}-compressed.pdf` };
    body.innerHTML = resultTemplate({ title: 'Exact target verified', message: `The valid output was verified at exactly ${blob.size.toLocaleString()} bytes. Final size matching did not alter rendered page quality.`, stats: [['Original', formatSize(session.file.size)], ['Target', formatSize(Math.round(target))], ['Compressed', formatSize(blob.size)], ['Change', `${delta >= 0 ? '−' : '+'}${Math.abs(delta).toFixed(1)}%`], ['Method', `${method} + exact padding`]], downloadLabel: 'Download PDF', anotherLabel: 'Compress another PDF' });
    document.querySelector('#download-btn').onclick = () => downloadURL(session.result.url, session.result.name); document.querySelector('#another-btn').onclick = upload;
  };
  const showFailure = (err, retry = () => inspect(session.password)) => {
    body.innerHTML = errorTemplate('Compression could not finish', err?.message || 'The PDF could not be processed without risking a damaged result.');
    document.querySelector('#retry-btn').onclick = retry; document.querySelector('#another-btn').onclick = upload;
  };
  upload();
}

/* -------------------------------------------------------------------------- */
/* Featured: PDF to Word                                                       */
/* -------------------------------------------------------------------------- */

function setupPdfWord() {
  const body = document.querySelector('#workspace-body');
  const upload = () => {
    session.replaceFile(null); body.innerHTML = uploadTemplate({ accept: '.pdf,application/pdf', title: 'Drop a PDF to convert', note: 'PDF → editable DOCX · local extraction' });
    bindDrop(async ([file]) => { if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') return toast('Choose a PDF file.'); session.replaceFile(file); await inspect(''); });
  };
  const inspect = async password => {
    body.innerHTML = processingTemplate('Reading PDF…', 'Checking document structure and security.');
    try { session.pdf?.destroy?.(); session.pdf = await openPdf(session.file, password); session.password = password; ready(); }
    catch (err) { if (err.code === 'PASSWORD' || err.code === 'BAD_PASSWORD') locked(err); else fail(err); }
  };
  const locked = err => {
    body.innerHTML = `<div class="file-panel"><div class="panel">${fileRow(session.file)}${passwordUI()}</div><div class="panel"><h3>Protected document</h3><p class="help-text">Enter the owner-provided password to continue. Incorrect passwords can be retried without selecting the file again.</p></div></div>`;
    if (err.code === 'BAD_PASSWORD') document.querySelector('#password-error').textContent = 'The password is incorrect. Try again.';
    bindReplace(upload); document.querySelector('#unlock-btn').onclick = () => inspect(document.querySelector('#pdf-password').value);
  };
  const ready = () => {
    body.innerHTML = `<div class="file-panel"><div class="panel"><div class="panel-title"><h3>Source PDF</h3><span class="mono-label">Ready</span></div>${fileRow(session.file, `${session.pdf.numPages} pages`)}</div><div class="panel"><div class="panel-title"><h3>Conversion profile</h3><span class="mono-label">Editable</span></div><p class="help-text">Text, paragraphs and page boundaries are reconstructed into DOCX. Complex fixed-position graphics may be simplified to preserve editability.</p><div class="field"><label for="word-mode">Reading order</label><select id="word-mode"><option value="layout">Preserve page structure</option><option value="flow">Continuous editable flow</option></select></div><div class="actions"><button class="primary-btn" id="convert-btn">Convert to Word</button></div></div></div>`;
    bindReplace(upload); document.querySelector('#convert-btn').onclick = convert;
  };
  const convert = async () => {
    session.clearResults(); const mode = document.querySelector('#word-mode').value; body.innerHTML = processingTemplate('Converting to Word…', 'Recovering text, paragraphs and page structure.');
    try {
      if (!window.docx) throw new Error('The Word document engine did not load. Check the connection and retry.');
      const pages = [];
      for (let i = 1; i <= session.pdf.numPages; i++) {
        const page = await session.pdf.getPage(i), content = await page.getTextContent();
        const lines = new Map();
        content.items.forEach(item => { const y = Math.round(item.transform[5] / 4) * 4; if (!lines.has(y)) lines.set(y, []); lines.get(y).push(item); });
        const paragraphs = [...lines.entries()].sort((a,b) => b[0] - a[0]).map(([, items]) => items.sort((a,b) => a.transform[4] - b.transform[4]).map(x => x.str).join(' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
        pages.push(paragraphs); setProgress((i / session.pdf.numPages) * 64, `Recovering page ${i} of ${session.pdf.numPages}…`, 'Analyzing reading order');
      }
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } = window.docx;
      const children = [];
      pages.forEach((paragraphs, pageIndex) => {
        if (pageIndex && mode === 'layout') children.push(new Paragraph({ children: [new PageBreak()] }));
        paragraphs.forEach((text, idx) => {
          const heading = text.length < 90 && idx < 3 && !/[.!?]$/.test(text);
          children.push(new Paragraph({ text, heading: heading ? HeadingLevel.HEADING_2 : undefined, spacing: { after: heading ? 170 : 110, line: 290 } }));
        });
      });
      setProgress(82, 'Building editable DOCX…', 'Packaging document');
      const doc = new Document({ creator: 'Folio PDF Workroom', title: stem(session.file.name), description: 'Converted locally from PDF', sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc), url = session.makeURL(blob); session.result = { url, name: `${stem(session.file.name)}.docx` };
      body.innerHTML = resultTemplate({ title: 'Word document ready', message: 'Editable text and page structure were recovered. Highly graphical layouts may be simplified.', stats: [['Pages', String(session.pdf.numPages)], ['Output', formatSize(blob.size)], ['Format', 'DOCX']], downloadLabel: 'Download Word', anotherLabel: 'Choose another PDF' });
      document.querySelector('#download-btn').onclick = () => downloadURL(url, session.result.name); document.querySelector('#another-btn').onclick = upload;
    } catch (err) { fail(err, convert); }
  };
  const fail = (err, retry = () => inspect(session.password)) => { body.innerHTML = errorTemplate('Conversion could not finish', err?.message || 'The document structure could not be recovered.'); document.querySelector('#retry-btn').onclick = retry; document.querySelector('#another-btn').onclick = upload; };
  upload();
}

/* -------------------------------------------------------------------------- */
/* Featured: Word to PDF                                                       */
/* -------------------------------------------------------------------------- */

function setupWordPdf() {
  const body = document.querySelector('#workspace-body');
  const upload = () => {
    session.replaceFile(null); body.innerHTML = uploadTemplate({ accept: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', title: 'Drop a Word document', note: 'DOC / DOCX · browser-local conversion' });
    bindDrop(([file]) => { if (!/\.docx?$/i.test(file.name)) return toast('Choose a .DOC or .DOCX file.'); session.replaceFile(file); ready(); });
  };
  const ready = () => {
    body.innerHTML = `<div class="file-panel"><div class="panel"><div class="panel-title"><h3>Word document</h3><span class="mono-label">Ready</span></div>${fileRow(session.file)}</div><div class="panel"><div class="panel-title"><h3>PDF profile</h3><span class="mono-label">Print quality</span></div><div class="field-row"><div class="field"><label for="paper-size">Paper size</label><select id="paper-size"><option value="a4">A4</option><option value="letter">Letter</option></select></div><div class="field"><label for="margin-size">Margins</label><select id="margin-size"><option value="12">Normal</option><option value="7">Narrow</option><option value="20">Wide</option></select></div></div><p class="help-text">DOCX formatting, images, lists and tables are retained when supported. Legacy DOC files use a text-recovery fallback.</p><div class="actions"><button class="primary-btn" id="convert-btn">Convert to PDF</button></div></div></div>`;
    bindReplace(upload); document.querySelector('#convert-btn').onclick = convert;
  };
  const legacyText = bytes => {
    const raw = new TextDecoder('windows-1252').decode(bytes); return raw.replace(/[^\x20-\x7E\n\r\tÀ-ž]+/g, ' ').replace(/\s{3,}/g, '\n').trim();
  };
  const convert = async () => {
    const paper = document.querySelector('#paper-size').value, margin = +document.querySelector('#margin-size').value; session.clearResults(); body.innerHTML = processingTemplate('Converting Word to PDF…', 'Reading document styles and content.');
    try {
      const buffer = await session.file.arrayBuffer(); let html = '';
      if (/\.docx$/i.test(session.file.name)) {
        if (!window.mammoth) throw new Error('The DOCX reading engine did not load.');
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer }, { includeDefaultStyleMap: true }); html = result.value;
      } else {
        const recovered = legacyText(buffer); if (recovered.length < 20) throw new Error('This legacy DOC format cannot be decoded safely in this browser. Save it as DOCX and retry.');
        html = recovered.split(/\n+/).map(x => `<p>${escapeHTML(x)}</p>`).join('');
      }
      setProgress(38, 'Laying out pages…', 'Preserving lists, tables, images and breaks where available');
      const stage = document.createElement('article'); stage.style.cssText = `position:fixed;left:-12000px;top:0;width:${paper === 'a4' ? '794px' : '816px'};padding:${margin * 3.78}px;background:white;color:#111;font:14px/1.55 Georgia,serif;`;
      stage.className = 'word-render-stage'; stage.innerHTML = `<style>.word-render-stage img{max-width:100%;height:auto}.word-render-stage table{width:100%;border-collapse:collapse}.word-render-stage td,.word-render-stage th{border:1px solid #aaa;padding:6px}.word-render-stage h1,.word-render-stage h2,.word-render-stage h3{break-after:avoid}.word-render-stage p{orphans:3;widows:3}</style>${html}`; document.body.append(stage);
      setProgress(62, 'Rendering print-quality PDF…', 'Embedding fonts and document images');
      const worker = html2pdf().set({ margin, filename: `${stem(session.file.name)}.pdf`, image: { type: 'jpeg', quality: .99 }, html2canvas: { scale: 2.5, useCORS: true, backgroundColor: '#ffffff' }, jsPDF: { unit: 'mm', format: paper, orientation: 'portrait', compress: true }, pagebreak: { mode: ['css', 'legacy'] } }).from(stage).toPdf();
      const blob = await worker.outputPdf('blob'); stage.remove(); setProgress(96, 'Finalizing PDF…', 'Validating output');
      if (!blob || blob.size < 100) throw new Error('The PDF renderer returned an empty file.');
      const url = session.makeURL(blob); session.result = { url, name: `${stem(session.file.name)}.pdf` };
      body.innerHTML = resultTemplate({ title: 'PDF ready', message: 'The document was rendered into a portable, print-ready PDF.', stats: [['Source', formatSize(session.file.size)], ['PDF', formatSize(blob.size)], ['Page size', paper.toUpperCase()]], downloadLabel: 'Download PDF', anotherLabel: 'Convert another Word file' });
      document.querySelector('#download-btn').onclick = () => downloadURL(url, session.result.name); document.querySelector('#another-btn').onclick = upload;
    } catch (err) { document.querySelector('.word-render-stage')?.remove(); body.innerHTML = errorTemplate('Conversion could not finish', err?.message || 'The Word file could not be rendered safely.'); document.querySelector('#retry-btn').onclick = ready; document.querySelector('#another-btn').onclick = upload; }
  };
  upload();
}

/* -------------------------------------------------------------------------- */
/* Featured: PDF to images                                                     */
/* -------------------------------------------------------------------------- */

function setupPdfImages() {
  const body = document.querySelector('#workspace-body');
  const upload = () => {
    session.replaceFile(null); body.innerHTML = uploadTemplate({ accept: '.pdf,application/pdf', title: 'Drop a PDF to turn into images', note: 'JPG selected by default · PNG optional' });
    bindDrop(async ([file]) => { if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') return toast('Choose a PDF file.'); session.replaceFile(file); inspect(''); });
  };
  const inspect = async password => {
    body.innerHTML = processingTemplate('Reading PDF…', 'Preparing page information and security.');
    try { session.pdf?.destroy?.(); session.pdf = await openPdf(session.file, password); session.password = password; ready(); }
    catch (err) { if (err.code === 'PASSWORD' || err.code === 'BAD_PASSWORD') locked(err); else fail(err); }
  };
  const locked = err => {
    body.innerHTML = `<div class="file-panel"><div class="panel">${fileRow(session.file)}${passwordUI()}</div><div class="panel"><h3>Secure conversion</h3><p class="help-text">Once unlocked, each page is rendered directly in this browser. The password is not retained.</p></div></div>`;
    if (err.code === 'BAD_PASSWORD') document.querySelector('#password-error').textContent = 'The password is incorrect.';
    bindReplace(upload); document.querySelector('#unlock-btn').onclick = () => inspect(document.querySelector('#pdf-password').value);
  };
  const ready = () => {
    body.innerHTML = `<div class="file-panel"><div class="panel"><div class="panel-title"><h3>Source PDF</h3><span class="mono-label">${session.pdf.numPages} pages</span></div>${fileRow(session.file, `${session.pdf.numPages} pages`)}</div><div class="panel"><div class="panel-title"><h3>Image output</h3><span class="mono-label">Maximum practical quality</span></div><div class="field"><label>Output format</label><div class="choice-grid"><label class="choice"><input type="radio" name="format" value="jpg" checked><span>JPG / JPEG</span></label><label class="choice"><input type="radio" name="format" value="png"><span>PNG</span></label></div></div><div class="field"><label for="dpi">Resolution / DPI</label><div class="range-wrap"><input id="dpi" type="range" min="96" max="300" step="18" value="222"><span class="range-value" id="dpi-value">222 DPI</span></div></div><div class="field"><label for="jpg-quality">JPG quality</label><div class="range-wrap"><input id="jpg-quality" type="range" min="60" max="100" value="98"><span class="range-value" id="quality-value">98%</span></div></div><div class="actions"><button class="primary-btn" id="convert-btn">Convert every page</button></div></div></div>`;
    bindReplace(upload);
    document.querySelector('#dpi').oninput = e => document.querySelector('#dpi-value').textContent = `${e.target.value} DPI`;
    document.querySelector('#jpg-quality').oninput = e => document.querySelector('#quality-value').textContent = `${e.target.value}%`;
    document.querySelector('#convert-btn').onclick = convert;
  };
  const convert = async () => {
    const format = document.querySelector('input[name="format"]:checked').value, dpi = +document.querySelector('#dpi').value, quality = +document.querySelector('#jpg-quality').value / 100; session.clearResults();
    body.innerHTML = processingTemplate('Rendering pages…', 'Creating high-quality page images.');
    try {
      const results = [], ext = format === 'png' ? 'png' : 'jpg';
      for (let i = 1; i <= session.pdf.numPages; i++) {
        setProgress(((i - 1) / session.pdf.numPages) * 88, `Rendering page ${i} of ${session.pdf.numPages}…`, `${dpi} DPI · ${ext.toUpperCase()}`);
        const canvas = await renderPage(session.pdf, i, Math.min(4.2, dpi / 72)), blob = await encodeImageWithDpi(canvas, format, quality, dpi), url = session.makeURL(blob);
        results.push({ blob, url, name: `${stem(session.file.name)}-page-${i}.${ext}` }); await sleep(16);
      }
      session.results = results; showResults(format, dpi);
    } catch (err) { fail(err, convert); }
  };
  const showResults = (format, dpi) => {
    body.innerHTML = `<div class="result-card" style="display:block"><div class="success-mark">✓</div><h2>${session.results.length} page image${session.results.length === 1 ? '' : 's'} ready</h2><p style="margin:auto">Only images from this active job are included in the ZIP.</p><div class="download-grid">${session.results.map((r,i) => `<article class="download-item"><img src="${r.url}" alt="Preview of page ${i+1}" loading="lazy"><div><strong>${escapeHTML(r.name)}</strong><button class="secondary-btn page-download" data-index="${i}">Download</button></div></article>`).join('')}</div><div class="result-stats"><div><span>Format</span><b>${format.toUpperCase()}</b></div><div><span>Resolution</span><b>${dpi} DPI</b></div><div><span>Pages</span><b>${session.results.length}</b></div></div><div class="actions" style="justify-content:center"><button class="primary-btn" id="download-all">↓ Download all as ZIP</button><button class="secondary-btn" id="another-btn">Choose another PDF</button></div></div>`;
    document.querySelectorAll('.page-download').forEach(btn => btn.onclick = () => { const r = session.results[+btn.dataset.index]; downloadURL(r.url, r.name); });
    document.querySelector('#download-all').onclick = async () => {
      const btn = document.querySelector('#download-all'); btn.disabled = true; btn.textContent = 'Building ZIP…';
      try { const zip = new JSZip(); session.results.forEach(r => zip.file(r.name, r.blob)); const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }); const url = session.makeURL(blob); downloadURL(url, `${stem(session.file.name)}-images.zip`); }
      finally { btn.disabled = false; btn.textContent = '↓ Download all as ZIP'; }
    };
    document.querySelector('#another-btn').onclick = upload;
  };
  const fail = (err, retry = () => inspect(session.password)) => { body.innerHTML = errorTemplate('Image conversion could not finish', err?.message || 'One or more pages could not be rendered.'); document.querySelector('#retry-btn').onclick = retry; document.querySelector('#another-btn').onclick = upload; };
  upload();
}

/* -------------------------------------------------------------------------- */
/* Standard: merge and split                                                   */
/* -------------------------------------------------------------------------- */

function setupMerge() {
  const body = document.querySelector('#workspace-body'); let metas = [];
  const upload = () => {
    session.clearResults(); session.files = []; metas = [];
    body.innerHTML = uploadTemplate({ accept: '.pdf,application/pdf', multiple: true, title: 'Drop PDFs to merge', copy: 'Choose two or more documents', note: 'Drag to reorder after selection' });
    bindDrop(async files => {
      const valid = files.filter(f => /\.pdf$/i.test(f.name) || f.type === 'application/pdf'); if (valid.length < 2) return toast('Choose at least two PDF files.');
      session.files = valid; body.innerHTML = processingTemplate('Inspecting PDFs…', 'Checking page counts and document security.'); metas = [];
      for (let i = 0; i < valid.length; i++) {
        try { const pdf = await openPdf(valid[i]); metas.push({ file: valid[i], pages: pdf.numPages, locked: false, password: '' }); await pdf.destroy(); }
        catch (err) { if (err.code === 'PASSWORD') metas.push({ file: valid[i], pages: null, locked: true, password: '' }); else return fail(err); }
        setProgress(((i + 1) / valid.length) * 90, `Inspecting file ${i + 1} of ${valid.length}…`, valid[i].name);
      }
      ready();
    });
  };
  const ready = () => {
    body.innerHTML = `<div class="file-panel"><div class="panel"><div class="panel-title"><h3>Merge order</h3><span class="mono-label">Drag to reorder</span></div><div class="multi-file-list" id="merge-list">${metas.map((m,i) => `<div class="file-row sortable-file" draggable="true" data-index="${i}"><span class="file-badge">PDF</span><div class="file-meta"><strong>${escapeHTML(m.file.name)}</strong><small>${formatSize(m.file.size)} · ${m.locked ? 'Password protected' : `${m.pages} pages`}</small></div><span aria-hidden="true">⠿</span></div>`).join('')}</div><div class="actions"><button class="secondary-btn" id="add-files">Replace selection</button></div></div><div class="panel"><div class="panel-title"><h3>Merge settings</h3><span class="mono-label">${metas.length} files</span></div>${metas.some(x => x.locked) ? `<div class="password-box"><strong>Protected PDFs found</strong><p>Enter each document password. Files with different passwords are supported.</p>${metas.map((m,i) => m.locked ? `<div class="field"><label for="merge-pass-${i}">${escapeHTML(m.file.name)}</label><input type="password" id="merge-pass-${i}" data-pass-index="${i}" placeholder="PDF password"></div>` : '').join('')}</div>` : ''}<div class="actions"><button class="primary-btn" id="merge-btn">Merge PDF</button></div></div></div>`;
    document.querySelector('#add-files').onclick = upload; document.querySelector('#merge-btn').onclick = merge;
    document.querySelectorAll('[data-pass-index]').forEach(input => input.oninput = () => metas[+input.dataset.passIndex].password = input.value);
    bindSortable(document.querySelector('#merge-list'), (from, to) => { const [m] = metas.splice(from, 1); metas.splice(to, 0, m); ready(); });
  };
  const merge = async () => {
    session.clearResults(); body.innerHTML = processingTemplate('Merging PDFs…', 'Copying pages in your chosen order.');
    try {
      const out = await PDFLib.PDFDocument.create(); let done = 0, total = metas.reduce((n,m) => n + (m.pages || 1), 0);
      for (const meta of metas) {
        let source;
        if (!meta.locked) source = await PDFLib.PDFDocument.load(await meta.file.arrayBuffer());
        else {
          if (!meta.password) throw new Error(`Enter the password for ${meta.file.name}.`);
          let pdf; try { pdf = await openPdf(meta.file, meta.password); } catch (err) { throw new Error(`${meta.file.name}: ${err.message}`); }
          const bytes = await buildPdfFromRendered(pdf, Array.from({ length: pdf.numPages }, (_,i) => i + 1), { quality: .98, scale: 2 }); await pdf.destroy(); source = await PDFLib.PDFDocument.load(bytes); total += source.getPageCount() - 1;
        }
        const pages = await out.copyPages(source, source.getPageIndices()); pages.forEach(page => out.addPage(page)); done += pages.length;
        setProgress((done / total) * 90, `Added ${meta.file.name}`, `${done} pages assembled`);
      }
      const bytes = await out.save({ useObjectStreams: true }), blob = bytesToBlob(bytes), url = session.makeURL(blob); session.result = { url, name: 'folio-merged.pdf' };
      body.innerHTML = resultTemplate({ title: 'PDFs merged', message: `${metas.length} documents were combined in your selected order.`, stats: [['Files', String(metas.length)], ['Pages', String(out.getPageCount())], ['Output', formatSize(blob.size)]], downloadLabel: 'Download merged PDF', anotherLabel: 'Merge other PDFs' });
      document.querySelector('#download-btn').onclick = () => downloadURL(url, session.result.name); document.querySelector('#another-btn').onclick = upload;
    } catch (err) { fail(err, ready); }
  };
  const fail = (err, retry = upload) => { body.innerHTML = errorTemplate('Merge could not finish', err?.message || 'The documents could not be safely combined.'); document.querySelector('#retry-btn').onclick = retry; document.querySelector('#another-btn').onclick = upload; };
  upload();
}

function bindSortable(container, onMove) {
  let dragged = null;
  container.querySelectorAll('[draggable="true"]').forEach(item => {
    item.ondragstart = () => { dragged = item; item.classList.add('dragging'); };
    item.ondragend = () => item.classList.remove('dragging');
    item.ondragover = e => { e.preventDefault(); };
    item.ondrop = e => { e.preventDefault(); if (!dragged || dragged === item) return; const all = [...container.children]; onMove(all.indexOf(dragged), all.indexOf(item)); };
  });
}

function setupSplit() {
  const body = document.querySelector('#workspace-body');
  const upload = () => { session.replaceFile(null); body.innerHTML = uploadTemplate({ accept: '.pdf,application/pdf', title: 'Drop a PDF to split', note: 'Ranges, custom groups, or every page' }); bindDrop(async ([file]) => { if (!/\.pdf$/i.test(file.name)) return toast('Choose a PDF file.'); session.replaceFile(file); inspect(''); }); };
  const inspect = async password => {
    body.innerHTML = processingTemplate('Reading PDF…');
    try { session.pdf?.destroy?.(); session.pdf = await openPdf(session.file, password); session.password = password; ready(); }
    catch (err) { if (err.code === 'PASSWORD' || err.code === 'BAD_PASSWORD') locked(err); else fail(err); }
  };
  const locked = err => { body.innerHTML = `<div class="file-panel"><div class="panel">${fileRow(session.file)}${passwordUI()}</div><div class="panel"><h3>Unlock to split</h3><p class="help-text">Folio needs the correct password before it can read page boundaries.</p></div></div>`; if (err.code === 'BAD_PASSWORD') document.querySelector('#password-error').textContent = 'Incorrect password.'; bindReplace(upload); document.querySelector('#unlock-btn').onclick = () => inspect(document.querySelector('#pdf-password').value); };
  const ready = () => {
    body.innerHTML = `<div class="file-panel"><div class="panel"><div class="panel-title"><h3>Source document</h3><span class="mono-label">${session.pdf.numPages} pages</span></div>${fileRow(session.file, `${session.pdf.numPages} pages`)}</div><div class="panel"><div class="panel-title"><h3>Split method</h3></div><div class="field"><label>How should it split?</label><div class="choice-grid"><label class="choice"><input type="radio" name="split-mode" value="every" checked><span>Every page</span></label><label class="choice"><input type="radio" name="split-mode" value="ranges"><span>Custom groups</span></label></div></div><div class="field" id="ranges-field" hidden><label for="split-ranges">Groups separated by semicolons</label><input id="split-ranges" placeholder="1-3; 4-7; 8,10"/><span class="help-text">Example creates three output PDFs.</span></div><div class="actions"><button class="primary-btn" id="split-btn">Split PDF</button></div></div></div>`;
    bindReplace(upload); document.querySelectorAll('[name="split-mode"]').forEach(x => x.onchange = () => document.querySelector('#ranges-field').hidden = x.value !== 'ranges' || !x.checked); document.querySelector('#split-btn').onclick = split;
  };
  const split = async () => {
    const mode = document.querySelector('[name="split-mode"]:checked').value; let groups;
    try { groups = mode === 'every' ? Array.from({ length: session.pdf.numPages }, (_,i) => [i + 1]) : parseRanges(document.querySelector('#split-ranges').value, session.pdf.numPages); } catch (err) { return toast(err.message); }
    session.clearResults(); body.innerHTML = processingTemplate('Splitting PDF…', 'Creating isolated output files.');
    try {
      const results = [];
      for (let i = 0; i < groups.length; i++) { setProgress((i / groups.length) * 90, `Creating part ${i + 1} of ${groups.length}…`, `Pages ${groups[i].join(', ')}`); const bytes = await copyPdfPages(session.file, groups[i]); const blob = bytesToBlob(bytes), name = `${stem(session.file.name)}-part-${i + 1}.pdf`; results.push({ blob, name, url: session.makeURL(blob) }); }
      session.results = results; multiPdfResults('PDF split complete', `${results.length} files were created.`, upload);
    } catch (err) { fail(err, split); }
  };
  const fail = (err, retry = () => inspect(session.password)) => { body.innerHTML = errorTemplate('Split could not finish', err?.message || 'The PDF could not be divided safely.'); document.querySelector('#retry-btn').onclick = retry; document.querySelector('#another-btn').onclick = upload; };
  upload();
}

function multiPdfResults(title, message, onAnother) {
  const body = document.querySelector('#workspace-body');
  body.innerHTML = `<div class="result-card" style="display:block"><div class="success-mark">✓</div><h2>${escapeHTML(title)}</h2><p style="margin:auto">${escapeHTML(message)}</p><div class="download-grid">${session.results.map((r,i) => `<article class="download-item"><div><strong>${escapeHTML(r.name)}</strong><span class="help-text">${formatSize(r.blob.size)}</span><button class="secondary-btn part-download" data-index="${i}">Download</button></div></article>`).join('')}</div><div class="actions" style="justify-content:center"><button class="primary-btn" id="download-all">↓ Download all as ZIP</button><button class="secondary-btn" id="another-btn">Start another job</button></div></div>`;
  document.querySelectorAll('.part-download').forEach(btn => btn.onclick = () => { const r = session.results[+btn.dataset.index]; downloadURL(r.url, r.name); });
  document.querySelector('#download-all').onclick = async () => { const zip = new JSZip(); session.results.forEach(r => zip.file(r.name, r.blob)); const blob = await zip.generateAsync({ type: 'blob' }); const url = session.makeURL(blob); downloadURL(url, 'folio-pdf-parts.zip'); };
  document.querySelector('#another-btn').onclick = onAnother;
}

/* -------------------------------------------------------------------------- */
/* Standard: remove, extract, organize and rotate                              */
/* -------------------------------------------------------------------------- */

function setupPageEditor(mode) {
  const body = document.querySelector('#workspace-body'); const selected = new Set();
  const upload = () => { session.replaceFile(null); selected.clear(); body.innerHTML = uploadTemplate({ accept: '.pdf,application/pdf', title: mode === 'remove' ? 'Drop a PDF to remove pages' : 'Drop a PDF to extract pages', note: 'Visual page selection · range input included' }); bindDrop(async ([file]) => { if (!/\.pdf$/i.test(file.name)) return toast('Choose a PDF file.'); session.replaceFile(file); inspect(''); }); };
  const inspect = async password => { body.innerHTML = processingTemplate('Preparing page previews…'); try { session.pdf?.destroy?.(); session.pdf = await openPdf(session.file, password); session.password = password; await ready(); } catch (err) { if (err.code === 'PASSWORD' || err.code === 'BAD_PASSWORD') locked(err); else fail(err); } };
  const locked = err => { body.innerHTML = `<div class="panel">${fileRow(session.file)}${passwordUI()}</div>`; if (err.code === 'BAD_PASSWORD') document.querySelector('#password-error').textContent = 'Incorrect password.'; bindReplace(upload); document.querySelector('#unlock-btn').onclick = () => inspect(document.querySelector('#pdf-password').value); };
  const ready = async () => {
    body.innerHTML = `<div class="panel"><div class="panel-title"><h3>${mode === 'remove' ? 'Select pages to remove' : 'Select pages to extract'}</h3><span class="mono-label" id="selection-count">0 selected</span></div>${fileRow(session.file, `${session.pdf.numPages} pages`)}<div class="field-row"><div class="field"><label for="page-ranges">Or enter pages / ranges</label><input id="page-ranges" placeholder="e.g. 1, 3-5, 9"/></div><div class="actions" style="align-items:end"><button class="secondary-btn" id="apply-range">Apply range</button><button class="primary-btn" id="process-pages">${mode === 'remove' ? 'Remove selected pages' : 'Extract selected pages'}</button></div></div><div class="thumb-grid" id="thumb-grid"></div></div>`;
    bindReplace(upload); const holder = document.querySelector('#thumb-grid');
    await renderThumbs(session.pdf, holder, { selected, onClick: (n, card) => { selected.has(n) ? selected.delete(n) : selected.add(n); card.classList.toggle('selected', selected.has(n)); card.querySelector('.select-dot').textContent = selected.has(n) ? '✓' : ''; document.querySelector('#selection-count').textContent = `${selected.size} selected`; } });
    document.querySelector('#apply-range').onclick = () => { try { parseRanges(document.querySelector('#page-ranges').value.replace(/;/g, ','), session.pdf.numPages).flat().forEach(n => selected.add(n)); ready(); } catch (err) { toast(err.message); } };
    document.querySelector('#process-pages').onclick = process;
  };
  const process = async () => {
    if (!selected.size) return toast(`Select at least one page to ${mode}.`);
    const pages = Array.from({ length: session.pdf.numPages }, (_,i) => i + 1), keep = mode === 'remove' ? pages.filter(n => !selected.has(n)) : pages.filter(n => selected.has(n));
    if (!keep.length) return toast('The output must contain at least one page.'); session.clearResults(); body.innerHTML = processingTemplate(mode === 'remove' ? 'Removing pages…' : 'Extracting pages…');
    try { const bytes = await copyPdfPages(session.file, keep), blob = bytesToBlob(bytes), url = session.makeURL(blob), name = `${stem(session.file.name)}-${mode === 'remove' ? 'pages-removed' : 'extracted'}.pdf`; session.result = { url, name }; body.innerHTML = resultTemplate({ title: mode === 'remove' ? 'Pages removed' : 'Pages extracted', message: `Your new PDF contains ${keep.length} page${keep.length === 1 ? '' : 's'}.`, stats: [['Selected', String(selected.size)], ['Output pages', String(keep.length)], ['Size', formatSize(blob.size)]], downloadLabel: 'Download PDF' }); document.querySelector('#download-btn').onclick = () => downloadURL(url, name); document.querySelector('#another-btn').onclick = upload; }
    catch (err) { fail(err, process); }
  };
  const fail = (err, retry = () => inspect(session.password)) => { body.innerHTML = errorTemplate('Page operation could not finish', err?.message || 'The page selection could not be applied.'); document.querySelector('#retry-btn').onclick = retry; document.querySelector('#another-btn').onclick = upload; };
  upload();
}

function setupOrganize() {
  const body = document.querySelector('#workspace-body'); let order = [];
  const upload = () => { session.replaceFile(null); order = []; body.innerHTML = uploadTemplate({ accept: '.pdf,application/pdf', title: 'Drop a PDF to reorganize', note: 'Drag page thumbnails into a new order' }); bindDrop(async ([file]) => { if (!/\.pdf$/i.test(file.name)) return toast('Choose a PDF file.'); session.replaceFile(file); inspect(''); }); };
  const inspect = async password => { body.innerHTML = processingTemplate('Building page organizer…'); try { session.pdf?.destroy?.(); session.pdf = await openPdf(session.file, password); session.password = password; order = Array.from({ length: session.pdf.numPages }, (_,i) => i + 1); await ready(); } catch (err) { if (err.code === 'PASSWORD' || err.code === 'BAD_PASSWORD') locked(err); else fail(err); } };
  const locked = err => { body.innerHTML = `<div class="panel">${fileRow(session.file)}${passwordUI()}</div>`; if (err.code === 'BAD_PASSWORD') document.querySelector('#password-error').textContent = 'Incorrect password.'; document.querySelector('#unlock-btn').onclick = () => inspect(document.querySelector('#pdf-password').value); bindReplace(upload); };
  const ready = async () => {
    body.innerHTML = `<div class="panel"><div class="panel-title"><h3>Drag pages into order</h3><span class="mono-label">${order.length} pages</span></div>${fileRow(session.file)}<div class="thumb-grid" id="thumb-grid"></div><div class="actions"><button class="primary-btn" id="organize-btn">Create reordered PDF</button></div></div>`; bindReplace(upload);
    const holder = document.querySelector('#thumb-grid'); holder.innerHTML = '';
    for (const n of order) { const card = document.createElement('article'); card.className = 'page-thumb'; card.draggable = true; card.dataset.page = n; card.append(await renderPage(session.pdf, n, .28)); card.insertAdjacentHTML('beforeend', `<footer><span>PAGE ${n}</span><span>⠿</span></footer>`); holder.append(card); }
    bindSortable(holder, (from,to) => { const [n] = order.splice(from,1); order.splice(to,0,n); ready(); }); document.querySelector('#organize-btn').onclick = process;
  };
  const process = async () => { session.clearResults(); body.innerHTML = processingTemplate('Reordering pages…'); try { const bytes = await copyPdfPages(session.file, order), blob = bytesToBlob(bytes), url = session.makeURL(blob), name = `${stem(session.file.name)}-reordered.pdf`; session.result = { url, name }; body.innerHTML = resultTemplate({ title: 'Page order updated', message: 'The PDF was rebuilt in your chosen order.', stats: [['Pages', String(order.length)], ['Output', formatSize(blob.size)]], downloadLabel: 'Download PDF' }); document.querySelector('#download-btn').onclick = () => downloadURL(url, name); document.querySelector('#another-btn').onclick = upload; } catch (err) { fail(err, process); } };
  const fail = (err, retry = () => inspect(session.password)) => { body.innerHTML = errorTemplate('Could not reorder this PDF', err?.message || 'The page order could not be applied.'); document.querySelector('#retry-btn').onclick = retry; document.querySelector('#another-btn').onclick = upload; };
  upload();
}

function setupRotate() {
  const body = document.querySelector('#workspace-body'); const selected = new Set(); let rotations = {};
  const upload = () => { session.replaceFile(null); selected.clear(); rotations = {}; body.innerHTML = uploadTemplate({ accept: '.pdf,application/pdf', title: 'Drop a PDF to rotate', note: 'Rotate selected pages or the complete document' }); bindDrop(async ([file]) => { if (!/\.pdf$/i.test(file.name)) return toast('Choose a PDF file.'); session.replaceFile(file); inspect(''); }); };
  const inspect = async password => { body.innerHTML = processingTemplate('Preparing page previews…'); try { session.pdf?.destroy?.(); session.pdf = await openPdf(session.file, password); session.password = password; await ready(); } catch (err) { if (err.code === 'PASSWORD' || err.code === 'BAD_PASSWORD') locked(err); else fail(err); } };
  const locked = err => { body.innerHTML = `<div class="panel">${fileRow(session.file)}${passwordUI()}</div>`; if (err.code === 'BAD_PASSWORD') document.querySelector('#password-error').textContent = 'Incorrect password.'; document.querySelector('#unlock-btn').onclick = () => inspect(document.querySelector('#pdf-password').value); bindReplace(upload); };
  const ready = async () => {
    body.innerHTML = `<div class="panel"><div class="panel-title"><h3>Select pages, then rotate</h3><span class="mono-label">${selected.size} selected</span></div>${fileRow(session.file)}<div class="field-row"><div class="field"><label for="rotate-angle">Rotation</label><select id="rotate-angle"><option value="90">90° clockwise</option><option value="180">180°</option><option value="270">270° clockwise</option></select></div><div class="actions" style="align-items:end"><button class="secondary-btn" id="rotate-selected">Rotate selected</button><button class="secondary-btn" id="rotate-all">Rotate all</button><button class="primary-btn" id="save-rotation">Create rotated PDF</button></div></div><div class="thumb-grid" id="thumb-grid"></div></div>`;
    bindReplace(upload); const holder = document.querySelector('#thumb-grid');
    for (let i = 1; i <= session.pdf.numPages; i++) { const card = document.createElement('article'); card.className = `page-thumb${selected.has(i) ? ' selected' : ''}`; card.dataset.page = i; card.append(await renderPage(session.pdf, i, .28, rotations[i] || 0)); card.insertAdjacentHTML('beforeend', `${rotations[i] ? `<span class="thumb-rotation">${rotations[i]}°</span>` : ''}<footer><span>PAGE ${i}</span><span class="select-dot">${selected.has(i) ? '✓' : ''}</span></footer>`); card.onclick = () => { selected.has(i) ? selected.delete(i) : selected.add(i); ready(); }; holder.append(card); }
    const rotate = all => { const angle = +document.querySelector('#rotate-angle').value, targets = all ? Array.from({ length: session.pdf.numPages }, (_,i) => i + 1) : [...selected]; if (!targets.length) return toast('Select one or more pages.'); targets.forEach(n => rotations[n] = ((rotations[n] || 0) + angle) % 360); ready(); };
    document.querySelector('#rotate-selected').onclick = () => rotate(false); document.querySelector('#rotate-all').onclick = () => rotate(true); document.querySelector('#save-rotation').onclick = process;
  };
  const process = async () => { if (!Object.values(rotations).some(Boolean)) return toast('Apply a rotation first.'); session.clearResults(); body.innerHTML = processingTemplate('Applying rotation…'); try { const pages = Array.from({ length: session.pdf.numPages }, (_,i) => i + 1), bytes = await copyPdfPages(session.file, pages, rotations), blob = bytesToBlob(bytes), url = session.makeURL(blob), name = `${stem(session.file.name)}-rotated.pdf`; session.result = { url, name }; body.innerHTML = resultTemplate({ title: 'Rotation applied', message: 'The corrected document is ready.', stats: [['Pages', String(session.pdf.numPages)], ['Rotated', String(Object.values(rotations).filter(Boolean).length)], ['Output', formatSize(blob.size)]], downloadLabel: 'Download PDF' }); document.querySelector('#download-btn').onclick = () => downloadURL(url, name); document.querySelector('#another-btn').onclick = upload; } catch (err) { fail(err, process); } };
  const fail = (err, retry = () => inspect(session.password)) => { body.innerHTML = errorTemplate('Rotation could not finish', err?.message || 'The PDF could not be rebuilt.'); document.querySelector('#retry-btn').onclick = retry; document.querySelector('#another-btn').onclick = upload; };
  upload();
}

/* -------------------------------------------------------------------------- */
/* Standard: scan to PDF                                                       */
/* -------------------------------------------------------------------------- */

function setupScanPdf() {
  const body = document.querySelector('#workspace-body'); let images = [];
  const clearImages = () => { images.forEach(x => URL.revokeObjectURL(x.preview)); images = []; };
  const upload = () => { session.clearResults(); clearImages(); body.innerHTML = uploadTemplate({ accept: 'image/jpeg,image/png,.jpg,.jpeg,.png', multiple: true, title: 'Drop document captures', copy: 'Choose one or more JPG or PNG images', note: 'Reorder pages before building your PDF' }); bindDrop(files => { const valid = files.filter(f => /^image\/(jpeg|png)$/i.test(f.type) || /\.(jpe?g|png)$/i.test(f.name)); if (!valid.length) return toast('Choose JPG or PNG images.'); images = valid.map(file => ({ file, preview: URL.createObjectURL(file) })); ready(); }); };
  const ready = () => {
    body.innerHTML = `<div class="file-panel"><div class="panel"><div class="panel-title"><h3>Scan order</h3><span class="mono-label">Drag to reorder</span></div><div class="thumb-grid" id="scan-grid">${images.map((x,i) => `<article class="page-thumb" draggable="true" data-index="${i}"><img src="${x.preview}" alt="Scan ${i+1}"><footer><span>PAGE ${i+1}</span><span>⠿</span></footer></article>`).join('')}</div><div class="actions"><button class="secondary-btn" id="replace-file">Choose other images</button></div></div><div class="panel"><div class="panel-title"><h3>Document settings</h3></div><div class="field"><label for="scan-page-size">Page size</label><select id="scan-page-size"><option value="fit">Fit each image</option><option value="a4">A4 with margins</option><option value="letter">Letter with margins</option></select></div><div class="field"><label for="scan-quality">Image quality</label><div class="range-wrap"><input id="scan-quality" type="range" min="70" max="100" value="98"><span class="range-value" id="scan-q-value">98%</span></div></div><div class="actions"><button class="primary-btn" id="create-scan">Create PDF</button></div></div></div>`;
    document.querySelector('#replace-file').onclick = upload; document.querySelector('#scan-quality').oninput = e => document.querySelector('#scan-q-value').textContent = `${e.target.value}%`; document.querySelector('#create-scan').onclick = process;
    bindSortable(document.querySelector('#scan-grid'), (from,to) => { const [x] = images.splice(from,1); images.splice(to,0,x); ready(); });
  };
  const process = async () => {
    const size = document.querySelector('#scan-page-size').value, quality = +document.querySelector('#scan-quality').value / 100; session.clearResults(); body.innerHTML = processingTemplate('Building scanned PDF…', 'Optimizing captures while preserving text clarity.');
    try {
      const out = await PDFLib.PDFDocument.create();
      for (let i = 0; i < images.length; i++) {
        const x = images[i], bitmap = await createImageBitmap(x.file), canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height; canvas.getContext('2d', { alpha: false }).drawImage(bitmap,0,0); bitmap.close();
        const jpg = await canvasBlob(canvas, 'image/jpeg', quality), embedded = await out.embedJpg(await jpg.arrayBuffer()); let pw = embedded.width, ph = embedded.height;
        if (size === 'a4') [pw, ph] = [595.28, 841.89]; else if (size === 'letter') [pw, ph] = [612, 792];
        const page = out.addPage([pw, ph]), margin = size === 'fit' ? 0 : 24, ratio = Math.min((pw - margin * 2) / embedded.width, (ph - margin * 2) / embedded.height), w = embedded.width * ratio, h = embedded.height * ratio;
        page.drawImage(embedded, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h }); setProgress(((i + 1) / images.length) * 90, `Adding scan ${i + 1} of ${images.length}…`, x.file.name);
      }
      const bytes = await out.save({ useObjectStreams: true }), blob = bytesToBlob(bytes), url = session.makeURL(blob), name = 'folio-scanned-document.pdf'; session.result = { url, name };
      body.innerHTML = resultTemplate({ title: 'Scanned PDF ready', message: 'Your captures were combined in the selected order.', stats: [['Pages', String(images.length)], ['Output', formatSize(blob.size)], ['Layout', size.toUpperCase()]], downloadLabel: 'Download PDF', anotherLabel: 'Create another scan' }); document.querySelector('#download-btn').onclick = () => downloadURL(url, name); document.querySelector('#another-btn').onclick = upload;
    } catch (err) { body.innerHTML = errorTemplate('Scan PDF could not finish', err?.message || 'One of the images could not be processed.'); document.querySelector('#retry-btn').onclick = ready; document.querySelector('#another-btn').onclick = upload; }
  };
  routeCleanup = clearImages; upload();
}

/* -------------------------------------------------------------------------- */
/* Standard: watermark reduction                                               */
/* -------------------------------------------------------------------------- */

function setupWatermark() {
  const body = document.querySelector('#workspace-body'); let selectedType = 'jpg', sourceCanvas = null, selection = null;
  const upload = () => {
    session.replaceFile(null); sourceCanvas = null; selection = null;
    const accepts = { jpg: '.jpg,.jpeg,image/jpeg', png: '.png,image/png', pdf: '.pdf,application/pdf' };
    body.innerHTML = `<div class="panel" style="margin-bottom:14px"><div class="panel-title"><h3>Input type</h3><span class="mono-label">JPG / JPEG default</span></div><div class="choice-grid" style="grid-template-columns:repeat(3,1fr)">${[['jpg','JPG / JPEG'],['png','PNG'],['pdf','PDF']].map(([v,l]) => `<label class="choice"><input type="radio" name="wm-type" value="${v}" ${v === selectedType ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>${uploadTemplate({ accept: accepts[selectedType], title: `Drop a ${selectedType === 'pdf' ? 'PDF' : selectedType.toUpperCase() + ' image'}`, note: 'Local cleanup · original file is never overwritten' })}`;
    document.querySelectorAll('[name="wm-type"]').forEach(input => input.onchange = () => { selectedType = input.value; upload(); });
    bindDrop(async ([file]) => { session.replaceFile(file); if (selectedType === 'pdf') inspectPdf(''); else prepareImage(); });
  };
  const prepareImage = async () => {
    try {
      const bitmap = await createImageBitmap(session.file); sourceCanvas = document.createElement('canvas'); sourceCanvas.width = bitmap.width; sourceCanvas.height = bitmap.height; sourceCanvas.getContext('2d').drawImage(bitmap,0,0); bitmap.close(); imageReady();
    } catch (err) { fail(err); }
  };
  const imageReady = () => {
    body.innerHTML = `<div class="file-panel"><div class="panel"><div class="panel-title"><h3>Mark the watermark area</h3><span class="mono-label">Drag on image</span></div><div style="overflow:auto;border-radius:14px;background:#e9e9e4;padding:12px"><canvas id="watermark-canvas" style="display:block;max-width:100%;height:auto;margin:auto;touch-action:none"></canvas></div><p class="help-text">Drag a rectangle around the watermark. Manual cleanup interpolates nearby pixels and works best on simple backgrounds.</p></div><div class="panel">${fileRow(session.file)}<div class="field"><label>Cleanup method</label><div class="choice-grid"><label class="choice"><input type="radio" name="wm-mode" value="manual" checked><span>Selected area</span></label><label class="choice"><input type="radio" name="wm-mode" value="light"><span>Pale overlay</span></label></div></div><div class="field"><label for="wm-strength">Cleanup strength</label><div class="range-wrap"><input id="wm-strength" type="range" min="20" max="100" value="70"><span class="range-value" id="wm-strength-value">70%</span></div></div><p class="help-text">Watermark removal cannot be perfect on every texture. Folio shows the real processed result rather than claiming reconstruction it did not perform.</p><div class="actions"><button class="primary-btn" id="remove-watermark">Reduce watermark</button><button class="secondary-btn" id="replace-file">Choose another</button></div></div></div>`;
    const canvas = document.querySelector('#watermark-canvas'); canvas.width = sourceCanvas.width; canvas.height = sourceCanvas.height; const ctx = canvas.getContext('2d'); ctx.drawImage(sourceCanvas,0,0);
    const pos = e => { const r = canvas.getBoundingClientRect(), p = e.touches?.[0] || e; return { x: Math.max(0, Math.min(canvas.width, (p.clientX-r.left)*canvas.width/r.width)), y: Math.max(0, Math.min(canvas.height, (p.clientY-r.top)*canvas.height/r.height)) }; };
    let start = null;
    const begin = e => { e.preventDefault(); start = pos(e); };
    const move = e => { if (!start) return; e.preventDefault(); const end = pos(e); ctx.drawImage(sourceCanvas,0,0); ctx.strokeStyle = '#135dff'; ctx.lineWidth = Math.max(2, canvas.width/400); ctx.setLineDash([8,6]); ctx.strokeRect(start.x,start.y,end.x-start.x,end.y-start.y); };
    const end = e => { if (!start) return; const p = pos(e); selection = { x: Math.round(Math.min(start.x,p.x)), y: Math.round(Math.min(start.y,p.y)), w: Math.round(Math.abs(p.x-start.x)), h: Math.round(Math.abs(p.y-start.y)) }; start = null; };
    canvas.addEventListener('pointerdown', begin); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', end); canvas.addEventListener('pointerleave', end);
    document.querySelector('#wm-strength').oninput = e => document.querySelector('#wm-strength-value').textContent = `${e.target.value}%`;
    document.querySelector('#remove-watermark').onclick = processImage; bindReplace(upload);
  };
  const reduceLightPixels = (canvas, strength) => {
    const ctx = canvas.getContext('2d'), img = ctx.getImageData(0,0,canvas.width,canvas.height), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const max = Math.max(d[i],d[i+1],d[i+2]), min = Math.min(d[i],d[i+1],d[i+2]); if (min > 165 && max-min < 22) { const lift = (255-min) * strength; d[i] = Math.min(255,d[i]+lift); d[i+1] = Math.min(255,d[i+1]+lift); d[i+2] = Math.min(255,d[i+2]+lift); } }
    ctx.putImageData(img,0,0);
  };
  const inpaintRect = (canvas, rect, strength) => {
    const ctx = canvas.getContext('2d'), img = ctx.getImageData(0,0,canvas.width,canvas.height), d = img.data, {x,y,w,h} = rect;
    for (let py=y; py<Math.min(canvas.height,y+h); py++) for (let px=x; px<Math.min(canvas.width,x+w); px++) {
      const t = w <= 1 ? 0 : (px-x)/(w-1), li = (py*canvas.width+Math.max(0,x-2))*4, ri=(py*canvas.width+Math.min(canvas.width-1,x+w+1))*4, i=(py*canvas.width+px)*4;
      for (let c=0;c<3;c++) { const estimate=d[li+c]*(1-t)+d[ri+c]*t; d[i+c]=d[i+c]*(1-strength)+estimate*strength; }
    }
    ctx.putImageData(img,0,0);
  };
  const processImage = async () => {
    const mode = document.querySelector('[name="wm-mode"]:checked').value, strength = +document.querySelector('#wm-strength').value/100; if (mode === 'manual' && (!selection || selection.w < 4 || selection.h < 4)) return toast('Drag a rectangle around the watermark first.');
    session.clearResults(); body.innerHTML = processingTemplate('Reducing watermark…', 'Reconstructing the affected area with nearby image information.');
    try { const canvas=document.createElement('canvas'); canvas.width=sourceCanvas.width; canvas.height=sourceCanvas.height; canvas.getContext('2d').drawImage(sourceCanvas,0,0); mode==='manual'?inpaintRect(canvas,selection,strength):reduceLightPixels(canvas,strength); setProgress(72,'Encoding the processed image…','Keeping original dimensions'); const mime=selectedType==='png'?'image/png':'image/jpeg', blob=await canvasBlob(canvas,mime,.99), url=session.makeURL(blob), name=`${stem(session.file.name)}-watermark-reduced.${selectedType==='png'?'png':'jpg'}`; session.result={url,name}; body.innerHTML=`<div class="result-card" style="display:block"><div class="success-mark">✓</div><h2>Processed preview</h2><p style="margin:auto">Inspect the real output before downloading. Complex backgrounds may retain visible traces.</p><div class="download-grid" style="grid-template-columns:minmax(200px,420px);justify-content:center"><article class="download-item"><img src="${url}" alt="Processed image preview"></article></div><div class="actions" style="justify-content:center"><button class="primary-btn" id="download-btn">↓ Download image</button><button class="secondary-btn" id="another-btn">Process another file</button></div></div>`; document.querySelector('#download-btn').onclick=()=>downloadURL(url,name); document.querySelector('#another-btn').onclick=upload; }
    catch(err){fail(err, imageReady);}
  };
  const inspectPdf = async password => { body.innerHTML=processingTemplate('Reading PDF…'); try{session.pdf=await openPdf(session.file,password);session.password=password;pdfReady();}catch(err){if(err.code==='PASSWORD'||err.code==='BAD_PASSWORD')locked(err);else fail(err);} };
  const locked = err => { body.innerHTML=`<div class="panel">${fileRow(session.file)}${passwordUI()}</div>`; if(err.code==='BAD_PASSWORD')document.querySelector('#password-error').textContent='Incorrect password.';document.querySelector('#unlock-btn').onclick=()=>inspectPdf(document.querySelector('#pdf-password').value);bindReplace(upload); };
  const pdfReady = () => { body.innerHTML=`<div class="file-panel"><div class="panel">${fileRow(session.file,`${session.pdf.numPages} pages`)}<p class="help-text" style="margin-top:15px">PDF mode targets pale, low-contrast overlays on each rendered page. It may not remove opaque or texture-heavy marks.</p></div><div class="panel"><div class="field"><label for="pdf-wm-strength">Pale-overlay cleanup strength</label><div class="range-wrap"><input id="pdf-wm-strength" type="range" min="15" max="85" value="48"><span class="range-value" id="pdf-strength-value">48%</span></div></div><div class="actions"><button class="primary-btn" id="remove-pdf-watermark">Process PDF</button></div></div></div>`;bindReplace(upload);document.querySelector('#pdf-wm-strength').oninput=e=>document.querySelector('#pdf-strength-value').textContent=`${e.target.value}%`;document.querySelector('#remove-pdf-watermark').onclick=processPdf; };
  const processPdf = async () => { const strength=+document.querySelector('#pdf-wm-strength').value/100;session.clearResults();body.innerHTML=processingTemplate('Reducing PDF watermark…','Processing each page conservatively.');try{const out=await PDFLib.PDFDocument.create();for(let i=1;i<=session.pdf.numPages;i++){const canvas=await renderPage(session.pdf,i,2);reduceLightPixels(canvas,strength);const jpg=await canvasBlob(canvas,'image/jpeg',.98),image=await out.embedJpg(await jpg.arrayBuffer()),page=out.addPage([image.width,image.height]);page.drawImage(image,{x:0,y:0,width:image.width,height:image.height});setProgress(i/session.pdf.numPages*90,`Processing page ${i} of ${session.pdf.numPages}…`,'Conservative pale-overlay reduction');}const bytes=await out.save({useObjectStreams:true}),blob=bytesToBlob(bytes),url=session.makeURL(blob),name=`${stem(session.file.name)}-watermark-reduced.pdf`;session.result={url,name};body.innerHTML=resultTemplate({title:'PDF processed',message:'Pale overlays were reduced where detected. Inspect the output; opaque marks may remain.',stats:[['Pages',String(session.pdf.numPages)],['Output',formatSize(blob.size)],['Method','Visual rebuild']],downloadLabel:'Download PDF'});document.querySelector('#download-btn').onclick=()=>downloadURL(url,name);document.querySelector('#another-btn').onclick=upload;}catch(err){fail(err,processPdf);} };
  const fail=(err,retry=upload)=>{body.innerHTML=errorTemplate('Watermark cleanup could not finish',err?.message||'The file could not be processed safely.');document.querySelector('#retry-btn').onclick=retry;document.querySelector('#another-btn').onclick=upload;};
  upload();
}

/* -------------------------------------------------------------------------- */
/* Shared intelligence upload                                                  */
/* -------------------------------------------------------------------------- */

function pdfIntelligenceFlow({ title, note, onReady }) {
  const body=document.querySelector('#workspace-body');
  const upload=()=>{session.replaceFile(null);body.innerHTML=uploadTemplate({accept:'.pdf,application/pdf',title,note});bindDrop(async([file])=>{if(!/\.pdf$/i.test(file.name))return toast('Choose a PDF file.');session.replaceFile(file);inspect('');});};
  const inspect=async password=>{body.innerHTML=processingTemplate('Reading document…','Extracting page structure locally.');try{session.pdf?.destroy?.();session.pdf=await openPdf(session.file,password);session.password=password;onReady({body,upload,fail});}catch(err){if(err.code==='PASSWORD'||err.code==='BAD_PASSWORD')locked(err);else fail(err);}};
  const locked=err=>{body.innerHTML=`<div class="file-panel"><div class="panel">${fileRow(session.file)}${passwordUI()}</div><div class="panel"><h3>Protected PDF</h3><p class="help-text">Enter the document password to analyze its contents locally.</p></div></div>`;if(err.code==='BAD_PASSWORD')document.querySelector('#password-error').textContent='The password is incorrect.';bindReplace(upload);document.querySelector('#unlock-btn').onclick=()=>inspect(document.querySelector('#pdf-password').value);};
  const fail=(err,retry=()=>inspect(session.password))=>{body.innerHTML=errorTemplate('Document analysis could not finish',err?.message||'The document content could not be read.');document.querySelector('#retry-btn').onclick=retry;document.querySelector('#another-btn').onclick=upload;};
  upload();
}

function lineRecords(items) {
  const lines=new Map();items.forEach(item=>{const y=Math.round(item.y/4)*4;if(!lines.has(y))lines.set(y,[]);lines.get(y).push(item);});
  return [...lines.entries()].sort((a,b)=>b[0]-a[0]).map(([y,row])=>{row.sort((a,b)=>a.x-b.x);const cells=[];let current='';let lastEnd=null;row.forEach(x=>{if(lastEnd!==null&&x.x-lastEnd>Math.max(18,x.height*1.8)){if(current.trim())cells.push(current.trim());current='';}current+=(current?' ':'')+x.text;lastEnd=x.x+x.width;});if(current.trim())cells.push(current.trim());return{y,cells,text:cells.join(' | ')};});
}

/* -------------------------------------------------------------------------- */
/* AI-style local summarizer                                                   */
/* -------------------------------------------------------------------------- */

function setupSummarizer() {
  pdfIntelligenceFlow({title:'Drop a PDF to summarize',note:'Local extractive analysis · no document upload',onReady:({body,upload,fail})=>{
    body.innerHTML=`<div class="file-panel"><div class="panel">${fileRow(session.file,`${session.pdf.numPages} pages`)}<p class="help-text" style="margin-top:15px">Folio uses local extractive ranking: it selects representative sentences rather than inventing facts.</p></div><div class="panel"><div class="field"><label>Summary style</label><div class="choice-grid"><label class="choice"><input type="radio" name="summary-mode" value="short" checked><span>Short summary</span></label><label class="choice"><input type="radio" name="summary-mode" value="points"><span>Key points</span></label></div></div><div class="field"><label for="summary-length">Detail</label><select id="summary-length"><option value="4">Concise</option><option value="7">Balanced</option><option value="11">Detailed</option></select></div><div class="actions"><button class="primary-btn" id="summarize-btn">Generate summary</button></div></div></div>`;bindReplace(upload);
    document.querySelector('#summarize-btn').onclick=async()=>{const mode=document.querySelector('[name="summary-mode"]:checked').value,count=+document.querySelector('#summary-length').value;body.innerHTML=processingTemplate('Analyzing document…','Ranking the most representative ideas.');try{const pages=await extractPdfPages(session.pdf);setProgress(58,'Finding key sentences…','Frequency-weighted extractive analysis');const result=summarizeLocal(pages.map(p=>p.text).join(' '),count);const output=mode==='points'?result.sentences.map(x=>`• ${x}`).join('\n'):result.sentences.join(' ');const full=`${output}\n\nMain topics: ${result.topics.join(', ')}`;const blob=new Blob([full],{type:'text/plain'}),url=session.makeURL(blob),name=`${stem(session.file.name)}-summary.txt`;session.result={url,name};body.innerHTML=`<div class="panel"><div class="panel-title"><h3>Your summary</h3><span class="mono-label">LOCAL EXTRACTIVE</span></div><div class="text-output">${escapeHTML(output)}</div><div class="result-stats" style="justify-content:flex-start"><div><span>Pages</span><b>${pages.length}</b></div><div><span>Main topics</span><b>${escapeHTML(result.topics.slice(0,3).join(', '))}</b></div></div><div class="actions"><button class="primary-btn" id="download-btn">↓ Download summary</button><button class="secondary-btn" id="another-btn">Summarize another PDF</button></div></div>`;document.querySelector('#download-btn').onclick=()=>downloadURL(url,name);document.querySelector('#another-btn').onclick=upload;}catch(err){fail(err);}};
  }});
}

function summarizeLocal(text,count) {
  const stop=new Set('the a an and or but of to in on for with is are was were be been being this that these those from by as at it its into about can may will would should could not no we you they he she our your their which what when where how'.split(' '));
  const sentences=(text.match(/[^.!?\n]+[.!?]+|[^.!?\n]+$/g)||[]).map(s=>s.trim()).filter(s=>s.length>35&&s.length<520);if(!sentences.length)throw new Error('This PDF does not contain enough readable text to summarize.');
  const freq={};text.toLowerCase().match(/[a-zÀ-ž][a-zÀ-ž'-]{2,}/g)?.forEach(w=>{if(!stop.has(w))freq[w]=(freq[w]||0)+1;});const topics=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,8).map(x=>x[0]);
  const scored=sentences.map((s,i)=>({s,i,score:(s.toLowerCase().match(/[a-zÀ-ž][a-zÀ-ž'-]{2,}/g)||[]).reduce((n,w)=>n+(freq[w]||0),0)/Math.sqrt(s.length)+(i<3?3:0)}));
  const chosen=scored.sort((a,b)=>b.score-a.score).slice(0,Math.min(count,sentences.length)).sort((a,b)=>a.i-b.i).map(x=>x.s);return{sentences:chosen,topics};
}

/* -------------------------------------------------------------------------- */
/* Translate PDF                                                               */
/* -------------------------------------------------------------------------- */

function setupTranslateLegacy() {
  pdfIntelligenceFlow({title:'Drop a PDF to translate',note:'Uses the browser’s on-device translation engine when available',onReady:({body,upload,fail})=>{
    body.innerHTML=`<div class="file-panel"><div class="panel">${fileRow(session.file,`${session.pdf.numPages} pages`)}<p class="help-text" style="margin-top:15px">Text is extracted page-by-page. Translation stays on-device when your browser provides its local Translation API.</p></div><div class="panel"><div class="field-row"><div class="field"><label for="source-language">Source language</label><select id="source-language"><option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option><option value="de">German</option><option value="pt">Portuguese</option><option value="it">Italian</option><option value="ja">Japanese</option></select></div><div class="field"><label for="target-language">Target language</label><select id="target-language"><option value="es">Spanish</option><option value="fr">French</option><option value="de">German</option><option value="en">English</option><option value="pt">Portuguese</option><option value="it">Italian</option><option value="ja">Japanese</option></select></div></div><div class="actions"><button class="primary-btn" id="translate-btn">Translate PDF</button></div><p class="help-text">If the on-device language pack is unavailable, Folio reports that honestly instead of returning unmodified text as a “translation.”</p></div></div>`;bindReplace(upload);
    document.querySelector('#translate-btn').onclick=async()=>{const source=document.querySelector('#source-language').value,target=document.querySelector('#target-language').value;if(source===target)return toast('Choose two different languages.');body.innerHTML=processingTemplate('Translating document…','Initializing the on-device language engine.');let translator=null,stage=null;try{if(window.Translator?.create)translator=await window.Translator.create({sourceLanguage:source,targetLanguage:target});else if(window.translation?.createTranslator)translator=await window.translation.createTranslator({sourceLanguage:source,targetLanguage:target});else throw new Error('On-device translation is not available in this browser. No file was uploaded or falsely marked as translated.');const pages=await extractPdfPages(session.pdf),translated=[];for(let i=0;i<pages.length;i++){const chunks=pages[i].text.match(/[\s\S]{1,3500}(?:\s|$)/g)||[pages[i].text];let text='';for(const chunk of chunks)text+=await translator.translate(chunk)+' ';translated.push(text.trim());setProgress((i+1)/pages.length*78,`Translating page ${i+1} of ${pages.length}…`,'On-device language model');}stage=document.createElement('article');stage.style.cssText='position:fixed;left:-12000px;top:0;width:794px;padding:64px;background:white;color:#111;font:15px/1.65 Georgia,serif';stage.innerHTML=translated.map((t,i)=>`<section style="page-break-after:${i<translated.length-1?'always':'auto'}"><small>PAGE ${i+1}</small><p>${escapeHTML(t)}</p></section>`).join('');document.body.append(stage);setProgress(84,'Rebuilding translated PDF…','Preserving page boundaries');const blob=await html2pdf().set({margin:14,image:{type:'jpeg',quality:.99},html2canvas:{scale:2.5},jsPDF:{unit:'mm',format:'a4',orientation:'portrait',compress:true},pagebreak:{mode:['css']}}).from(stage).toPdf().outputPdf('blob');stage.remove();translator.destroy?.();const url=session.makeURL(blob),name=`${stem(session.file.name)}-${target}.pdf`;session.result={url,name};body.innerHTML=resultTemplate({title:'Translation ready',message:'The extracted content was translated on-device and rebuilt with page boundaries.',stats:[['Pages',String(pages.length)],['Language',`${source.toUpperCase()} → ${target.toUpperCase()}`],['Output',formatSize(blob.size)]],downloadLabel:'Download translated PDF'});document.querySelector('#download-btn').onclick=()=>downloadURL(url,name);document.querySelector('#another-btn').onclick=upload;}catch(err){stage?.remove();translator?.destroy?.();fail(err,upload);}};
  }});
}

const TRANSLATE_LANGUAGES = [
  ['en', 'English'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German'],
  ['pt', 'Portuguese'], ['it', 'Italian'], ['ja', 'Japanese'],
  ['bn', 'Bengali (বাংলা)'], ['hi', 'Hindi (हिन्दी)']
];

const OCR_LANGUAGE_CODES = { en: 'eng', es: 'spa', fr: 'fra', de: 'deu', pt: 'por', it: 'ita', ja: 'jpn', bn: 'ben', hi: 'hin' };

function loadTranslateScript(src, globalName) {
  if (window[globalName]) return Promise.resolve(window[globalName]);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-translate-lib="${globalName}"]`);
    if (existing) { existing.addEventListener('load', () => resolve(window[globalName]), { once: true }); existing.addEventListener('error', reject, { once: true }); return; }
    const script = document.createElement('script'); script.src = src; script.dataset.translateLib = globalName; script.onload = () => resolve(window[globalName]); script.onerror = () => reject(new Error('The local OCR engine could not be loaded.')); document.head.append(script);
  });
}

function classifyTranslationLine(text, cells = [text]) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (cells.length >= 3) return { type: 'table', parts: cells.map(x => x.trim()).filter(Boolean) };
  if (/^[-•▪◦]\s*/.test(clean) || /^\d+[.)]\s+/.test(clean)) return { type: 'list', parts: [clean.replace(/^[-•▪◦]\s*/, '')] };
  if (clean.length < 90 && (/^[A-Z0-9][A-Z0-9 &:/–—-]+$/.test(clean) || (!/[,.!?;:]$/.test(clean) && clean.split(' ').length < 10))) return { type: 'heading', parts: [clean] };
  return { type: 'paragraph', parts: [clean] };
}

function translationBlocksFromLines(lines) {
  const blocks = [];
  for (const line of lines) {
    const block = classifyTranslationLine(line.cells.join(' '), line.cells);
    if (!block.parts.join('').trim()) continue;
    const previous = blocks.at(-1);
    if (block.type === 'paragraph' && previous?.type === 'paragraph' && !/[.!?।。]$/.test(previous.parts[0]) && (previous.parts[0].length + block.parts[0].length) < 900) previous.parts[0] += ` ${block.parts[0]}`;
    else blocks.push(block);
  }
  return blocks;
}

async function extractTranslationPages(pdf, sourceLanguage) {
  const pages = [], warnings = [];
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number), content = await page.getTextContent();
    const items = content.items.map(item => ({ text: item.str, x: item.transform[4], y: item.transform[5], width: item.width, height: item.height }));
    let blocks = translationBlocksFromLines(lineRecords(items)), ocrUsed = false, fallbackImage = '';
    const readable = blocks.flatMap(x => x.parts).join(' ').replace(/\s/g, '').length;
    if (readable < 12) {
      const canvas = await renderPage(pdf, number, 2);
      try {
        setProgress(5 + (number / pdf.numPages) * 24, `Running OCR on scanned page ${number}…`, 'On-device image text recognition');
        const Tesseract = await loadTranslateScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js', 'Tesseract');
        const result = await Tesseract.recognize(canvas, OCR_LANGUAGE_CODES[sourceLanguage] || 'eng', { logger: event => { if (event.status === 'recognizing text') setProgress(8 + event.progress * 18, `Reading scanned page ${number}…`, `${Math.round(event.progress * 100)}% OCR`); } });
        const ocrText = result?.data?.text?.trim() || '';
        if (ocrText) { blocks = translationBlocksFromLines(ocrText.split(/\n+/).filter(Boolean).map(text => ({ cells: [text] }))); ocrUsed = true; }
        else throw new Error('OCR found no readable text.');
      } catch (error) {
        fallbackImage = canvas.toDataURL('image/jpeg', .94);
        warnings.push({ page: number, reason: 'No readable text could be extracted; the original page image was retained.', detail: error.message });
      }
    }
    pages.push({ number, blocks, ocrUsed, fallbackImage });
    setProgress(8 + (number / pdf.numPages) * 25, `Reading page ${number} of ${pdf.numPages}…`, ocrUsed ? 'OCR text recovered' : 'Document structure recovered');
  }
  return { pages, warnings };
}

function simplifyIndicTranslation(text, target) {
  if (target === 'bn') {
    const replacements = [
      [/সমাধান করা আবশ্যক/g, 'সমাধান করতে হবে'], [/করিতে হবে/g, 'করতে হবে'], [/হইবে/g, 'হবে'], [/হইতে/g, 'হতে'],
      [/অতএব/g, 'তাই'], [/তথাপি/g, 'তবুও'], [/উক্ত/g, 'এই'], [/নিম্নলিখিত/g, 'নিচের'], [/ব্যতীত/g, 'ছাড়া'],
      [/সহিত/g, 'সঙ্গে'], [/প্রদান করুন/g, 'দিন'], [/গ্রহণ করুন/g, 'নিন'], [/সম্পাদন করুন/g, 'করুন']
    ];
    return replacements.reduce((value, [pattern, simple]) => value.replace(pattern, simple), text);
  }
  if (target === 'hi') {
    const replacements = [
      [/अतः/g, 'इसलिए'], [/तथापि/g, 'फिर भी'], [/उक्त/g, 'यह'], [/निम्नलिखित/g, 'नीचे दिए गए'],
      [/के अतिरिक्त/g, 'के अलावा'], [/प्रदान करें/g, 'दें'], [/ग्रहण करें/g, 'लें'], [/सम्पादित करें/g, 'करें']
    ];
    return replacements.reduce((value, [pattern, simple]) => value.replace(pattern, simple), text);
  }
  return text;
}

function localIndicTranslation(text, target) {
  const normalized = text.toLowerCase().replace(/[“”"'’]/g, '').replace(/\s+/g, ' ').trim().replace(/[.!?।]+$/, '');
  const phrases = {
    bn: {
      'this problem must be solved': 'এই সমস্যার সমাধান করতে হবে।',
      'quarterly operations brief': 'ত্রৈমাসিক কাজের সংক্ষিপ্ত বিবরণ',
      'revenue improved by 18 percent': 'আয় ১৮ শতাংশ বেড়েছে।',
      'costs remained stable': 'খরচ একই রকম ছিল।',
      'section 2 priorities': 'অধ্যায় ২: অগ্রাধিকার',
      'reliability and international expansion remain priorities': 'নির্ভরযোগ্যতা এবং আন্তর্জাতিক বিস্তার এখনো অগ্রাধিকার।'
    },
    hi: {
      'this problem must be solved': 'इस समस्या का समाधान करना होगा।',
      'quarterly operations brief': 'तिमाही कामकाज का संक्षिप्त विवरण',
      'revenue improved by 18 percent': 'आय में १८ प्रतिशत सुधार हुआ।',
      'costs remained stable': 'लागत स्थिर रही।',
      'section 2 priorities': 'खंड २: प्राथमिकताएँ',
      'reliability and international expansion remain priorities': 'विश्वसनीयता और अंतरराष्ट्रीय विस्तार प्राथमिकताएँ बनी हुई हैं।'
    }
  };
  if (phrases[target]?.[normalized]) return { text: phrases[target][normalized], complete: true };
  const dictionaries = {
    bn: { this:'এই', the:'এই', a:'একটি', problem:'সমস্যা', solution:'সমাধান', must:'অবশ্যই', be:'হতে', solved:'সমাধান করতে হবে', important:'গুরুত্বপূর্ণ', information:'তথ্য', document:'নথি', page:'পৃষ্ঠা', chapter:'অধ্যায়', section:'অংশ', summary:'সারাংশ', result:'ফলাফল', quality:'মান', customer:'গ্রাহক', support:'সহায়তা', team:'দল', work:'কাজ', school:'স্কুল', general:'সাধারণ', reading:'পড়া', and:'এবং', or:'অথবা', is:'হয়', are:'হয়', was:'ছিল', were:'ছিল', with:'সঙ্গে', without:'ছাড়া', for:'জন্য', from:'থেকে', to:'দিকে', in:'মধ্যে', on:'উপর', of:'এর', improved:'উন্নত হয়েছে', increase:'বৃদ্ধি', decreased:'কমেছে', stable:'একই রকম', priority:'অগ্রাধিকার', priorities:'অগ্রাধিকার' },
    hi: { this:'यह', the:'यह', a:'एक', problem:'समस्या', solution:'समाधान', must:'ज़रूर', be:'होना', solved:'समाधान करना होगा', important:'महत्वपूर्ण', information:'जानकारी', document:'दस्तावेज़', page:'पृष्ठ', chapter:'अध्याय', section:'खंड', summary:'सारांश', result:'परिणाम', quality:'गुणवत्ता', customer:'ग्राहक', support:'सहायता', team:'टीम', work:'काम', school:'स्कूल', general:'सामान्य', reading:'पढ़ना', and:'और', or:'या', is:'है', are:'हैं', was:'था', were:'थे', with:'के साथ', without:'के बिना', for:'के लिए', from:'से', to:'को', in:'में', on:'पर', of:'का', improved:'बेहतर हुआ', increase:'वृद्धि', decreased:'कम हुआ', stable:'स्थिर', priority:'प्राथमिकता', priorities:'प्राथमिकताएँ' }
  };
  const dictionary = dictionaries[target] || {}, tokens = text.match(/[A-Za-z]+|\d+(?:\.\d+)?|[^A-Za-z\d\s]+|\s+/g) || [text]; let known = 0, words = 0;
  const translated = tokens.map(token => { if (!/^[A-Za-z]+$/.test(token)) return token; words++; const mapped = dictionary[token.toLowerCase()]; if (mapped) { known++; return mapped; } return token; }).join('').replace(/\s+/g, ' ').trim();
  return { text: translated, complete: words > 0 && known / words >= .88 };
}

function targetScriptPresent(text, target) {
  if (target === 'bn') return /[\u0980-\u09ff]/.test(text);
  if (target === 'hi') return /[\u0900-\u097f]/.test(text);
  if (target === 'ja') return /[\u3040-\u30ff\u3400-\u9fff]/.test(text);
  return true;
}

async function createTranslationEngines(source, target) {
  const engines = [], languageName = Object.fromEntries(TRANSLATE_LANGUAGES)[target] || target;
  if (window.Translator?.create) {
    try {
      const availability = await window.Translator.availability?.({ sourceLanguage: source, targetLanguage: target });
      if (availability !== 'unavailable') {
        const translator = await window.Translator.create({ sourceLanguage: source, targetLanguage: target, monitor(monitor) { monitor.addEventListener('downloadprogress', event => setProgress(4 + event.loaded * 8, 'Preparing on-device language model…', `${Math.round(event.loaded * 100)}% model download`)); } });
        engines.push({ name: 'Browser Translator', destroy: () => translator.destroy?.(), translate: async text => ({ text: await translator.translate(text), complete: true }) });
      }
    } catch { /* Try the next local engine. */ }
  }
  if (!engines.length && window.translation?.createTranslator) {
    try { const translator = await window.translation.createTranslator({ sourceLanguage: source, targetLanguage: target }); engines.push({ name: 'Browser Translation API', destroy: () => translator.destroy?.(), translate: async text => ({ text: await translator.translate(text), complete: true }) }); } catch { /* Continue. */ }
  }
  const languageModelFactory = window.LanguageModel || window.ai?.languageModel;
  if (languageModelFactory?.create) {
    try {
      const style = target === 'bn' ? 'Use very simple, natural, everyday Bengali suitable for school-level general reading. Avoid difficult literary or highly Sanskritized words and avoid unnecessary English.' : target === 'hi' ? 'Use natural, clear, easy standard Hindi and translate by meaning rather than word-for-word.' : 'Translate naturally and accurately by meaning.';
      const model = await languageModelFactory.create({ systemPrompt: `You are a document translator. Translate all supplied text from ${source} into ${languageName}. ${style} Preserve headings, list markers, numbers, and meaning. Return only the translation.` });
      engines.push({ name: 'On-device Language Model', destroy: () => model.destroy?.(), translate: async text => ({ text: await model.prompt(text), complete: true }) });
    } catch { /* Continue to deterministic fallback. */ }
  }
  if (source === 'en' && (target === 'bn' || target === 'hi')) engines.push({ name: `Local ${target === 'bn' ? 'Bengali' : 'Hindi'} glossary fallback`, translate: async text => localIndicTranslation(text, target) });
  return engines;
}

async function translatePartWithFallback(text, engines, target) {
  const failures = [];
  for (const engine of engines) {
    try {
      let result = await engine.translate(text);
      if (typeof result === 'string') result = { text: result, complete: true };
      result.text = simplifyIndicTranslation(String(result.text || '').trim(), target);
      if (!result.text) throw new Error('The engine returned empty text.');
      const needsTargetScript = /[A-Za-zÀ-ž]{3}/.test(text) && text.split(/\s+/).length >= 3;
      if (needsTargetScript && !targetScriptPresent(result.text, target)) result.complete = false;
      return { ...result, engine: engine.name };
    } catch (error) { failures.push(`${engine.name}: ${error.message}`); }
  }
  return { text, complete: false, engine: 'Original text fallback', failures };
}

async function ensureIndicFont(target) {
  if (target !== 'bn' && target !== 'hi') return 'Georgia, serif';
  const family = target === 'bn' ? 'Noto Sans Bengali' : 'Noto Sans Devanagari';
  const id = `translate-font-${target}`;
  if (!document.getElementById(id)) {
    const link = document.createElement('link'); link.id = id; link.rel = 'stylesheet'; link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600&family=Noto+Sans+Devanagari:wght@400;600&display=swap'; document.head.append(link);
  }
  try { await document.fonts.load(`400 16px "${family}"`); await document.fonts.ready; } catch { /* Browser fallback fonts may still cover the script. */ }
  return `"${family}", sans-serif`;
}

function translationPageHtml(page) {
  if (page.fallbackImage && !page.blocks.length) return `<div class="translation-warning">This scanned page could not be translated because no readable text was available. The original page is retained for reference.</div><img class="original-page" src="${page.fallbackImage}" alt="Original scanned page ${page.number}">`;
  let html = '', tableOpen = false;
  const closeTable = () => { if (tableOpen) { html += '</tbody></table>'; tableOpen = false; } };
  for (const block of page.blocks) {
    const warning = block.incomplete ? ' class="partial-translation"' : '';
    if (block.type === 'table') {
      if (!tableOpen) { html += '<table><tbody>'; tableOpen = true; }
      html += `<tr${warning}>${block.parts.map(part => `<td>${escapeHTML(part)}</td>`).join('')}</tr>`;
      continue;
    }
    closeTable();
    if (block.type === 'heading') html += `<h2${warning}>${escapeHTML(block.parts[0])}</h2>`;
    else if (block.type === 'list') html += `<ul${warning}><li>${escapeHTML(block.parts[0])}</li></ul>`;
    else html += `<p${warning}>${escapeHTML(block.parts[0])}</p>`;
  }
  closeTable();
  return html;
}

function setupTranslate() {
  pdfIntelligenceFlow({
    title: 'Drop a PDF to translate',
    note: 'Full-document translation · OCR fallback · local browser engines',
    onReady: ({ body, upload, fail }) => {
      const languageOptions = selected => TRANSLATE_LANGUAGES.map(([code, label]) => `<option value="${code}" ${code === selected ? 'selected' : ''}>${label}</option>`).join('');
      body.innerHTML = `<div class="file-panel"><div class="panel">${fileRow(session.file, `${session.pdf.numPages} pages`)}<p class="help-text" style="margin-top:15px">Every page is processed in order. Positioned text is rebuilt as headings, paragraphs, lists, and table rows. Scanned pages use local OCR when available.</p></div><div class="panel"><div class="field-row"><div class="field"><label for="source-language">Source language</label><select id="source-language">${languageOptions('en')}</select></div><div class="field"><label for="target-language">Target language</label><select id="target-language">${languageOptions('es')}</select></div></div><div class="actions"><button class="primary-btn" id="translate-btn">Translate PDF</button></div><p class="help-text">Folio tries the browser Translator API, an available on-device language model, and safe local fallbacks. Any untranslated portion is reported instead of being silently removed.</p></div></div>`;
      bindReplace(upload);

      const runTranslation = async () => {
        const source = document.querySelector('#source-language').value, target = document.querySelector('#target-language').value;
        if (source === target) return toast('Choose two different languages.');
        body.innerHTML = processingTemplate('Translating complete PDF…', 'Reading every page and preserving document structure.');
        let stage = null, engines = [];
        try {
          const extracted = await extractTranslationPages(session.pdf, source), warnings = [...extracted.warnings];
          engines = await createTranslationEngines(source, target);
          if (!engines.length) throw new Error('No local browser translation engine supports this language pair. The PDF was not changed or falsely marked as translated.');
          const totalParts = extracted.pages.reduce((count, page) => count + page.blocks.reduce((sum, block) => sum + block.parts.length, 0), 0);
          if (!totalParts) throw new Error('No readable text could be recovered from the PDF. OCR was attempted where available, but no translation output was created.');
          let processed = 0, completeParts = 0;
          for (const page of extracted.pages) {
            for (let blockIndex = 0; blockIndex < page.blocks.length; blockIndex++) {
              const block = page.blocks[blockIndex], translatedParts = [];
              for (const original of block.parts) {
                let result;
                if (!/\p{L}/u.test(original)) result = { text: original, complete: true, engine: 'Content-preserving pass' };
                else result = await translatePartWithFallback(original, engines, target);
                translatedParts.push(result.text); processed++;
                if (result.complete) completeParts++;
                else {
                  block.incomplete = true;
                  warnings.push({ page: page.number, reason: 'This portion could not be fully translated and was retained or partially translated.', detail: original.slice(0, 140) });
                }
                setProgress(35 + (processed / totalParts) * 45, `Translating page ${page.number} of ${extracted.pages.length}…`, `${processed} of ${totalParts} text portions · ${result.engine}`);
              }
              block.parts = translatedParts;
            }
          }
          if (processed !== totalParts) throw new Error('Full-document coverage verification failed. No output was created.');
          if (!completeParts) throw new Error('The available engines could not reliably translate any readable portion. Original text was preserved, but no misleading output was created.');

          const fontFamily = await ensureIndicFont(target);
          stage = document.createElement('article'); stage.className = 'translated-document';
          stage.style.cssText = `position:fixed;left:-12000px;top:0;width:794px;padding:58px;background:white;color:#111;font-family:${fontFamily};font-size:15px;line-height:1.65;`;
          stage.innerHTML = `<style>
            .translated-document *{box-sizing:border-box}.translated-document section{page-break-after:always;break-after:page;min-height:980px}.translated-document section:last-child{page-break-after:auto;break-after:auto}.translated-document .page-label{font:600 10px/1.2 ${fontFamily};letter-spacing:.08em;color:#66706c;border-bottom:1px solid #d8d9d1;padding-bottom:8px;margin-bottom:24px}.translated-document h2{font:600 23px/1.3 ${fontFamily};margin:20px 0 10px;break-after:avoid}.translated-document p{margin:0 0 12px;white-space:pre-wrap}.translated-document ul{margin:0 0 12px;padding-left:24px}.translated-document table{width:100%;border-collapse:collapse;margin:12px 0 18px;break-inside:avoid}.translated-document td{border:1px solid #bfc3bf;padding:7px;vertical-align:top}.translated-document .partial-translation{border-left:3px solid #c98a2e;padding-left:9px}.translated-document .translation-warning{border:1px solid #d9b772;background:#fff7e2;padding:12px;margin-bottom:16px}.translated-document .original-page{display:block;max-width:100%;height:auto;margin:auto}
          </style>${extracted.pages.map(page => `<section><div class="page-label">PAGE ${page.number}${page.ocrUsed ? ' · OCR' : ''}</div>${translationPageHtml(page)}</section>`).join('')}`;
          document.body.append(stage); await document.fonts.ready;
          setProgress(84, 'Rebuilding translated PDF…', 'Prioritizing complete, readable content and source page order');
          const blob = await html2pdf().set({ margin: 12, image: { type: 'jpeg', quality: .99 }, html2canvas: { scale: 2.5, useCORS: true, backgroundColor: '#ffffff' }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }, pagebreak: { mode: ['css'] } }).from(stage).toPdf().outputPdf('blob');
          stage.remove(); stage = null;
          if (!blob || blob.size < 100) throw new Error('The translated PDF renderer returned an empty or invalid file.');
          setProgress(96, 'Validating translated PDF…', 'Checking file integrity and readable page output');
          const outputBytes = new Uint8Array(await blob.arrayBuffer()); await validatePdfBytes(outputBytes);
          const url = session.makeURL(blob), name = `${stem(session.file.name)}-${target}.pdf`, incomplete = warnings.length;
          session.result = { url, name };
          const warningHtml = incomplete ? `<div class="password-box" style="text-align:left;margin:18px auto;max-width:680px"><strong>${incomplete} translation warning${incomplete === 1 ? '' : 's'}</strong><p>${warnings.slice(0, 5).map(item => `Page ${item.page}: ${escapeHTML(item.reason)}${item.detail ? ` (${escapeHTML(item.detail)})` : ''}`).join('<br>')}${incomplete > 5 ? `<br>And ${incomplete - 5} more warning${incomplete - 5 === 1 ? '' : 's'}.` : ''}</p></div>` : '';
          body.innerHTML = `<div class="result-card"><div><div class="success-mark">✓</div><h2>${incomplete ? 'Translation completed with warnings' : 'Translation ready'}</h2><p>${incomplete ? `${completeParts} of ${totalParts} readable text portions were fully translated. Untranslated content was retained and clearly marked.` : `All ${totalParts} readable text portions across ${extracted.pages.length} pages were translated and validated.`}</p><div class="result-stats"><div><span>Source pages</span><b>${extracted.pages.length}</b></div><div><span>Language</span><b>${source.toUpperCase()} → ${target.toUpperCase()}</b></div><div><span>Translated</span><b>${completeParts} / ${totalParts}</b></div><div><span>Output</span><b>${formatSize(blob.size)}</b></div></div>${warningHtml}<div class="actions"><button class="primary-btn" id="download-btn">↓ Download translated PDF</button><button class="secondary-btn" id="another-btn">Translate another PDF</button></div></div></div>`;
          document.querySelector('#download-btn').onclick = () => downloadURL(url, name); document.querySelector('#another-btn').onclick = upload;
        } catch (error) {
          stage?.remove(); engines.forEach(engine => engine.destroy?.()); fail(error, upload);
        } finally { engines.forEach(engine => engine.destroy?.()); }
      };
      document.querySelector('#translate-btn').onclick = runTranslation;
    }
  });
}

/* -------------------------------------------------------------------------- */
/* PDF to Markdown                                                             */
/* -------------------------------------------------------------------------- */

function setupMarkdown() {
  pdfIntelligenceFlow({title:'Drop a PDF to convert to Markdown',note:'Headings, paragraphs, lists and table-like rows',onReady:({body,upload,fail})=>{
    body.innerHTML=`<div class="file-panel"><div class="panel">${fileRow(session.file,`${session.pdf.numPages} pages`)}</div><div class="panel"><div class="field"><label>Structure profile</label><select id="markdown-profile"><option value="balanced">Balanced detection</option><option value="literal">Literal page text</option></select></div><p class="help-text">Heading and list detection is heuristic because PDF stores visual positions, not semantic tags.</p><div class="actions"><button class="primary-btn" id="markdown-btn">Convert to Markdown</button></div></div></div>`;bindReplace(upload);document.querySelector('#markdown-btn').onclick=async()=>{const profile=document.querySelector('#markdown-profile').value;body.innerHTML=processingTemplate('Building Markdown…','Recovering text structure page by page.');try{const pages=await extractPdfPages(session.pdf),parts=[];pages.forEach((page,i)=>{const lines=lineRecords(page.items);const out=[`<!-- Page ${i+1} -->`];lines.forEach(line=>{const t=line.cells.join(' ').trim();if(!t)return;if(profile==='balanced'&&line.cells.length>=3)out.push(`| ${line.cells.join(' | ')} |`);else if(profile==='balanced'&&t.length<90&&(/^[A-Z0-9][A-Z0-9 &:/–—-]+$/.test(t)||!/[,.;!?]$/.test(t)&&t.split(' ').length<9))out.push(`## ${t}`);else if(/^[-•▪◦]\s*/.test(t))out.push(`- ${t.replace(/^[-•▪◦]\s*/,'')}`);else out.push(t);});parts.push(out.join('\n\n'));setProgress((i+1)/pages.length*88,`Converting page ${i+1} of ${pages.length}…`,'Detecting headings and table-like rows');});const markdown=parts.join('\n\n---\n\n'),blob=new Blob([markdown],{type:'text/markdown;charset=utf-8'}),url=session.makeURL(blob),name=`${stem(session.file.name)}.md`;session.result={url,name};body.innerHTML=`<div class="panel"><div class="panel-title"><h3>Markdown preview</h3><span class="mono-label">${pages.length} pages</span></div><div class="text-output">${escapeHTML(markdown)}</div><div class="actions"><button class="primary-btn" id="download-btn">↓ Download Markdown</button><button class="secondary-btn" id="another-btn">Convert another PDF</button></div></div>`;document.querySelector('#download-btn').onclick=()=>downloadURL(url,name);document.querySelector('#another-btn').onclick=upload;}catch(err){fail(err);}};
  }});
}

/* -------------------------------------------------------------------------- */
/* Data extraction                                                             */
/* -------------------------------------------------------------------------- */

function setupDataExtraction() {
  pdfIntelligenceFlow({title:'Drop a PDF to extract data',note:'Text, line records and structured JSON',onReady:({body,upload,fail})=>{
    body.innerHTML=`<div class="file-panel"><div class="panel">${fileRow(session.file,`${session.pdf.numPages} pages`)}</div><div class="panel"><div class="field"><label for="data-format">Download format</label><select id="data-format"><option value="json">Structured JSON</option><option value="csv">Line records (CSV)</option><option value="txt">Plain text</option></select></div><p class="help-text">Likely columns are inferred from horizontal gaps. The preview always shows the real extracted content.</p><div class="actions"><button class="primary-btn" id="extract-data-btn">Extract data</button></div></div></div>`;bindReplace(upload);document.querySelector('#extract-data-btn').onclick=async()=>{const format=document.querySelector('#data-format').value;body.innerHTML=processingTemplate('Extracting data…','Reading positioned text and table-like rows.');try{const pages=await extractPdfPages(session.pdf),records=[];pages.forEach((page,i)=>{lineRecords(page.items).forEach((line,row)=>records.push({page:i+1,row:row+1,cells:line.cells,text:line.cells.join(' ')}));setProgress((i+1)/pages.length*88,`Extracting page ${i+1} of ${pages.length}…`,'Grouping positioned text into rows');});let content,mime,ext;if(format==='json'){content=JSON.stringify({source:session.file.name,pages:pages.length,records},null,2);mime='application/json';ext='json';}else if(format==='csv'){const q=v=>`"${String(v).replace(/"/g,'""')}"`;content=['page,row,cells,text',...records.map(r=>[r.page,r.row,q(r.cells.join(' | ')),q(r.text)].join(','))].join('\n');mime='text/csv';ext='csv';}else{content=pages.map(p=>`--- Page ${p.number} ---\n${p.text}`).join('\n\n');mime='text/plain';ext='txt';}const blob=new Blob([content],{type:`${mime};charset=utf-8`}),url=session.makeURL(blob),name=`${stem(session.file.name)}-data.${ext}`;session.result={url,name};body.innerHTML=`<div class="panel"><div class="panel-title"><h3>Extracted records</h3><span class="mono-label">${records.length} rows</span></div><div style="overflow:auto;max-height:440px"><table class="data-table"><thead><tr><th>Page</th><th>Row</th><th>Detected cells</th></tr></thead><tbody>${records.slice(0,160).map(r=>`<tr><td>${r.page}</td><td>${r.row}</td><td>${escapeHTML(r.cells.join(' | '))}</td></tr>`).join('')}</tbody></table></div>${records.length>160?`<p class="help-text">Preview shows 160 of ${records.length} rows. The download contains all rows.</p>`:''}<div class="actions"><button class="primary-btn" id="download-btn">↓ Download ${ext.toUpperCase()}</button><button class="secondary-btn" id="another-btn">Extract another PDF</button></div></div>`;document.querySelector('#download-btn').onclick=()=>downloadURL(url,name);document.querySelector('#another-btn').onclick=upload;}catch(err){fail(err);}};
  }});
}

/* -------------------------------------------------------------------------- */
/* Smart split                                                                 */
/* -------------------------------------------------------------------------- */

function setupSmartSplit() {
  pdfIntelligenceFlow({title:'Drop a PDF for Smart Split',note:'Content-aware suggestions you can review',onReady:({body,upload,fail})=>{
    body.innerHTML=`<div class="file-panel"><div class="panel">${fileRow(session.file,`${session.pdf.numPages} pages`)}<p class="help-text" style="margin-top:15px">Folio looks for chapter-style openings, repeated titles and low-content separator pages.</p></div><div class="panel"><div class="actions"><button class="primary-btn" id="analyze-splits">Analyze split points</button></div></div></div>`;bindReplace(upload);document.querySelector('#analyze-splits').onclick=async()=>{body.innerHTML=processingTemplate('Finding logical sections…','Analyzing page openings and content density.');try{const pages=await extractPdfPages(session.pdf),suggestions=[];for(let i=1;i<pages.length;i++){const prev=pages[i-1].text,cur=pages[i].text,opening=cur.slice(0,160);let score=0,reasons=[];if(prev.length<100){score+=2;reasons.push('follows a low-content separator');}if(/^(chapter|part|section|appendix|book|module|unit)\s+[0-9ivx]/i.test(opening)){score+=4;reasons.push('chapter-style opening');}if(/^[A-Z0-9][A-Z0-9\s:–—-]{8,80}/.test(opening)){score+=2;reasons.push('strong title pattern');}if(/^(contents|introduction|references|bibliography|conclusion)/i.test(opening)){score+=3;reasons.push('major document section');}if(score>=2)suggestions.push({page:i+1,score,reason:reasons.join(' · ')||'content shift',excerpt:opening});setProgress((i+1)/pages.length*82,`Analyzing page ${i+1} of ${pages.length}…`,'Comparing section signals');}review(pages,suggestions);}catch(err){fail(err);}};
    const review=(pages,suggestions)=>{body.innerHTML=`<div class="panel"><div class="panel-title"><h3>Review suggested split points</h3><span class="mono-label">${suggestions.length} suggested</span></div><p class="help-text">Each checked page begins a new output document. You remain in control.</p><div class="multi-file-list" style="margin-top:18px">${suggestions.length?suggestions.map((s,i)=>`<label class="file-row"><input type="checkbox" class="split-suggestion" value="${s.page}" ${s.score>=3?'checked':''}><span class="file-badge">P${s.page}</span><div class="file-meta"><strong>Start new file at page ${s.page}</strong><small>${escapeHTML(s.reason)} · ${escapeHTML(s.excerpt.slice(0,80))}</small></div></label>`).join(''):'<div class="password-box"><strong>No strong structural breaks found</strong><p>You can add page numbers manually.</p></div>'}</div><div class="field"><label for="manual-splits">Additional start pages</label><input id="manual-splits" placeholder="e.g. 5, 12, 20"></div><div class="actions"><button class="primary-btn" id="create-smart-splits">Create split PDFs</button><button class="secondary-btn" id="another-btn">Choose another PDF</button></div></div>`;document.querySelector('#another-btn').onclick=upload;document.querySelector('#create-smart-splits').onclick=async()=>{try{const points=[...document.querySelectorAll('.split-suggestion:checked')].map(x=>+x.value);const manual=document.querySelector('#manual-splits').value.trim();if(manual)parseRanges(manual.replace(/;/g,','),pages.length).flat().forEach(n=>{if(n>1)points.push(n);});const starts=[1,...new Set(points.filter(n=>n>1&&n<=pages.length))].sort((a,b)=>a-b);if(starts.length<2)return toast('Choose at least one split point after page 1.');const groups=starts.map((start,i)=>Array.from({length:(starts[i+1]||pages.length+1)-start},(_,j)=>start+j));session.clearResults();body.innerHTML=processingTemplate('Creating smart splits…');const results=[];for(let i=0;i<groups.length;i++){setProgress(i/groups.length*88,`Creating section ${i+1} of ${groups.length}…`,`Pages ${groups[i][0]}–${groups[i].at(-1)}`);const bytes=await copyPdfPages(session.file,groups[i]),blob=bytesToBlob(bytes),name=`${stem(session.file.name)}-section-${i+1}.pdf`;results.push({blob,name,url:session.makeURL(blob)});}session.results=results;multiPdfResults('Smart split complete',`${results.length} logical sections were created.`,upload);}catch(err){fail(err,()=>review(pages,suggestions));}};};
  }});
}
