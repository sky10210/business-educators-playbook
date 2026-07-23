// Phase 4 global theme loader
(function loadPlaybookTheme() {
  if (document.querySelector('link[data-playbook-theme]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'assets/css/playbook-theme.css';
  link.dataset.playbookTheme = 'opening-bell';
  document.head.appendChild(link);
})();

const body = document.body;
const toggle = document.querySelector('#sidebar-toggle');
const overlay = document.querySelector('#sidebar-overlay');

if (toggle) {
  toggle.addEventListener('click', () => body.classList.toggle('sidebar-open'));
}
if (overlay) {
  overlay.addEventListener('click', () => body.classList.remove('sidebar-open'));
}

const esc = value =>
  String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);

const arr = value => Array.isArray(value) ? value : [];

function categoryFor(strategy) {
  if (strategy.category) return strategy.category;

  return {
    ECS: 'Essential Classroom Structures',
    BS: 'Business Simulations',
    SIM: 'Business Simulations',
    PF: 'Presentation Formats',
    RA: 'Review & Assessment',
    RC: 'Reflection & Closure',
    DP: 'Discussion Protocols',
    SUP: 'Supplemental Structures'
  }[(strategy.id || '').split('-')[0]] || 'Strategy Library';
}

function strategyCard(strategy) {
  const pills = arr(strategy.bestFor)
    .slice(0, 3)
    .map(item => `<span>${esc(item)}</span>`)
    .join('');

  const min = Number(strategy.time_min);
  const max = Number(strategy.time_max);
  const timing = Number.isFinite(min) && Number.isFinite(max)
    ? `${min}–${max}`
    : 'Flexible';

  const movement = Number.isFinite(Number(strategy.movement))
    ? `${strategy.movement}/5`
    : 'Varies';

  const url = `strategies/${encodeURIComponent(strategy.slug)}.html`;

  return `
    <article
      class="strategy-card"
      data-card-url="${esc(url)}"
      tabindex="0"
      role="link"
      aria-label="Open ${esc(strategy.title)}"
    >
      <div class="card-accent"></div>
      <div class="card-content">
        <div class="card-meta">
          <span>${esc(strategy.id)} · ${esc(categoryFor(strategy))}</span>
        </div>

        <h3><a href="${esc(url)}">${esc(strategy.title)}</a></h3>
        <p>${esc(strategy.summary || 'A complete classroom-ready strategy guide.')}</p>

        <div class="card-pills">${pills}</div>

        <div class="card-stats">
          <div><strong>${esc(timing)} min</strong><small>Timing</small></div>
          <div><strong>${esc(movement)}</strong><small>Movement</small></div>
          <div><strong>${esc(strategy.energy || 'Flexible')}</strong><small>Energy</small></div>
        </div>

        <a class="card-open" href="${esc(url)}">
          <span>Open strategy guide</span><b aria-hidden="true">→</b>
        </a>
      </div>
    </article>`;
}

function activateStrategyCards(grid) {
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
}

async function initLibrary() {
  const grid = document.querySelector('#strategy-grid');
  if (!grid) return;

  const search = document.querySelector('#search');
  const course = document.querySelector('#course-filter');
  const category = document.querySelector('#category-filter');
  const time = document.querySelector('#time-filter');
  const clear = document.querySelector('#clear-filters');
  const chips = document.querySelector('#active-filters');
  const count = document.querySelector('#result-count');
  const library = document.querySelector('#library');

  try {
    const response = await fetch('data/strategies.json');
    if (!response.ok) throw new Error(`Strategy data returned ${response.status}`);

    const strategies = await response.json();
    const total = document.querySelector('#strategy-count');
    if (total) total.textContent = strategies.length;

    [...new Set(strategies.flatMap(item => arr(item.courses)))]
      .filter(Boolean)
      .sort()
      .forEach(value => {
        course?.insertAdjacentHTML(
          'beforeend',
          `<option value="${esc(value)}">${esc(value)}</option>`
        );
      });

    [...new Set(strategies.map(categoryFor))]
      .sort()
      .forEach(value => {
        category?.insertAdjacentHTML(
          'beforeend',
          `<option value="${esc(value)}">${esc(value)}</option>`
        );
      });

    const params = new URLSearchParams(window.location.search);
    if (params.get('search') && search) search.value = params.get('search');
    if (params.get('time') && time) time.value = params.get('time');

    if (params.get('category') && category) {
      const matchingStrategy = strategies.find(item =>
        (item.id || '').startsWith(params.get('category'))
      );
      if (matchingStrategy) category.value = categoryFor(matchingStrategy);
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

    function draw() {
      const query = (search?.value || '').trim().toLowerCase();

      const filtered = strategies.filter(strategy =>
        (!query ||
          JSON.stringify({
            ...strategy,
            category: categoryFor(strategy)
          }).toLowerCase().includes(query)) &&
        (!course?.value || arr(strategy.courses).includes(course.value)) &&
        (!category?.value || categoryFor(strategy) === category.value) &&
        matchesTime(strategy, time?.value)
      );

      grid.innerHTML = filtered.length
        ? filtered.map(strategyCard).join('')
        : '<div class="empty-state">No strategies match those filters. Try a broader search or reset the library.</div>';

      activateStrategyCards(grid);

      if (count) {
        count.textContent = `${filtered.length} ${filtered.length === 1 ? 'strategy' : 'strategies'}`;
      }

      if (!chips) return;
      chips.innerHTML = '';

      const active = [
        [search?.value && 'Search', search?.value, () => { search.value = ''; }],
        [course?.value && 'Course', course?.value, () => { course.value = ''; }],
        [category?.value && 'Section', category?.value, () => { category.value = ''; }],
        [
          time?.value && 'Time',
          time?.options[time.selectedIndex]?.text,
          () => { time.value = ''; }
        ]
      ].filter(item => item[0]);

      active.forEach(([label, value, reset]) => {
        const button = document.createElement('button');
        button.className = 'filter-chip';
        button.type = 'button';
        button.textContent = `${label}: ${value} ×`;
        button.addEventListener('click', () => {
          reset();
          draw();
        });
        chips.appendChild(button);
      });
    }

    [search, course, category, time].forEach(control => {
      control?.addEventListener(control === search ? 'input' : 'change', draw);
    });

    clear?.addEventListener('click', () => {
      if (search) search.value = '';
      if (course) course.value = '';
      if (category) category.value = '';
      if (time) time.value = '';
      draw();
      search?.focus();
    });

    document.querySelectorAll('[data-quick]').forEach(button => {
      button.addEventListener('click', () => {
        if (search) search.value = button.dataset.quick || '';
        draw();

        if (library) {
          history.replaceState(
            null,
            '',
            `${window.location.pathname}?search=${encodeURIComponent(search.value)}#library`
          );
          library.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    draw();

    // Query-string links from the sidebar now land visibly at the library.
    if (window.location.hash === '#library' || params.has('search') || params.has('time') || params.has('category')) {
      requestAnimationFrame(() => {
        library?.scrollIntoView({ behavior: 'auto', block: 'start' });
      });
    }
  } catch (error) {
    console.error(error);
    grid.innerHTML =
      '<div class="empty-state">The library could not load. Confirm that data/strategies.json is uploaded and refresh after GitHub Pages finishes deploying.</div>';
    if (count) count.textContent = 'Library unavailable';
  }
}

initLibrary();

const toc = [...document.querySelectorAll('.page-toc a')];
if (toc.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        toc.forEach(anchor => {
          anchor.classList.toggle(
            'active',
            anchor.getAttribute('href') === `#${entry.target.id}`
          );
        });
      }
    });
  }, { rootMargin: '-18% 0px -72% 0px' });

  toc
    .map(anchor => document.querySelector(anchor.getAttribute('href')))
    .filter(Boolean)
    .forEach(target => observer.observe(target));
}

// Activity Finder
(function initFinder() {
  const controls = {
    action: document.querySelector('#finder-action'),
    grouping: document.querySelector('#finder-grouping'),
    time: document.querySelector('#finder-time'),
    energy: document.querySelector('#finder-energy'),
    need: document.querySelector('#finder-need'),
    course: document.querySelector('#finder-course')
  };

  if (!controls.action) return;

  const result = document.querySelector('#finder-result');
  const resultLink = document.querySelector('#finder-result-link');
  const reset = document.querySelector('#finder-reset');

  const pathwayMap = {
    discuss: ['discussion', 'Get more students talking'],
    analyze: ['analysis', 'Analyze a case or business problem'],
    decide: ['decisions', 'Make and defend a decision'],
    create: ['simulation', 'Create through a realistic business task'],
    present: ['present', 'Present clearly and concisely'],
    practice: ['review', 'Review without another worksheet'],
    reflect: ['closure', 'Close the lesson with evidence'],
    independent: ['independent', 'Protect independent thinking'],
    pairs: ['discussion', 'Build participation through pairs'],
    'small-groups': ['groups', 'Improve small-group work'],
    'whole-class': ['depth', 'Build a stronger whole-class discussion'],
    mixed: ['differentiation', 'Use multiple groupings for access and variety'],
    quick: ['quick', 'Use a fast, low-prep structure'],
    standard: ['decisions', 'Use a complete decision or discussion cycle'],
    extended: ['simulation', 'Run a deeper business simulation'],
    'multi-day': ['simulation', 'Build a sustained real-world business experience'],
    calm: ['independent', 'Use a calm, focused structure'],
    moderate: ['analysis', 'Use structured interaction and analysis'],
    high: ['movement', 'Add purposeful movement'],
    participation: ['discussion', 'Get more students talking'],
    movement: ['movement', 'Add purposeful movement'],
    depth: ['depth', 'Build deeper discussion'],
    accountability: ['groups', 'Improve small-group accountability'],
    differentiation: ['differentiation', 'Differentiate without separate lessons'],
    'real-world': ['simulation', 'Run a real-world business simulation'],
    assessment: ['check', 'Check understanding during the lesson'],
    closure: ['closure', 'Close the lesson with evidence']
  };

  function selectedValues() {
    return Object.values(controls)
      .map(control => control && control.value)
      .filter(Boolean);
  }

  function choosePathway(values) {
    if (values.includes('real-world') || values.includes('multi-day')) return pathwayMap['real-world'];
    if (values.includes('high') || values.includes('movement')) return pathwayMap.movement;
    if (values.includes('assessment')) return pathwayMap.assessment;
    if (values.includes('closure') || values.includes('reflect')) return pathwayMap.closure;
    if (values.includes('present')) return pathwayMap.present;
    if (values.includes('analyze')) return pathwayMap.analyze;
    if (values.includes('decide')) return pathwayMap.decide;
    if (values.includes('practice')) return pathwayMap.practice;
    if (values.includes('differentiation') || values.includes('mixed')) return pathwayMap.differentiation;
    if (values.includes('small-groups') || values.includes('accountability')) return pathwayMap['small-groups'];
    if (values.includes('independent') || values.includes('calm')) return pathwayMap.independent;
    if (values.includes('quick')) return pathwayMap.quick;
    if (values.includes('discuss') || values.includes('pairs') || values.includes('participation')) return pathwayMap.discuss;
    return pathwayMap[values[0]];
  }

  function updateFinder(scrollToCard) {
    const values = selectedValues();
    document.querySelectorAll('.pathway-card').forEach(card =>
      card.classList.remove('finder-highlight')
    );

    if (!values.length) {
      result.querySelector('strong').textContent =
        'Choose a dropdown to reveal a pathway.';
      result.querySelector('p').textContent =
        'The matching pathway card will be highlighted below.';
      resultLink.textContent = 'Browse pathways';
      resultLink.href = '#pathways';
      return;
    }

    const match = choosePathway(values);
    if (!match) return;

    const [id, label] = match;
    const card = document.querySelector(`[data-pathway="${id}"]`);
    if (card) card.classList.add('finder-highlight');

    const selectedCourse = controls.course.value;
    const courseNote = selectedCourse ? ` for ${selectedCourse}` : '';

    result.querySelector('strong').textContent = label + courseNote + '.';
    result.querySelector('p').textContent =
      'Open the highlighted card for the best matching library search.';
    resultLink.textContent = 'View recommended pathway';
    resultLink.href = `#pathway-${id}`;

    if (scrollToCard && card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  Object.values(controls).forEach(control => {
    control.addEventListener('change', () => updateFinder(true));
  });

  reset?.addEventListener('click', () => {
    Object.values(controls).forEach(control => {
      control.value = '';
    });
    updateFinder(false);
    document.querySelector('#finder-controls')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
