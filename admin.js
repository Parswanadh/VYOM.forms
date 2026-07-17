// VYOM Admin
const API = '/.netlify/functions/api';
let PASSWORD = '';
let DATA = {};

function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + type;
  setTimeout(() => { el.className = 'toast'; }, 3000);
}

async function api(method, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (PASSWORD) opts.headers['x-admin-password'] = PASSWORD;
  if (body) opts.body = JSON.stringify(body);
  return (await fetch(API, opts)).json();
}

async function login() {
  const pw = document.getElementById('password-input').value;
  PASSWORD = pw;
  const r = await api('POST', { action: 'save-all', data: {} });
  if (r.error) { document.getElementById('login-error').style.display = 'block'; PASSWORD = ''; return; }
  document.getElementById('login-overlay').style.display = 'none';
  document.getElementById('sidebar').classList.add('active');
  document.getElementById('main-content').classList.add('active');
  loadData();
}

function logout() {
  PASSWORD = '';
  document.getElementById('login-overlay').style.display = 'flex';
  document.getElementById('sidebar').classList.remove('active');
  document.getElementById('main-content').classList.remove('active');
}

function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
  document.querySelector('[data-tab="' + name + '"]').classList.add('active');
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

async function loadData() {
  DATA = await api('GET');
  renderEvents();
  renderGallery();
  renderMentors();
  renderLayout();
}

// Events
function renderEvents() {
  const el = document.getElementById('tab-events');
  let h = '<div class="section-header"><h1>Events</h1><button class="btn btn-primary" onclick="showEventForm()">+ Add Event</button></div>';
  h += '<div class="card"><table><thead><tr><th>Title</th><th>Category</th><th>Actions</th></tr></thead><tbody>';
  for (const e of (DATA.events || [])) {
    h += '<tr><td>' + esc(e.title) + '</td><td><span class="badge">' + esc(e.category) + '</span></td>';
    h += '<td><button class="btn btn-sm btn-primary edit-entity" data-section="events" data-id="' + e.id + '">Edit</button> ';
    h += '<button class="btn btn-sm btn-danger delete-entity" data-section="events" data-id="' + e.id + '">Delete</button></td></tr>';
  }
  h += '</tbody></table></div>';
  el.innerHTML = h;
}

function showEventForm(id) {
  const item = id ? DATA.events.find(e => e.id === id) : null;
  const v = (s) => item ? esc(item[s] || '') : '';
  const h = '<div class="modal-header"><h2>' + (item ? 'Edit Event' : 'Add Event') + '</h2><button class="modal-close" onclick="closeModal()">&times;</button></div>'
    + '<label>Title</label><input type="text" id="ef-title" value="' + v('title') + '" required>'
    + '<label>Description</label><textarea id="ef-desc" required>' + v('description') + '</textarea>'
    + '<label>Image URL</label><input type="text" id="ef-img" value="' + v('image') + '">'
    + '<label>Upload Image</label><input type="file" accept="image/*" onchange="uploadFile(this,\'ef-img\')">'
    + '<label>Category</label><input type="text" id="ef-cat" value="' + v('category') + '"><br>'
    + '<button class="btn btn-primary" id="modal-save-btn" data-section="events" data-id="' + (id || '') + '">Save</button>';
  showModal(h);
}

// Gallery
function renderGallery() {
  const el = document.getElementById('tab-gallery');
  let h = '<div class="section-header"><h1>Gallery</h1><button class="btn btn-primary" onclick="showGalleryForm()">+ Add Image</button></div>';
  h += '<div class="card"><table><thead><tr><th>Image</th><th>Title</th><th>Actions</th></tr></thead><tbody>';
  for (const g of (DATA.gallery || [])) {
    h += '<tr><td><img src="' + g.src + '" style="width:60px;height:40px;object-fit:cover;border-radius:4px" onerror="this.style.display=\'none\'"></td>';
    h += '<td>' + esc(g.title) + '</td>';
    h += '<td><button class="btn btn-sm btn-primary edit-entity" data-section="gallery" data-id="' + g.id + '">Edit</button> ';
    h += '<button class="btn btn-sm btn-danger delete-entity" data-section="gallery" data-id="' + g.id + '">Delete</button></td></tr>';
  }
  h += '</tbody></table></div>';
  el.innerHTML = h;
}

function showGalleryForm(id) {
  const item = id ? DATA.gallery.find(g => g.id === id) : null;
  const v = (s) => item ? esc(item[s] || '') : '';
  const h = '<div class="modal-header"><h2>' + (item ? 'Edit Image' : 'Add Image') + '</h2><button class="modal-close" onclick="closeModal()">&times;</button></div>'
    + '<label>Image URL</label><input type="text" id="gf-src" value="' + v('src') + '" required>'
    + '<label>Upload Image</label><input type="file" accept="image/*" onchange="uploadFile(this,\'gf-src\')">'
    + '<label>Title</label><input type="text" id="gf-title" value="' + v('title') + '" required>'
    + '<label>Description</label><textarea id="gf-desc" required>' + v('description') + '</textarea><br>'
    + '<button class="btn btn-primary" id="modal-save-btn" data-section="gallery" data-id="' + (id || '') + '">Save</button>';
  showModal(h);
}

// Mentors
function renderMentors() {
  const el = document.getElementById('tab-mentors');
  let h = '<div class="section-header"><h1>Mentors</h1><button class="btn btn-primary" onclick="showMentorForm()">+ Add Mentor</button></div>';
  h += '<div class="card"><table><thead><tr><th>Name</th><th>Role</th><th>Actions</th></tr></thead><tbody>';
  for (const m of (DATA.mentors || [])) {
    h += '<tr><td><strong>' + esc(m.name) + '</strong></td><td>' + esc(m.role) + '</td>';
    h += '<td><button class="btn btn-sm btn-primary edit-entity" data-section="mentors" data-id="' + m.id + '">Edit</button> ';
    h += '<button class="btn btn-sm btn-danger delete-entity" data-section="mentors" data-id="' + m.id + '">Delete</button></td></tr>';
  }
  h += '</tbody></table></div>';
  el.innerHTML = h;
}

function showMentorForm(id) {
  const item = id ? DATA.mentors.find(m => m.id === id) : null;
  const v = (s) => item ? esc(item[s] || '') : '';
  const h = '<div class="modal-header"><h2>' + (item ? 'Edit Mentor' : 'Add Mentor') + '</h2><button class="modal-close" onclick="closeModal()">&times;</button></div>'
    + '<label>Name</label><input type="text" id="mf-name" value="' + v('name') + '" required>'
    + '<label>Role</label><input type="text" id="mf-role" value="' + v('role') + '" required>'
    + '<label>Photo URL</label><input type="text" id="mf-photo" value="' + v('photo') + '">'
    + '<label>Upload Photo</label><input type="file" accept="image/*" onchange="uploadFile(this,\'mf-photo\')">'
    + '<label>Description</label><textarea id="mf-desc" required>' + v('description') + '</textarea><br>'
    + '<button class="btn btn-primary" id="modal-save-btn" data-section="mentors" data-id="' + (id || '') + '">Save</button>';
  showModal(h);
}

// Layout
function renderLayout() {
  const el = document.getElementById('tab-layout');
  const lay = DATA.layout || { theme: 'cosmic', animationEnabled: true, cardStyle: 'glass' };
  const themes = ['cosmic', 'nebula', 'solar'];
  const cards = ['glass', 'solid', 'border'];
  let h = '<div class="section-header"><h1>Layout Settings</h1><button class="btn btn-primary" onclick="saveLayout()">Save Changes</button></div>';
  h += '<div class="card"><h3>Theme</h3><div class="layout-grid">';
  for (const t of themes) {
    const s = t === lay.theme ? ' selected' : '';
    h += '<div class="layout-option' + s + '" data-lkey="theme" data-value="' + t + '">';
    h += '<div class="theme-preview theme-' + t + '"></div><h4>' + t.charAt(0).toUpperCase() + t.slice(1) + '</h4></div>';
  }
  h += '</div></div>';
  h += '<div class="card"><h3>Card Style</h3><div class="layout-grid">';
  for (const c of cards) {
    const s = c === lay.cardStyle ? ' selected' : '';
    h += '<div class="layout-option' + s + '" data-lkey="cardStyle" data-value="' + c + '">';
    h += '<h4>' + c.charAt(0).toUpperCase() + c.slice(1) + '</h4></div>';
  }
  h += '</div></div>';
  h += '<div class="card"><h3>Animations</h3>';
  h += '<label class="toggle"><input type="checkbox" id="anim-toggle"' + (lay.animationEnabled ? ' checked' : '') + '><span class="slider"></span></label>';
  h += '<span style="margin-left:1rem;color:var(--text-secondary)">' + (lay.animationEnabled ? 'Enabled' : 'Disabled') + '</span></div>';
  el.innerHTML = h;
  window._lay = JSON.parse(JSON.stringify(lay));
}

async function saveLayout() {
  if (!window._lay) window._lay = {};
  window._lay.animationEnabled = document.getElementById('anim-toggle') ? document.getElementById('anim-toggle').checked : true;
  const r = await api('POST', { action: 'update-layout', item: window._lay });
  if (r.ok) { toast('Layout saved!', 'success'); loadData(); }
}

// Save helpers
async function saveItem(section, id) {
  const prefixes = { events: 'ef', gallery: 'gf', mentors: 'mf' };
  const p = prefixes[section];
  if (!p) return;
  const get = (suffix) => document.getElementById(p + '-' + suffix) ? document.getElementById(p + '-' + suffix).value : '';
  const item = { title: get('title'), description: get('desc') };
  if (section === 'events') { item.image = get('img'); item.category = get('cat'); }
  if (section === 'gallery') { item.src = get('src'); item.stats = { stat1: '0', stat2: '0', label1: 'Views', label2: 'Posts' }; }
  if (section === 'mentors') { item.photo = get('photo'); item.role = get('role'); }
  if (id) item.id = id;
  const r = await api('POST', { action: id ? 'update' : 'add', section, item });
  if (r.ok) { toast('Saved!', 'success'); closeModal(); loadData(); }
}

async function deleteItem(section, id) {
  if (!confirm('Delete this item?')) return;
  const r = await api('POST', { action: 'delete', section, item: { id } });
  if (r.ok) { toast('Deleted!', 'success'); loadData(); }
}

// Image upload
async function uploadFile(input, targetId) {
  const file = input.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  try {
    const r = await fetch(API, { method: 'POST', headers: { 'x-admin-password': PASSWORD }, body: formData });
    const result = await r.json();
    if (result.ok) { document.getElementById(targetId).value = result.url; toast('Uploaded!', 'success'); }
    else { toast('Upload failed', 'error'); }
  } catch (e) { toast('Upload error', 'error'); }
}

// Utility
function esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

// Event delegation
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.edit-entity');
  if (btn) {
    const section = btn.dataset.section;
    const id = btn.dataset.id;
    if (section === 'events') showEventForm(id);
    else if (section === 'gallery') showGalleryForm(id);
    else if (section === 'mentors') showMentorForm(id);
    return;
  }
  const del = e.target.closest('.delete-entity');
  if (del) { deleteItem(del.dataset.section, del.dataset.id); return; }
  const lay = e.target.closest('.layout-option');
  if (lay) {
    lay.parentElement.querySelectorAll('.layout-option').forEach(o => o.classList.remove('selected'));
    lay.classList.add('selected');
    if (window._lay) window._lay[lay.dataset.lkey] = lay.dataset.value;
    return;
  }
  const save = e.target.closest('#modal-save-btn');
  if (save) { saveItem(save.dataset.section, save.dataset.id); }
});

function showModal(html) {
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal').style.display = 'flex';
}
