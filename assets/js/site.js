
const body=document.body,toggle=document.querySelector('#sidebar-toggle'),overlay=document.querySelector('#sidebar-overlay');if(toggle)toggle.addEventListener('click',()=>body.classList.toggle('sidebar-open'));if(overlay)overlay.addEventListener('click',()=>body.classList.remove('sidebar-open'));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));const arr=v=>Array.isArray(v)?v:[];
function cat(s){if(s.category)return s.category;return{ECS:'Essential Classroom Structures',BS:'Business Simulations',SIM:'Business Simulations',PF:'Presentation Formats',RA:'Review & Assessment',RC:'Reflection & Closure',DP:'Discussion Protocols',SUP:'Supplemental Structures'}[(s.id||'').split('-')[0]]||'Strategy Library'}
function card(s){const pills=arr(s.bestFor).slice(0,3).map(x=>`<span>${esc(x)}</span>`).join('');const min=Number(s.time_min),max=Number(s.time_max),timing=Number.isFinite(min)&&Number.isFinite(max)?`${min}–${max}`:'Flexible',movement=Number.isFinite(Number(s.movement))?`${s.movement}/5`:'Varies';return`<article class="strategy-card"><div class="card-accent"></div><div class="card-content"><div class="card-meta"><span>${esc(s.id)} · ${esc(cat(s))}</span><span class="card-status">${s.status==='production'?'Complete':'Developing'}</span></div><h3><a href="strategies/${esc(s.slug)}.html">${esc(s.title)}</a></h3><p>${esc(s.summary||'A complete classroom-ready strategy guide.')}</p><div class="card-pills">${pills}</div><div class="card-stats"><div><strong>${esc(timing)} min</strong><small>Timing</small></div><div><strong>${esc(movement)}</strong><small>Movement</small></div><div><strong>${esc(s.energy||'Flexible')}</strong><small>Energy</small></div></div><a class="card-open" href="strategies/${esc(s.slug)}.html"><span>Open complete guide</span><b>→</b></a></div></article>`}
async function init(){const grid=document.querySelector('#strategy-grid');if(!grid)return;const search=document.querySelector('#search'),course=document.querySelector('#course-filter'),category=document.querySelector('#category-filter'),time=document.querySelector('#time-filter'),clear=document.querySelector('#clear-filters'),chips=document.querySelector('#active-filters'),count=document.querySelector('#result-count');try{const res=await fetch('data/strategies.json');if(!res.ok)throw Error(res.status);const list=await res.json();const total=document.querySelector('#strategy-count');if(total)total.textContent=list.length;[...new Set(list.flatMap(s=>arr(s.courses)))].filter(Boolean).sort().forEach(v=>course?.insertAdjacentHTML('beforeend',`<option value="${esc(v)}">${esc(v)}</option>`));[...new Set(list.map(cat))].sort().forEach(v=>category?.insertAdjacentHTML('beforeend',`<option value="${esc(v)}">${esc(v)}</option>`));const params=new URLSearchParams(location.search);if(params.get('search'))search.value=params.get('search');if(params.get('category')){const match=list.find(s=>(s.id||'').startsWith(params.get('category')));if(match)category.value=cat(match)}if(params.get('time'))time.value=params.get('time')
function tm(s,v){if(!v)return true;const min=Number(s.time_min),max=Number(s.time_max);if(!Number.isFinite(min)||!Number.isFinite(max))return false;if(v==='20')return max<=20;if(v==='45')return min<=45;if(v==='90')return min<=90;return true}
function draw(){const q=search.value.trim().toLowerCase();const filtered=list.filter(s=>(!q||JSON.stringify({...s,category:cat(s)}).toLowerCase().includes(q))&&(!course.value||arr(s.courses).includes(course.value))&&(!category.value||cat(s)===category.value)&&tm(s,time.value));grid.innerHTML=filtered.length?filtered.map(card).join(''):'<div class="empty-state">No strategies match those filters. Try a broader search or reset the library.</div>';count.textContent=`${filtered.length} ${filtered.length===1?'strategy':'strategies'}`;chips.innerHTML='';[[search.value&&'Search',search.value,()=>search.value=''],[course.value&&'Course',course.value,()=>course.value=''],[category.value&&'Section',category.value,()=>category.value=''],[time.value&&'Time',time.options[time.selectedIndex]?.text,()=>time.value='']].filter(x=>x[0]).forEach(([label,value,reset])=>{const b=document.createElement('button');b.className='filter-chip';b.textContent=`${label}: ${value} ×`;b.onclick=()=>{reset();draw()};chips.appendChild(b)})}
[search,course,category,time].forEach(el=>el?.addEventListener(el===search?'input':'change',draw));clear.onclick=()=>{search.value='';course.value='';category.value='';time.value='';draw()};document.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>{search.value=b.dataset.quick;document.querySelector('#library').scrollIntoView({behavior:'smooth'});draw()});draw()}catch(e){console.error(e);grid.innerHTML='<div class="empty-state">The library could not load. Refresh after GitHub Pages finishes deploying.</div>'}}
init();
const toc=[...document.querySelectorAll('.page-toc a')];if(toc.length){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)toc.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${e.target.id}`))}),{rootMargin:'-18% 0px -72% 0px'});toc.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean).forEach(t=>observer.observe(t))}


// v3.3 Activity Finder
(function(){
  const controls = {
    action: document.querySelector('#finder-action'),
    grouping: document.querySelector('#finder-grouping'),
    time: document.querySelector('#finder-time'),
    energy: document.querySelector('#finder-energy'),
    need: document.querySelector('#finder-need'),
    course: document.querySelector('#finder-course')
  };
  if(!controls.action) return;

  const result = document.querySelector('#finder-result');
  const resultLink = document.querySelector('#finder-result-link');
  const reset = document.querySelector('#finder-reset');

  const pathwayMap = {
    discuss: ['discussion','Get more students talking'],
    analyze: ['analysis','Analyze a case or business problem'],
    decide: ['decisions','Make and defend a decision'],
    create: ['simulation','Create through a realistic business task'],
    present: ['present','Present clearly and concisely'],
    practice: ['review','Review without another worksheet'],
    reflect: ['closure','Close the lesson with evidence'],
    independent: ['independent','Protect independent thinking'],
    pairs: ['discussion','Build participation through pairs'],
    'small-groups': ['groups','Improve small-group work'],
    'whole-class': ['depth','Build a stronger whole-class discussion'],
    mixed: ['differentiation','Use multiple groupings for access and variety'],
    quick: ['quick','Use a fast, low-prep structure'],
    standard: ['decisions','Use a complete decision or discussion cycle'],
    extended: ['simulation','Run a deeper business simulation'],
    'multi-day': ['simulation','Build a sustained real-world business experience'],
    calm: ['independent','Use a calm, focused structure'],
    moderate: ['analysis','Use structured interaction and analysis'],
    high: ['movement','Add purposeful movement'],
    participation: ['discussion','Get more students talking'],
    movement: ['movement','Add purposeful movement'],
    depth: ['depth','Build deeper discussion'],
    accountability: ['groups','Improve small-group accountability'],
    differentiation: ['differentiation','Differentiate without separate lessons'],
    'real-world': ['simulation','Run a real-world business simulation'],
    assessment: ['check','Check understanding during the lesson'],
    closure: ['closure','Close the lesson with evidence']
  };

  function selectedValues(){
    return Object.values(controls).map(el => el && el.value).filter(Boolean);
  }

  function choosePathway(values){
    if(values.includes('real-world') || values.includes('multi-day')) return pathwayMap['real-world'];
    if(values.includes('high') || values.includes('movement')) return pathwayMap.movement;
    if(values.includes('assessment')) return pathwayMap.assessment;
    if(values.includes('closure') || values.includes('reflect')) return pathwayMap.closure;
    if(values.includes('present')) return pathwayMap.present;
    if(values.includes('analyze')) return pathwayMap.analyze;
    if(values.includes('decide')) return pathwayMap.decide;
    if(values.includes('practice')) return pathwayMap.practice;
    if(values.includes('differentiation') || values.includes('mixed')) return pathwayMap.differentiation;
    if(values.includes('small-groups') || values.includes('accountability')) return pathwayMap['small-groups'];
    if(values.includes('independent') || values.includes('calm')) return pathwayMap.independent;
    if(values.includes('quick')) return pathwayMap.quick;
    if(values.includes('discuss') || values.includes('pairs') || values.includes('participation')) return pathwayMap.discuss;
    return pathwayMap[values[0]];
  }

  function updateFinder(scrollToCard){
    const values = selectedValues();
    document.querySelectorAll('.pathway-card').forEach(card => card.classList.remove('finder-highlight'));

    if(!values.length){
      result.querySelector('strong').textContent = 'Choose a dropdown to reveal a pathway.';
      result.querySelector('p').textContent = 'The matching pathway card will be highlighted below.';
      resultLink.textContent = 'Browse pathways';
      resultLink.href = '#pathways';
      return;
    }

    const match = choosePathway(values);
    if(!match) return;
    const [id, label] = match;
    const card = document.querySelector(`[data-pathway="${id}"]`);
    if(card) card.classList.add('finder-highlight');

    const course = controls.course.value;
    const courseNote = course ? ` for ${course}` : '';
    result.querySelector('strong').textContent = label + courseNote + '.';
    result.querySelector('p').textContent = 'Open the highlighted card for the best matching library search.';
    resultLink.textContent = 'View recommended pathway';
    resultLink.href = `#pathway-${id}`;

    if(scrollToCard && card){
      card.scrollIntoView({behavior:'smooth', block:'center'});
    }
  }

  Object.values(controls).forEach(control => {
    control.addEventListener('change', () => updateFinder(true));
  });

  reset.addEventListener('click', () => {
    Object.values(controls).forEach(control => control.value = '');
    updateFinder(false);
    document.querySelector('#finder-controls').scrollIntoView({behavior:'smooth', block:'start'});
  });
})();
