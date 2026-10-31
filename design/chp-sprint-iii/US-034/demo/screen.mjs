import model from './scenarios.mjs';
import {seed,reduce,qualifying,summary,LONG_REVIEW_LENGTH,reviewPreview} from './state-machine.mjs';
import {startStory,esc,control,action,card,badge,verificationBadge,date,icon,feedback,dialog} from '../../stories/runtime.mjs';

const stars=n=>`<span class="rating" role="img" aria-label="${n} out of 5 stars"><span aria-hidden="true">${'★'.repeat(n)}${'☆'.repeat(5-n)}</span></span>`;
function comment(s,r){
 if(!r.comment)return '<p class="review-comment-empty muted">No written feedback.</p>';
 if(r.comment.length<=LONG_REVIEW_LENGTH)return `<p class="review-comment-text">${esc(r.comment)}</p>`;
 const open=s.expanded.includes(r.id);
 return `<div class="review-comment"><p class="review-preview">${esc(reviewPreview(r.comment))}</p><details data-review-id="${r.id}" ${open?'open':''}><summary><span class="when-closed">Read full review</span><span class="when-open">Show less</span></summary><p class="review-comment-text">${esc(r.comment)}</p></details></div>`;
}
function reviewCard(s,r){
 return `<article class="review-card" aria-labelledby="review-author-${r.id}"><header class="review-card-header cu-status-heading"><div class="review-author cu-status-copy"><strong id="review-author-${r.id}">${esc(r.creator)}</strong><time class="review-date muted" datetime="${esc(r.createdAt)}">${esc(date(r.createdAt))}</time></div>${verificationBadge('Verified',{attrs:'aria-label="Verified completed job" title="Review from a completed job"'})}</header><div class="review-rating-row">${stars(r.rating)}</div>${comment(s,r)}<footer class="review-record"><span class="review-job-reference">Job #${r.jobId}</span></footer></article>`;
}
function view(s){
 if(!s.access)return card('Profile unavailable','<p>This profile is not available.</p>');
 const stats=summary(s.rows),rows=qualifying(s.rows),filtered=rows.filter(r=>s.filter==='all'||r.rating===Number(s.filter)),pages=Math.max(1,Math.ceil(filtered.length/s.pageSize));
 const profile=`<section class="card profile-card" aria-labelledby="profile-name"><div class="profile-heading"><span class="profile-avatar" aria-hidden="true">MS</span><div><h2 id="profile-name">${esc(s.long?'Mali Sirichulalongkorn — มาลี ศิริจุฬาลงกรณ์':'Mali S.')}</h2><p class="muted">Survey Marketer</p></div></div><p class="profile-specialties muted">Campus research · Survey distribution</p><p class="profile-bio">I help research teams reach students with thoughtful survey campaigns and clear delivery reports.</p></section>`;
 if(s.pending)return`${profile}<div class="skeleton" aria-hidden="true"></div>`;
 if(s.error)return`${profile}${feedback('Reviews could not load','Try again to load ratings and reviews.','error',[{label:'Try again',attrs:'data-action="check"',icon:'refresh'}])}`;
 const rating=stats.count?`<div class="rating-summary"><div><span class="rating-number">${stats.average.toFixed(2)}</span><span class="muted"> / 5</span><p>${stats.count} verified review${stats.count===1?'':'s'}</p></div><div class="distribution" aria-label="Rating distribution">${stats.distribution.map(([n,count])=>`<div><span class="rating-level">${n}<span aria-hidden="true">★</span></span><progress max="${stats.count}" value="${count}" aria-label="${n} ${n===1?'star':'stars'}: ${count} review${count===1?'':'s'}"></progress><span class="rating-count">${count}</span></div>`).join('')}</div></div>`:`<div class="empty rating-empty">${icon('profile')}<h3>No ratings yet</h3><p class="muted">Ratings appear after the first completed-job review.</p></div>`;
 const filter=rows.length?`<form data-submit="filter" data-auto-submit class="review-filter"><label class="field"><span class="cu-sr-only">Filter by rating</span><select name="filter">${[['all','All ratings'],...Array.from({length:5},(_,i)=>[String(5-i),`${5-i} ${5-i===1?'star':'stars'}`])].map(([value,label])=>`<option value="${value}" ${s.filter===value?'selected':''}>${label}</option>`).join('')}</select></label></form>`:'';
 const list=!rows.length?`<div class="review-empty"><div class="empty-state-heading">${icon('invites')}<h3>No reviews yet</h3></div><p class="muted">Completed-job reviews will appear here.</p></div>`:filtered.length?`<div class="review-list">${filtered.slice((s.page-1)*s.pageSize,s.page*s.pageSize).map(r=>reviewCard(s,r)).join('')}</div>`:`<div class="review-empty"><div class="empty-state-heading">${icon('invites')}<h3>No reviews match this rating</h3></div>${control('Show all ratings','clear-filter',{emphasis:'tertiary'})}</div>`;
 const pager=pages>1?`<nav class="pagination" aria-label="Review pages">${s.page>1?control('Previous','previous',{variant:'quiet',format:'compact',icon:'chevron'}):''}<span>Page ${s.page} of ${pages}</span>${s.page<pages?control('Next','next',{variant:'quiet',format:'compact',icon:'chevron'}):''}</nav>`:'';
 const history=`<section class="card review-history-card"><header class="review-history-heading"><div><h2 id="reviews-heading" tabindex="-1">Verified reviews</h2>${s.filter!=='all'?`<p class="review-result-count">${filtered.length} of ${rows.length} reviews</p>`:''}</div>${filter}</header>${list}${pager}</section>`;
 const job=''; // Public reviews expose a job reference, not private Creator-only contract navigation.
 return `<div class="story-grid story-grid--reviews"><div class="review-context"><div class="review-profile">${profile}</div><div class="review-ratings">${card('Ratings',rating)}</div></div><div class="review-history">${history}</div></div>${job}`;
}
function storyReduce(s,e){
 if(e.type.startsWith('job-')){const id=Number(e.type.slice(4));return qualifying(s.rows).some(r=>r.jobId===id)?{...s,jobModal:id}:s;}
 if(e.type==='dismiss')return{...s,jobModal:null};
 return reduce(s,e);
}
const initial=id=>{const s=seed(id),job=Number(new URLSearchParams(location.search).get('job'));if(qualifying(s.rows).some(r=>r.jobId===job))s.jobModal=job;return s;};
startStory({model,seed:initial,reduce:storyReduce,view,readOnly:true});
