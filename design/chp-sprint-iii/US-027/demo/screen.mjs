import model from './scenarios.mjs';
import {seed,reduce,blockers} from './state-machine.mjs';
import {startStory,esc,control,action,card,jobSummary,attachmentTag,evidenceLink,icon,dialog,feedback,unavailable} from '../../stories/runtime.mjs';
function view(s){if(!s.access)return unavailable();const missing=blockers(s),unknown=s.message?.startsWith('unknown');let notice='';
 if(s.pending==='read')return '';
 else if(unknown)notice=feedback(s.message==='unknown-read-failed'?'Status check failed':'Completion outcome unknown',s.message==='unknown-read-failed'?'The completion result is still unknown.':'Check the job before trying again.','warning',[{label:'Check job status',attrs:'data-action="check"',icon:'refresh'}]);
 else if(s.message==='read-failed')notice=feedback('Job could not load','Try again to check the requirements.','error',[{label:'Try again',attrs:'data-action="check"',icon:'refresh'}]);
 else if(s.message==='requirements-changed')notice=feedback('Delivery proof is missing','Add proof before completing this job.','warning');
 else if(s.message==='failed')notice=feedback('Completion was rejected','','error',[{label:'Refresh requirements',attrs:'data-action="check"',icon:'refresh'}]);
 else if(s.message==='success')notice=feedback('Job completed','','success');
 else if(s.message==='unchanged')notice=feedback('Job is still In Progress','The check confirmed no completion. You can make a new explicit attempt.','info');
 if(s.message==='read-failed')return notice;
 const checks=[[s.status==='Completed'?'Completed status':'In Progress status',s.status==='In Progress'||s.status==='Completed',''],['Proof of delivery',s.proof>0,s.proof?'':'No delivery proof saved.'],['Accepted offer',s.offer,s.offer?'':'The selected offer must belong to this job.'],['Payment is Paid',s.paid,s.paid?'':'Payment is not Paid.']];
 const list=`<ul class="criteria">${checks.map(([t,ok,d])=>`<li data-met="${ok}">${icon(ok?'check':'warning')}<div><strong>${esc(t)}</strong>${d?`<span>${esc(d)}</span>`:''}</div></li>`).join('')}</ul>`;
 const complete=s.status==='In Progress'&&!unknown&&s.message!=='read-failed'?control('Run completion check','complete',{emphasis:'primary',disabled:!!s.pending}):'';
 let modal='';
 if(s.modal==='blocked'){
  const reasons=[s.status!=='In Progress'&&'The job must be In Progress.',!s.proof&&'Add delivery proof. Brief files do not qualify.',!s.offer&&'The selected offer must be Accepted.',!s.paid&&'Payment must be Paid.'].filter(Boolean);
  modal=dialog('Requirements incomplete',`<p class="cu-dialog-reference">Job #41</p><ul class="cu-dialog-list">${reasons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`,control('Got it','dismiss',{emphasis:'tertiary'})+(!s.proof?action('Add delivery proof',{href:'../../US-026/demo/screen.html',variant:'secondary'}):''));
 }
 if(s.modal==='confirm')modal=dialog(s.pending?'Completing job':'Complete job',`<p class="cu-dialog-reference">Job #41</p>${s.pending?`<div class="cu-dialog-progress" role="status">${icon('spinner')}<span>Submitting…</span></div>`:'<p>This closes the job.</p>'}`,s.pending?'':control('Keep In Progress','dismiss',{variant:'outline'})+control('Confirm completion','confirm',{emphasis:'primary'}),{pending:!!s.pending});
 const met=checks.filter(([,ok])=>ok).length;
 const requirements=card('Completion requirements',`<p class="requirement-summary muted">${met} of ${checks.length} requirements met</p>${list}<div class="actions">${complete}${!s.proof?action('View proof of delivery',{href:'../../US-026/demo/screen.html',variant:'tonal'}):''}</div>`);
 const evidence=card('Delivery evidence',s.proof?`${attachmentTag()}<div class="evidence-address">${evidenceLink('https://example.com/proof/campus-dining')}</div><p class="muted">Saved 28 Oct 2026, 14:20 ICT</p>`:`<div class="empty empty--compact">${icon('jobs')}<div><h3>No proof added yet</h3><p class="muted">Briefs and other attachments cannot replace delivery proof.</p></div></div>`);
 return`${notice}${jobSummary(s)}<div class="story-grid story-grid--task">${requirements}${evidence}</div>${modal}`;
}
startStory({model,seed,reduce,view});
