
async function initCoach(){
 const data=await (await fetch('data/strategies.json')).json();
 const form=document.querySelector('#coach-form'), results=document.querySelector('#coach-results'), summary=document.querySelector('#coach-summary');
 function score(s,f){
  let p=0,r=[];
  if(f.problem && s.problems.includes(f.problem)){p+=45;r.push('directly addresses the classroom problem')}
  if(f.course && s.courses.includes(f.course)){p+=20;r.push('strong course fit')}
  if(f.minutes>=s.time_min && f.minutes<=s.time_max){p+=18;r.push('fits the available time')}
  else if(f.minutes>=s.time_min){p+=7;r.push('can be compressed')}
  if(f.technology && s.technology===f.technology){p+=6;r.push('matches technology access')}
  if(f.energy && s.energy===f.energy){p+=6;r.push('matches desired energy')}
  if(f.experience && s.teacher_experience===f.experience){p+=5;r.push('fits teacher experience')}
  return {points:p,reasons:r}
 }
 form.addEventListener('submit',e=>{
  e.preventDefault();
  const f={problem:problem.value,course:course.value,minutes:+minutes.value,technology:technology.value,energy:energy.value,experience:experience.value};
  const ranked=data.map(s=>({...s,...score(s,f)})).sort((a,b)=>b.points-a.points).slice(0,7);
  summary.innerHTML='<strong>Ranked recommendations:</strong> exact matches receive the most weight, followed by course, time, technology, energy, and teacher experience.';
  results.innerHTML=ranked.map((s,i)=>`<article class="card recommendation"><div class="rank">#${i+1}</div><div class="meta">${s.id} · ${s.category}</div><h3><a href="strategies/${s.slug}.html">${s.title}</a></h3><p>${s.summary}</p><p><strong>Why it fits:</strong> ${s.reasons.length?s.reasons.join(', '):'flexible across many classroom settings'}.</p><p class="meta">${s.time_min}–${s.time_max} min · Prep ${s.preparation}/5 · Movement ${s.movement}/5</p></article>`).join('');
 });
}
initCoach();
