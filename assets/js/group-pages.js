const pageBody = document.body;
const sidebarToggle = document.querySelector('#sidebar-toggle');
const sidebarOverlay = document.querySelector('#sidebar-overlay');

sidebarToggle?.addEventListener('click', () => pageBody.classList.toggle('sidebar-open'));
sidebarOverlay?.addEventListener('click', () => pageBody.classList.remove('sidebar-open'));

const escapeHtml = value =>
  String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);

const asArray = value => Array.isArray(value) ? value : [];

const groupRules = {
  independent: {
    categories: ['Reflection & Closure'],
    prefixes: ['RC-'],
    terms: ['independent', 'individual', 'reflection', 'writing', 'calculation', 'personal decision', 'exit ticket', 'retrieval']
  },
  pairs: {
    terms: ['pair', 'partner', 'peer feedback', 'turn and talk', 'think-pair', 'compare with a partner', 'rehearsal']
  },
  'small-group': {
    terms: ['small group', 'collaboration', 'team roles', 'expert group', 'jigsaw', 'group decision', 'team recommendation', 'affinity mapping']
  },
  'whole-class': {
    categories: ['Discussion Protocols'],
    prefixes: ['DP-'],
    terms: ['whole class', 'debate', 'discussion', 'four corners', 'gallery walk', 'consensus', 'controversy', 'movement']
  },
  cases: {
    terms: ['case', 'decision', 'evidence', 'stakeholder', 'recommendation', 'alternatives', 'error analysis', 'controversy']
  },
  simulations: {
    categories: ['Business Simulations'],
    prefixes: ['BS-', 'SIM-'],
    terms: ['simulation', 'professional roles', 'consulting', 'boardroom', 'crisis management', 'negotiation']
  },
  presentations: {
    categories: ['Presentation Formats'],
    prefixes: ['PF-'],
    terms: ['presentation', 'pitch', 'speaking', 'product demonstration', 'board presentation', 'ted-style']
  },
  'review-closure': {
    categories: ['Review & Assessment', 'Reflection & Closure'],
    prefixes: ['RA-', 'RC-'],
    terms: ['review', 'assessment', 'closure', 'reflection', 'retrieval', 'check understanding', 'error analysis']
  }
};

function belongsToGroup(strategy, key) {
  const rule = groupRules[key];
  if (!rule) return false;

  const category = String(strategy.category || '');
  const id = String(strategy.id || '');
  const searchable = JSON.stringify(strategy).toLowerCase();

  const categoryMatch = asArray(rule.categories).includes(category);
  const prefixMatch = asArray(rule.prefixes).some(prefix => id.startsWith(prefix));
  const termMatch = asArray(rule.terms).some(term => searchable.includes(term.toLowerCase()));

  return categoryMatch || prefixMatch || termMatch;
}

function buildCard(strategy) {
  const min = Number(strategy.time_min);
  const max = Number(strategy.time_max);
  const timing = Number.isFinite(min) && Number.isFinite(max)
    ? `${min}–${max}`
    : 'Flexible';

  const movement = Number.isFinite(Number(strategy.movement))
    ? `${strategy.movement}/5`
    : 'Varies';

  const pills = asArray(strategy.bestFor)
    .slice(0, 3)
    .map(item => `<span>${escapeHtml(item)}</span>`)
    .join('');

  const url = `strategies/${encodeURIComponent(strategy.slug)}.html`;

  return `
    <article class="strategy-card" data-card-url="${escapeHtml(url)}" tabindex="0" role="link" aria-label="Open ${escapeHtml(strategy.title)}">
      <div class="card-accent"></div>
      <div class="card-content">
        <div class="card-meta">
          <span>${escapeHtml(strategy.id)} · ${escapeHtml(strategy.category || 'Strategy Library')}</span>
        </div>
        <h3><a href="${escapeHtml(url)}">${escapeHtml(strategy.title)}</a></h3>
        <p>${escapeHtml(strategy.summary || 'A complete classroom-ready strategy guide.')}</p>
        <div class="card-pills">${pills}</div>
        <div class="card-stats">
          <div><strong>${escapeHtml(timing)} min</strong><small>Timing</small></div>
          <div><strong>${escapeHtml(movement)}</strong><small>Movement</small></div>
          <div><strong>${escapeHtml(strategy.energy || 'Flexible')}</strong><small>Energy</small></div>
        </div>
        <a class="card-open" href="${escapeHtml(url)}">
          <span>Open strategy guide</span><b aria-hidden="true">→</b>
        </a>
      </div>
    </article>`;
}

function matchesTime(strategy, value) {
  if (!value) return true;

  const min = Number(strategy.time_min);
  const max = Number(strategy.time_max);

  if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
  if (value === '20') return max <= 20;
  if (value === '45') return min <= 45;
  if (value === '90') return min <= 90;
  return true;
}

async function initGroupPage() {
  const grid = document.querySelector('#group-strategy-grid');
  if (!grid) return;

  const groupKey = document.body.dataset.groupKey;
  const search = document.querySelector('#group-search');
  const course = document.querySelector('#group-course');
  const time = document.querySelector('#group-time');
  const reset = document.querySelector('#group-reset');
  const count = document.querySelector('#group-result-count');
  const chips = document.querySelector('#group-active-filters');
  const section = document.querySelector('#strategies');

  try {
    const response = await fetch('data/strategies.json');
    if (!response.ok) throw new Error(`Strategy data returned ${response.status}`);

    const allStrategies = await response.json();
    const groupStrategies = allStrategies.filter(strategy =>
      belongsToGroup(strategy, groupKey)
    );

    [...new Set(groupStrategies.flatMap(strategy => asArray(strategy.courses)))]
      .filter(Boolean)
      .sort()
      .forEach(value => {
        course.insertAdjacentHTML(
          'beforeend',
          `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`
        );
      });

    const params = new URLSearchParams(window.location.search);
    if (params.get('search')) search.value = params.get('search');
    if (params.get('time')) time.value = params.get('time');
    if (params.get('course')) course.value = params.get('course');

    function draw() {
      const query = search.value.trim().toLowerCase();

      const filtered = groupStrategies.filter(strategy =>
        (!query || JSON.stringify(strategy).toLowerCase().includes(query)) &&
        (!course.value || asArray(strategy.courses).includes(course.value)) &&
        matchesTime(strategy, time.value)
      );

      grid.innerHTML = filtered.length
        ? filtered.map(buildCard).join('')
        : '<div class="empty-state">No strategies match those filters. Try a broader search or reset this category.</div>';

      grid.querySelectorAll('[data-card-url]').forEach(card => {
        card.addEventListener('click', event => {
          if (event.target.closest('a, button, input, select, textarea')) return;
          window.location.href = card.dataset.cardUrl;
        });

        card.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            window.location.href = card.dataset.cardUrl;
          }
        });
      });

      count.textContent = `${filtered.length} ${filtered.length === 1 ? 'strategy' : 'strategies'}`;

      chips.innerHTML = '';
      const active = [
        [search.value && 'Search', search.value, () => { search.value = ''; }],
        [course.value && 'Course', course.value, () => { course.value = ''; }],
        [time.value && 'Time', time.options[time.selectedIndex]?.text, () => { time.value = ''; }]
      ].filter(item => item[0]);

      active.forEach(([label, value, clearValue]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'filter-chip';
        button.textContent = `${label}: ${value} ×`;
        button.addEventListener('click', () => {
          clearValue();
          draw();
        });
        chips.appendChild(button);
      });
    }

    [search, course, time].forEach(control => {
      control.addEventListener(control === search ? 'input' : 'change', draw);
    });

    reset.addEventListener('click', () => {
      search.value = '';
      course.value = '';
      time.value = '';
      history.replaceState(null, '', `${window.location.pathname}#strategies`);
      draw();
      search.focus();
    });

    document.querySelectorAll('[data-group-search]').forEach(button => {
      button.addEventListener('click', () => {
        search.value = button.dataset.groupSearch || '';
        course.value = '';
        time.value = '';
        draw();

        history.replaceState(
          null,
          '',
          `${window.location.pathname}${search.value ? `?search=${encodeURIComponent(search.value)}` : ''}#strategies`
        );

        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    draw();

    if (window.location.hash === '#strategies' || params.size) {
      requestAnimationFrame(() =>
        section.scrollIntoView({ behavior: 'auto', block: 'start' })
      );
    }
  } catch (error) {
    console.error(error);
    grid.innerHTML =
      '<div class="empty-state">This category could not load. Confirm that data/strategies.json is present and refresh after GitHub Pages deploys.</div>';
    count.textContent = 'Collection unavailable';
  }
}

initGroupPage();
