const API_BASE = (window.API_BASE || window.location.origin).replace(/\/$/, '');

const view = document.querySelector('#view');
const toastHost = document.querySelector('#toastHost');
const modal = document.querySelector('#authModal');
const authNameInput = document.querySelector('#authName');
const modeToggle = document.querySelector('#modeToggle');
const themeToggle = document.querySelector('#themeToggle');
const mitraLaunch = document.querySelector('#mitraLaunch');
const mitraPanel = document.querySelector('#mitraPanel');
const mitraClose = document.querySelector('#mitraClose');
const mitraStream = document.querySelector('#mitraStream');
const mitraPrompts = document.querySelector('#mitraPrompts');
const mitraSuggestions = document.querySelector('#mitraSuggestions');
const mitraForm = document.querySelector('#mitraForm');
const mitraInput = document.querySelector('#mitraInput');
const mitraStatus = document.querySelector('#mitraStatus');
const routeButtons = document.querySelectorAll('[data-nav]');

const DVI_BANDS = [
  { grade: 'A+', min: 810, max: 900, label: 'Outstanding', message: 'Elite achiever. Unlock cross-border sponsorships and elite funds.' },
  { grade: 'A', min: 720, max: 809, label: 'Excellent', message: 'High trust. Accelerate with sponsor-ready updates and portfolio packs.' },
  { grade: 'B', min: 630, max: 719, label: 'Very Good', message: 'Reliable performer. Keep weekly proof and mentor testimonials flowing.' },
  { grade: 'C', min: 540, max: 629, label: 'Good', message: 'Consistent growth. Add verifications and complete opportunity matches.' },
  { grade: 'D', min: 450, max: 539, label: 'Fair', message: 'You are being noticed. Focus on document verification and work samples.' },
  { grade: 'E', min: 0, max: 449, label: 'Foundation', message: 'Start logging milestones. Complete ID checks to unlock the next tier.' },
];

const state = {
  route: 'manifesto',
  mode: localStorage.getItem('mm_mode_v5') || 'student',
  user: null,
  cache: {},
  mitraHistory: JSON.parse(localStorage.getItem('mm_mitra_history_v1') || '[]'),
  mitraSuggestions: [],
  mitraOpen: false,
};

function toast(message) {
  if (!toastHost) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  toastHost.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    setTimeout(() => el.remove(), 320);
  }, 2500);
}

async function fetchJSON(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function computeBand(dvi = 0) {
  const band = DVI_BANDS.find(b => dvi >= b.min) || DVI_BANDS[DVI_BANDS.length - 1];
  const next = DVI_BANDS.slice().reverse().find(b => dvi < b.max);
  const target = next ? next.max : 900;
  return {
    ...band,
    dvi,
    percent: Math.min(100, Math.round((dvi / 900) * 100)),
    remaining: Math.max(target - dvi, 0),
    target,
  };
}

function setActiveNav(route) {
  routeButtons.forEach(btn => {
    btn.dataset.active = btn.dataset.nav === route ? 'true' : 'false';
  });
}

function setMode(mode) {
  state.mode = mode;
  localStorage.setItem('mm_mode_v5', mode);
  modeToggle.textContent = mode === 'student' ? 'Investor mode' : 'Back to student';
  modeToggle.dataset.active = mode === 'investor' ? 'true' : 'false';
  if (mode === 'investor') {
    navigate('investor');
  } else if (state.route === 'investor') {
    navigate('feed');
  }
}

function updateThemeToggle(theme) {
  if (!themeToggle) return;
  themeToggle.textContent = theme === 'light' ? 'Dark mode' : 'Light mode';
}

function setTheme(initial) {
  const stored = localStorage.getItem('mm_theme_v5');
  const theme = initial || stored || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeToggle(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('mm_theme_v5', next);
  updateThemeToggle(next);
}

function openAuth() {
  modal.classList.add('show');
  authNameInput.value = state.user?.name || '';
  authNameInput.focus();
}

function closeAuth() {
  modal.classList.remove('show');
}

async function handleSignIn() {
  const name = authNameInput.value.trim();
  if (!name) {
    toast('Please add your full name');
    return;
  }
  try {
    const { user } = await fetchJSON('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    state.user = user;
    localStorage.setItem('mm_user_v5', JSON.stringify(user));
    toast(`Welcome, ${user.name.split(' ')[0]}!`);
    closeAuth();
    Object.keys(state.cache).forEach(key => { if (key !== 'manifesto') delete state.cache[key]; });
    await loaders.profile(true);
    navigate(state.route, true);
  } catch (err) {
    console.error(err);
    toast('Unable to sign in. Try again.');
  }
}

function computeAvatar(name = '') {
  if (!name) return 'MM';
  return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

function formatTime(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  return date.toLocaleString();
}


const euroFormatter = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
function formatEUR(value = 0) {
  return euroFormatter.format(value || 0);
}

function animateSections() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  document.querySelectorAll('.section-inner').forEach(el => observer.observe(el));
  document.querySelectorAll('.feed-card, .opps-card, .stat-card, .fund').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(14px)';
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.transition = 'all .4s ease';
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          cardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    cardObserver.observe(el);
  });
}

const loaders = {
  async manifesto(force = false) {
    if (!force && state.cache.manifesto) return;
    state.cache.manifesto = await fetchJSON('/api/manifesto');
  },
  async profile(force = false) {
    if (!force && state.cache.profile) return;
    const data = await fetchJSON('/api/profile');
    state.cache.profile = data;
    if (!state.user) {
      state.user = JSON.parse(localStorage.getItem('mm_user_v5') || 'null') || data.user;
    }
  },
  async feed(force = false) {
    if (!force && state.cache.feed) return;
    const data = await fetchJSON('/api/feed');
    state.cache.feed = data.items || [];
  },
  async opportunities(force = false) {
    if (!force && state.cache.opportunities) return;
    const data = await fetchJSON('/api/opportunities');
    state.cache.opportunities = data.items || [];
  },
  async banking(force = false) {
    if (!force && state.cache.banking) return;
    state.cache.banking = await fetchJSON('/api/banking');
  },
  async investor(force = false) {
    if (!force && state.cache.investor) return;
    state.cache.investor = await fetchJSON('/api/investor');
  },
  async mitra(force = false) {
    if (!force && state.cache.mitra) return;
    state.cache.mitra = await fetchJSON('/api/mitra/tips');
  },
};

function renderManifesto() {
  const manifesto = state.cache.manifesto || {};
  const profile = state.cache.profile?.user || state.user || {};
  const dvi = Number(profile.dvi || 0);
  const band = computeBand(dvi);
  const tags = manifesto.hero?.tags || ['AI mentorship', 'Verified impact', 'DVI growth'];

  const hero = `
    <section class="section">
      <div class="section-inner">
        <div class="section-header">
          <div>
            <span class="section-badge">Dynamic Value Index</span>
            <h1 class="section-title">${manifesto.hero?.title || 'Turn Invisible Talent Into Visible Opportunity'}</h1>
            <p class="section-sub">${manifesto.hero?.summary || 'MeMetrics captures every milestone, verification, and reputation signal so people without legacy credit histories can unlock loans, sponsorships, and jobs.'}</p>
          </div>
        </div>
        <div class="dvi-panel">
          <div class="dvi-dial" style="--angle:${band.percent * 3.6}deg;">
            <div class="dial-ring"></div>
            <div class="dial-core">${band.dvi}</div>
          </div>
          <div class="dvi-info">
            <div class="dvi-band">Band ${band.grade} · ${band.label}</div>
            <div>${band.message}</div>
            <div class="dvi-progress"><span style="width:${band.percent}%"></span></div>
            <div class="meta-hint">${band.remaining > 0 ? `${band.remaining} DVI until the next unlock.` : 'You unlocked every achievement slot available.'}</div>
          </div>
        </div>
        <div class="dvi-meta">
          <div class="meta-card">
            <div class="meta-label">Signals</div>
            <div class="meta-value">Achievements · Reputation · Opportunity</div>
            <div class="meta-hint">Every verified action feeds your DVI · boosts unlock micro-loans, scholarships, and ethical sponsors.</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Invisible to unstoppable</div>
            <div class="meta-value">Built for immigrants, students, caregivers</div>
            <div class="meta-hint">No credit history? DVI gives you a measurable track record to share globally.</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">AI guardian</div>
            <div class="meta-value">Mitra inside</div>
            <div class="meta-hint">Ask Mitra for +50 DVI plans, sponsor decks, and inclusive banking strategies.</div>
          </div>
        </div>
        <div class="tag-cloud">
          ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      </div>
    </section>
  `;

  const pillars = (manifesto.pillars || []).map(p => `
    <div class="opps-card">
      <span class="pill">${p.title}</span>
      <p>${p.body}</p>
    </div>
  `).join('');

  const voices = (manifesto.voices || []).map(v => `
    <div class="feed-card">
      <header>
        <div class="author">
          <div class="avatar">${computeAvatar(v.user_id)}</div>
          <div>
            <h4>${v.user_id}</h4>
            <div class="meta-hint">DVI success story</div>
          </div>
        </div>
      </header>
      <p>${v.quote}</p>
    </div>
  `).join('');

  const pillarsSection = `
    <section class="section">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="section-title">How DVI unlocks visibility</h2>
          <p class="section-sub">Every action inside MeMetrics · verified achievements, community proof, opportunity matches · feeds your Development Value Index. Higher bands unlock premium financing, sponsorship, and jobs.</p>
        </div>
        <div class="opps-grid">${pillars}</div>
      </div>
    </section>
  `;

  const voicesSection = `
    <section class="section">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="section-title">Community voices</h2>
          <p class="section-sub">Real people crossing borders, winning scholarships, and landing fair work because they can now prove their value.</p>
        </div>
        <div class="feed-list">${voices}</div>
      </div>
    </section>
  `;

  view.innerHTML = hero + pillarsSection + voicesSection;
  animateSections();
}

function renderFeed() {
  const feed = state.cache.feed || [];
  const profile = state.cache.profile?.user || state.user || {};
  const band = computeBand(Number(profile.dvi || 0));

  const form = `
    <div class="post-composer">
      <div class="post-top">
        <div class="post-avatar">${computeAvatar(profile.name)}</div>
        <div>
          <div class="meta-label">Share milestone</div>
          <div class="meta-hint">Posts with proof (+7) · Verified proof (+20)</div>
        </div>
      </div>
      <textarea id="composerText" placeholder="Describe the proof: certifications, projects, repayments…"></textarea>
      <label class="post-upload">
        <span>?? Attach proof (png/jpg)</span>
        <input id="composerFile" type="file" accept="image/*" />
      </label>
      <div class="post-preview" id="composerPreview"><img alt="Preview" /></div>
      <div class="post-actions">
        <div class="meta-hint">Your DVI: ${band.dvi} (${band.grade}) · ${band.remaining} to ${band.target}</div>
        <button id="composerSubmit" class="post-submit" type="button">Publish update</button>
      </div>
    </div>
  `;

  const cards = feed.map(post => `
    <article class="feed-card">
      <header>
        <div class="author">
          <div class="avatar">${computeAvatar(post.display_name || post.user_id)}</div>
          <div>
            <h4>${post.display_name || post.user_id}</h4>
            <div class="meta-hint">DVI ${post.dvi ?? band.dvi}</div>
          </div>
        </div>
        <time>${formatTime(post.created_at)}</time>
      </header>
      <p>${(post.text || '').replace(/\n/g, '<br>')}</p>
      ${post.photo ? `<div class="post-media"><img src="${post.photo}" alt="Post attachment" /></div>` : ''}
      <footer>
        <span>?? ${post.like_count || 0}</span>
        <span>?? Share</span>
        <span>?? Save</span>
      </footer>
    </article>
  `).join('');

  view.innerHTML = `
    <section class="section">
      <div class="section-inner">
        <div class="section-header">
          <div>
            <span class="section-badge">Community feed</span>
            <h2 class="section-title">Proof of progress</h2>
            <p class="section-sub">Post milestones, attach proof, and watch your DVI pulse climb. Sponsors and investors monitor this feed to spot rising talent.</p>
          </div>
        </div>
        <div class="feed-wrapper">
          <aside class="feed-sidebar">
            <h3>DVI momentum</h3>
            <p>Band <strong>${band.grade}</strong> (${band.label}) · ${band.dvi}/900. ${band.message}</p>
            <div class="stat"><span>Next unlock</span><span>${band.remaining > 0 ? `${band.remaining} DVI` : 'Max Achieved'}</span></div>
            <div class="stat"><span>Proof bonus</span><span>+7 per verified post</span></div>
            <div class="stat"><span>Reputation</span><span>+1 per applaud</span></div>
            <div class="meta-hint">Attach media, diplomas, or repayments for bigger boosts. Mitra can co-write sponsor updates.</div>
          </aside>
          <div class="feed-main">
            ${form}
            <div class="feed-list">${cards}</div>
          </div>
        </div>
      </div>
    </section>
  `;

  setupComposer();
  animateSections();
}

function setupComposer() {
  const text = document.querySelector('#composerText');
  const file = document.querySelector('#composerFile');
  const preview = document.querySelector('#composerPreview');
  const previewImg = preview?.querySelector('img');
  const submit = document.querySelector('#composerSubmit');

  let photoFile = null;

  file?.addEventListener('change', () => {
    const [selected] = file.files || [];
    photoFile = selected || null;
    if (selected) {
      const reader = new FileReader();
      reader.onload = () => {
        previewImg.src = reader.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(selected);
    } else {
      preview.style.display = 'none';
    }
  });

  submit?.addEventListener('click', async () => {
    const content = (text?.value || '').trim();
    if (!content) {
      toast('Add a milestone description');
      return;
    }
    try {
      submit.disabled = true;
      const body = new FormData();
      body.append('user_id', state.user?.user_id || 'guest');
      body.append('text', content);
      if (photoFile) body.append('photo', photoFile);
      const res = await fetch(`${API_BASE}/api/feed`, { method: 'POST', body });
      if (!res.ok) throw new Error('Could not publish');
      text.value = '';
      if (preview) preview.style.display = 'none';
      file.value = '';
      photoFile = null;
      await loaders.feed(true);
      renderFeed();
      toast('Milestone published');
    } catch (err) {
      console.error(err);
      toast('Failed to publish. Try again.');
    } finally {
      submit.disabled = false;
    }
  });
}

function renderProfile() {
  const profile = state.cache.profile?.user || state.user || {};
  const achievements = state.cache.profile?.achievements || [];
  const notifications = state.cache.profile?.notifications || [];
  const band = computeBand(Number(profile.dvi || 0));

  const timeline = achievements.map(item => `
    <li>
      <h4>${item.title}</h4>
      <span>${item.year}</span>
      <div class="meta-hint">Verified proof adds +20 DVI</div>
    </li>
  `).join('') || '<li><h4>No achievements yet</h4><span>Start logging proof to unlock D band</span></li>';

  const notificationsList = notifications.map(n => `
    <li>
      <h4>${n.title}</h4>
      <span>${formatTime(n.created_at)}</span>
      <div class="meta-hint">${n.body}</div>
    </li>
  `).join('') || '<li><h4>No notifications</h4><span>Complete a milestone to notify sponsors</span></li>';

  view.innerHTML = `
    <section class="section">
      <div class="section-inner">
        <div class="section-header">
          <div>
            <span class="section-badge">Profile</span>
            <h2 class="section-title">${profile.name || 'Guest Explorer'}</h2>
            <p class="section-sub">${profile.headline || 'Tell the world what makes you unstoppable. Verified experiences, community impact, and Mitra guidance fuel your DVI journey.'}</p>
          </div>
        </div>
        <div class="profile-masthead">
          <div class="profile-avatar">${computeAvatar(profile.name)}</div>
          <div class="profile-info">
            <h3 class="headline">${profile.about || 'Add a bio to explain your mission and region-specific goals.'}</h3>
            <div class="profile-tags">
              ${(profile.skills || ['AI Ethics', 'Inclusive Finance']).map(skill => `<span class="profile-tag">${skill}</span>`).join('')}
            </div>
            <div class="dvi-meta">
              <div class="meta-card">
                <div class="meta-label">DVI Band</div>
                <div class="meta-value">${band.grade} · ${band.label}</div>
                <div class="meta-hint">${band.message}</div>
              </div>
              <div class="meta-card">
                <div class="meta-label">Next unlock</div>
                <div class="meta-value">${band.remaining > 0 ? `${band.remaining} DVI` : 'Max tier unlocked'}</div>
                <div class="meta-hint">Post verified media & opportunity completions for bigger boosts.</div>
              </div>
            </div>
          </div>
        </div>
        <div class="dvi-progress"><span style="width:${band.percent}%"></span></div>
        <div class="profile-columns">
          <div class="card glass">
            <div class="section-header">
              <h3 class="section-title">Milestone timeline</h3>
            </div>
            <ul class="timeline">${timeline}</ul>
          </div>
          <div class="card glass">
            <div class="section-header">
              <h3 class="section-title">Signals & notifications</h3>
            </div>
            <ul class="timeline">${notificationsList}</ul>
          </div>
        </div>
      </div>
    </section>
  `;

  animateSections();
}

function renderOpportunities() {
  const items = state.cache.opportunities || [];
  view.innerHTML = `
    <section class="section">
      <div class="section-inner">
        <div class="section-header">
          <div>
            <span class="section-badge">Opportunities</span>
            <h2 class="section-title">Curated pathways</h2>
            <p class="section-sub">Scholarships, internships, fellowships, and inclusive employers that recognize DVI as proof of potential. Region-aware and mentor-reviewed.</p>
          </div>
        </div>
        <div class="opps-grid">
          ${items.map(item => `
            <article class="opps-card">
              <span class="pill">${item.type || 'Opportunity'}</span>
              <h3>${item.title}</h3>
              <div class="org">${item.org} · ${item.location || 'Global'}</div>
              <p>${item.summary || 'No description'}</p>
              <div class="meta"><span>Deadline</span><span>${item.deadline || 'Rolling'}</span></div>
              <a href="${item.link}" target="_blank" rel="noopener">View details</a>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `;
  animateSections();
}

function renderBanking() {
  const data = state.cache.banking || {};
  const txns = data.transactions || [];
  view.innerHTML = `
    <section class="section">
      <div class="section-inner">
        <div class="section-header">
          <div>
            <span class="section-badge">MeMetrics Banking</span>
            <h2 class="section-title">Inclusive finance cockpit</h2>
            <p class="section-sub">Balances, repayments, and cashflow visualized like a modern fintech. Repayments feed your DVI, and sponsors track this sheet before funding.</p>
          </div>
        </div>
        <div class="bank-card">
          <h3>Current balance</h3>
          <div class="balance">${formatEUR(data.balance || 0)}</div>
          <div class="foot">
            <span>IBAN-like: ${data.iban_like || 'ME-XXXX-001'}</span>
            <span>Trusted by sponsors</span>
          </div>
        </div>
        <div class="bank-stats">
          <div class="stat-card">
            <div class="trend">Income 30d</div>
            <div class="value positive">${formatEUR(data.income || 0)}</div>
            <div class="meta-hint">Attach payslips or sponsor briefs to supercharge DVI.</div>
          </div>
          <div class="stat-card">
            <div class="trend">Spend 30d</div>
            <div class="value negative">${formatEUR(data.spend || 0)}</div>
            <div class="meta-hint">Healthy repayment streak boosts your banking reputation.</div>
          </div>
          <div class="stat-card">
            <div class="trend">Categories</div>
            <div class="value">${Object.keys(data.categories || {}).length || 0}</div>
            <div class="meta-hint">Diversify spend to unlock sponsor budgeting features.</div>
          </div>
        </div>
        <table class="transactions">
          <thead>
            <tr><th>Counterparty</th><th>Reference</th><th>Date</th><th>Amount</th></tr>
          </thead>
          <tbody>
            ${txns.map(tx => `
              <tr>
                <td>${tx.counterparty}</td>
                <td>${tx.reference || ''}</td>
                <td>${formatTime(tx.timestamp)}</td>
                <td class="${tx.amount >= 0 ? 'positive' : 'negative'}">${formatEUR(tx.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
  animateSections();
}

function renderInvestor() {
  const data = state.cache.investor || {};
  const funds = data.funds || [];
  view.innerHTML = `
    <section class="section">
      <div class="section-inner">
        <div class="section-header">
          <div>
            <span class="section-badge">Investor mode</span>
            <h2 class="section-title">Spot the next wave</h2>
            <p class="section-sub">Sponsor dashboards show assets under mentorship, live ROI, and curated funds channelling capital to high-DVI talent.</p>
          </div>
        </div>
        <div class="investor-hero">
          <div class="investor-card">
            <h3>AUM</h3>
            <div class="metric">${formatEUR(data.aum || 0)}</div>
            <div class="meta-hint">Total managed capital backing high-DVI explorers.</div>
          </div>
          <div class="investor-card">
            <h3>Active sponsorships</h3>
            <div class="metric">${data.active_sponsorships || 0}</div>
            <div class="meta-hint">Partners receiving weekly proof-of-impact updates.</div>
          </div>
          <div class="investor-card">
            <h3>ROI</h3>
            <div class="metric">${(data.roi || 0).toFixed(1)}%</div>
            <div class="meta-hint">Inclusive investments with measurable community upside.</div>
          </div>
        </div>
        <div class="investor-stream">
          ${funds.map(fund => {
            const pct = Math.min(100, Math.round((fund.funded / fund.target) * 100));
            return `
              <div class="fund">
                <div class="pill">${fund.focus}</div>
                <h4>${fund.title}</h4>
                <div class="meta-hint">${formatEUR(fund.funded)} / ${formatEUR(fund.target)} (${pct}%)</div>
                <div class="progress"><span style="width:${pct}%"></span></div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </section>
  `;
  animateSections();
}

const renderers = {
  manifesto: renderManifesto,
  feed: renderFeed,
  profile: renderProfile,
  opportunities: renderOpportunities,
  banking: renderBanking,
  investor: renderInvestor,
};

async function navigate(route, force = false) {
  state.route = route;
  setActiveNav(route);
  try {
    if (route !== 'manifesto') await loaders.profile(false);
    await loaders[route](force);
    renderers[route]();
  } catch (err) {
    console.error(err);
    view.innerHTML = `<section class="section"><div class="section-inner"><h2>Something went wrong</h2><p>${err.message}</p></div></section>`;
  }
}

function renderMitraPanel() {
  if (!mitraStream) return;
  mitraStream.innerHTML = state.mitraHistory.map(entry => `
    <div class="mitra-msg ${entry.role}">${entry.text}</div>
  `).join('');
  mitraStream.scrollTop = mitraStream.scrollHeight;

  if (mitraSuggestions) {
    if (!state.mitraSuggestions.length) {
      mitraSuggestions.innerHTML = '';
    } else {
      mitraSuggestions.innerHTML = `
        <h4>Follow-ups</h4>
        ${state.mitraSuggestions.map(s => `<div class="suggestion-pill">${s}</div>`).join('')}
      `;
    }
  }

  if (mitraPrompts) {
    const prompts = state.cache.mitra?.prompts || [
      'Help me unlock B band',
      'Design a sponsor update',
      'Break down my repayments plan',
    ];
    mitraPrompts.innerHTML = prompts.map(prompt => `<button type="button" data-prompt="${prompt}">${prompt}</button>`).join('');
    mitraPrompts.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        mitraInput.value = btn.dataset.prompt;
        mitraInput.focus();
        handleMitraSubmit(btn.dataset.prompt);
      });
    });
  }
}

async function handleMitraSubmit(messageOverride) {
  const input = mitraInput?.value.trim();
  const message = (messageOverride || input);
  if (!message) return;
  state.mitraHistory.push({ role: 'user', text: message });
  localStorage.setItem('mm_mitra_history_v1', JSON.stringify(state.mitraHistory.slice(-40)));
  renderMitraPanel();
  if (!messageOverride && mitraInput) mitraInput.value = '';
  if (mitraStatus) mitraStatus.textContent = 'Mitra is thinking…';
  try {
    const payload = await fetchJSON('/api/mitra/chat', {
      method: 'POST',
      body: JSON.stringify({
        user_id: state.user?.user_id || 'guest',
        message,
        region: state.user?.region || 'Global',
        dvi: Number(state.user?.dvi || state.cache.profile?.user?.dvi || 0),
      }),
    });
    state.mitraHistory.push({ role: 'ai', text: payload.reply || "Let's keep building." });
    state.mitraSuggestions = Array.isArray(payload.suggestions) ? payload.suggestions : [];
    localStorage.setItem('mm_mitra_history_v1', JSON.stringify(state.mitraHistory.slice(-40)));
  } catch (err) {
    console.error(err);
    state.mitraHistory.push({ role: 'ai', text: 'I could not reach the Mitra AI right now. Try again in a minute.' });
  } finally {
    renderMitraPanel();
    if (mitraStatus) mitraStatus.textContent = '';
  }
}

function toggleMitra(open) {
  state.mitraOpen = open !== undefined ? open : !state.mitraOpen;
  if (state.mitraOpen) {
    mitraPanel.classList.add('show');
    renderMitraPanel();
    loaders.mitra();
    mitraInput?.focus();
  } else {
    mitraPanel.classList.remove('show');
  }
}

function bindEvents() {
  routeButtons.forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });
  document.querySelector('#signinBtn')?.addEventListener('click', openAuth);
  document.querySelector('#authCancel')?.addEventListener('click', closeAuth);
  document.querySelector('#authConfirm')?.addEventListener('click', handleSignIn);
  authNameInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') handleSignIn();
  });
  modeToggle?.addEventListener('click', () => setMode(state.mode === 'student' ? 'investor' : 'student'));
  themeToggle?.addEventListener('click', toggleTheme);
  mitraLaunch?.addEventListener('click', () => toggleMitra(true));
  mitraClose?.addEventListener('click', () => toggleMitra(false));
  mitraForm?.addEventListener('submit', event => {
    event.preventDefault();
    handleMitraSubmit();
  });
}

async function bootstrap() {
  try {
    state.user = JSON.parse(localStorage.getItem('mm_user_v5') || 'null');
  } catch (err) {
    state.user = null;
  }
  setTheme();
  bindEvents();
  await loaders.manifesto();
  await loaders.profile();
  navigate('manifesto');
  if (state.mode === 'investor') setMode('investor');
  renderMitraPanel();
}

window.addEventListener('DOMContentLoaded', bootstrap);

