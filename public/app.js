(() => {
  'use strict';
  const config = window.DEX_CONFIG || {};
  const apiBase = String(config.apiBase || '').replace(/\/$/, '');
  const app = document.getElementById('app');
  const toast = document.getElementById('notice');
  const ROLES = { andrew: 'Andrew', greyson: 'Greyson' };
  const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const pad = n => String(n).padStart(2, '0');
  const enc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[ch]));
  const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(cents / 100);
  const humanTime = ms => new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateLabel = day => new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const show = text => { toast.textContent = text; toast.classList.add('visible'); clearTimeout(show.timer); show.timer = setTimeout(() => toast.classList.remove('visible'), 4400); };
  const other = role => role === 'andrew' ? 'greyson' : 'andrew';
  const dayAt = (day, hm) => { const [h, m] = hm.split(':').map(Number); const d = new Date(day + 'T00:00:00'); d.setHours(h, m, 0, 0); return d.getTime(); };
  const addDays = (day, n) => { const d = new Date(day + 'T12:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const hourInput = ms => `${pad(new Date(ms).getHours())}:${pad(new Date(ms).getMinutes())}`;
  const state = {
    step: 'gate', ticket: null, token: localStorage.getItem('dex:token:v1') || null,
    role: null, selectedRole: null, status: null, invite: null,
    data: null, draft: null, dirty: false, preview: false,
    view: 'day', screen: 'calendar', date: localToday(), fact: null,
    cameoTimer: null, pollTimer: null, cameoVisible: false, busy: false
  };

  function consumeInvite() {
    const url = new URL(location.href);
    const match = /^#invite=([a-fA-F0-9]{48,128})$/.exec(url.hash);
    if (match) {
      sessionStorage.setItem('dex:invite', match[1]);
      history.replaceState(null, '', url.pathname + url.search);
    }
    state.invite = sessionStorage.getItem('dex:invite') || '';
  }
  async function api(path, method = 'GET', payload = null, publicRequest = false) {
    if (!apiBase) throw new Error('The private sync service has not been connected yet.');
    const headers = { 'Accept': 'application/json' };
    if (payload !== null) headers['Content-Type'] = 'application/json';
    if (!publicRequest && state.token) headers.Authorization = `Bearer ${state.token}`;
    const response = await fetch(`${apiBase}${path}`, { method, headers, body: payload === null ? undefined : JSON.stringify(payload), cache: 'no-store' });
    let body = {};
    try { body = await response.json(); } catch { /* network or malformed response */ }
    if (!response.ok) throw new Error(body.error || `Server error (${response.status})`);
    return body;
  }
  async function busyAction(action) {
    if (state.busy) return;
    state.busy = true;
    try { await action(); } catch (error) { show(error.message || 'Something went wrong'); }
    finally { state.busy = false; }
  }
  function gateMarkup() {
    const warning = !apiBase
      ? `<div class="callout"><strong>Preview build</strong><p>The site is ready to view, but private accounts and two-device sync require a separate backend to be deployed. No real schedule or bill data is stored here.</p></div>`
      : '';
    return `<div class="entry-shell"><div class="entry-art" aria-hidden="true"><span class="entry-grid"></span><span class="entry-ring">D</span></div>
      <section class="entry-panel"><p class="eyebrow">A very small household operation</p><h1>DEX<span class="accent">/</span> Scheduler</h1>
      <p class="muted large">Know who's out, who's coming home and what the humans have forgotten to pay.</p>
      <div class="entry-rule"><span></span> Authorized household personnel only <span></span></div>
      <form id="entry-form"><label for="entry-password">Household entry password</label><input id="entry-password" name="password" type="password" placeholder="Enter the household password" autocomplete="off" required autofocus>
      <button type="submit" class="button primary wide">Enter the den <span aria-hidden="true">→</span></button></form>
      ${warning}<p class="fineprint">The shared entry phrase is a welcome step, not security for private data. Individual accounts require the separate private service.</p>
      </section></div>`;
  }
  function rolesMarkup() {
    const claimed = state.status?.claimed || [];
    return `<div class="entry-shell compact"><section class="entry-panel">
      <button class="back" data-action="back-to-gate">← Back</button><p class="eyebrow">The household registry</p><h1>Who's reporting in?</h1>
      <p class="muted">Each person has a separate password. You can view both published schedules, but only edit your own.</p>
      <div class="role-grid">${Object.entries(ROLES).map(([id, name]) => `<button class="role-card ${id}" data-role="${id}"><span class="role-icon">${name.charAt(0)}</span><strong>${name}</strong><small>${claimed.includes(id) ? 'Sign in to your account' : 'Create your account'}</small></button>`).join('')}</div>
      ${!apiBase ? `<div class="callout"><strong>Private backend not connected.</strong><p>Accounts cannot be created on GitHub Pages alone. You can inspect the sample interface without creating a real account.</p><button class="button soft" data-action="preview">View sample dashboard</button></div>` : ''}
      </section></div>`;
  }
  function passwordMarkup() {
    const claimed = state.status?.claimed?.includes(state.selectedRole);
    const display = ROLES[state.selectedRole];
    return `<div class="entry-shell compact"><section class="entry-panel">
      <button class="back" data-action="back-to-roles">← Choose a different person</button><p class="eyebrow">${enc(display)}'s account</p>
      <h1>${claimed ? 'Welcome back.' : 'Make it yours.'}</h1>
      <p class="muted">${claimed ? 'Enter your personal password to see the shared schedule.' : 'Create a personal password. Only your own schedule can be edited from your account.'}</p>
      <form id="account-form">
        <label for="user-password">${claimed ? 'Your password' : 'Create password (10+ characters)'}</label>
        <input id="user-password" name="password" type="password" required minlength="${claimed ? '1' : '10'}" autocomplete="${claimed ? 'current-password' : 'new-password'}">
        ${claimed ? '' : `<label for="confirm-password">Confirm password</label><input id="confirm-password" name="confirm" type="password" required minlength="10" autocomplete="new-password">`}
        ${!claimed && !state.invite ? `<div class="callout"><strong>Personal setup link required</strong><p>Each of you gets a one-time private setup link from the person deploying the backend. The shared word “Dexter” alone cannot protect account registration on a public website.</p><label for="invite-code">Personal setup code</label><input id="invite-code" name="invite" type="password" autocomplete="off" placeholder="Paste your private setup code"></div>` : ''}
        <button type="submit" class="button primary wide" ${!apiBase ? 'disabled' : ''}>${claimed ? 'Sign in' : 'Create private account'} →</button>
      </form>
      ${!apiBase ? '<div class="callout">Account creation is unavailable until the sync service is connected. <button class="button soft" data-action="preview">Explore the sample dashboard</button></div>' : ''}
      </section></div>`;
  }
  function demoState() {
    const d = localToday();
    return {
      role: 'andrew',
      schedules: {
        andrew: { revision: 1, events: [{ id: 'demo-a', start: dayAt(d, '13:00'), end: dayAt(d, '15:30'), label: 'Illustrative example' }], updatedAt: new Date().toISOString() },
        greyson: { revision: 2, events: [{ id: 'demo-g', start: dayAt(d, '09:00'), end: dayAt(d, '17:30'), label: 'Illustrative example' }], updatedAt: new Date().toISOString() }
      },
      bills: [
        { id: 'demo-b', title: 'Example internet bill', amount_cents: 7500, owner: 'shared', due_date: d, recurrence: 'monthly' },
        { id: 'demo-c', title: 'Example phone bill', amount_cents: 4800, owner: 'greyson', due_date: addDays(d, 3), recurrence: 'none' }
      ], payments: [], activity: [], interests: [{ role:'andrew', tags:['history', 'space'] }, { role:'greyson', tags:['animals'] }]
    };
  }
  function getStoredDraft() {
    if (state.preview) return null;
    try { return JSON.parse(localStorage.getItem(`dex:draft:${state.role}`)); } catch { return null; }
  }
  function resetDraft() {
    const row = state.data.schedules[state.role] || { revision: 0, events: [] };
    state.draft = structuredClone(row.events);
    state.dirty = false;
  }
  function restoreDraft() {
    const saved = getStoredDraft();
    const row = state.data.schedules[state.role] || { revision: 0, events: [] };
    if (saved?.dirty && saved.baseRevision === row.revision && Array.isArray(saved.events)) { state.draft = saved.events; state.dirty = true; }
    else { resetDraft(); if (saved && !state.preview) localStorage.removeItem(`dex:draft:${state.role}`); }
  }
  function saveDraft() {
    state.dirty = true;
    if (!state.preview) localStorage.setItem(`dex:draft:${state.role}`, JSON.stringify({ baseRevision: state.data.schedules[state.role].revision, events: state.draft, dirty: true }));
  }
  function viewedEvents(role) {
    if (state.role === role && state.dirty) return state.draft;
    return state.data.schedules[role]?.events || [];
  }
  function daysInView() {
    if (state.view === 'day') return [state.date];
    const d = new Date(state.date + 'T12:00:00');
    const distanceFromMonday = (d.getDay() + 6) % 7;
    const monday = addDays(state.date, -distanceFromMonday);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }
  function segmentsFor(day) {
    const from = dayAt(day, '00:00'), to = dayAt(addDays(day, 1), '00:00');
    const entries = Object.keys(ROLES).flatMap(role => viewedEvents(role).filter(e => e.start < to && e.end > from).map(e => ({ start: Math.max(from, e.start), end: Math.min(to, e.end), role })));
    const edges = [...new Set([from, to, ...entries.flatMap(e => [e.start, e.end])])].sort((a,b) => a - b);
    const segments = [];
    for (let i = 0; i < edges.length - 1; i++) {
      const a = edges[i], b = edges[i+1];
      const active = new Set(entries.filter(e => e.start < b && e.end > a).map(e => e.role));
      if (!active.size) continue;
      const person = active.size > 1 ? 'purple' : active.has('andrew') ? 'red' : 'blue';
      const pending = state.dirty && active.has(state.role);
      segments.push({ left: (a-from)/(to-from)*100, width: (b-a)/(to-from)*100, person, pending, start: a, end: b });
    }
    return segments;
  }
  function recurringOccurrence(bill, day) {
    if (bill.recurrence === 'none') return bill.due_date === day;
    if (day < bill.due_date) return false;
    const dueDay = Number(bill.due_date.slice(8,10));
    const d = new Date(day + 'T12:00:00');
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return d.getDate() === Math.min(last, dueDay);
  }
  function billsFor(day) { return state.data.bills.filter(b => recurringOccurrence(b, day)); }
  function paymentFor(billId, day) { return state.data.payments.find(p => p.bill_id === billId && p.occurrence_date === day); }
  function dayRow(day) {
    const bars = segmentsFor(day).map(s => `<span class="timeline-segment ${s.person}${s.pending ? ' draft' : ''}" style="left:${s.left.toFixed(4)}%;width:${s.width.toFixed(4)}%" title="${enc(`${s.person} away · ${humanTime(s.start)}–${humanTime(s.end)}${s.pending?' · unpublished draft':''}`)}"></span>`).join('');
    const bills = billsFor(day);
    const total = bills.reduce((sum,b) => sum+b.amount_cents,0);
    return `<div class="day-row ${day === localToday() ? 'today' : ''}">
      <div class="day-label"><span>${enc(dateLabel(day))}</span>${bills.length ? `<button class="bill-marker" data-action="bill-day" data-day="${day}" aria-label="Show bills due ${enc(dateLabel(day))}">💰 ${money(total)}</button>` : ''}</div>
      <div class="timeline-track" data-timeline-day="${day}" role="group" aria-label="Scheduled away times for ${enc(dateLabel(day))}. Long press and drag to create a draft. Click Add away for an accessible alternative.">
        <span class="hour-grid" aria-hidden="true"></span>${bars}<span class="time-cursor" style="display:${day===localToday()?'block':'none'};left:${((Date.now()-dayAt(day,'00:00'))/(dayAt(addDays(day,1),'00:00')-dayAt(day,'00:00'))*100).toFixed(3)}%"></span>
      </div></div>`;
  }
  function dailySummary() {
    const next = other(state.role);
    const current = Date.now();
    const rows = viewedEvents(next).filter(e => e.end > current).sort((a,b) => a.start-b.start);
    const currentAway = rows.find(e => e.start <= current && current < e.end);
    if (currentAway) return { label: `${ROLES[next]} is scheduled out`, value: `Expected home ${humanTime(currentAway.end)}`, detail: 'Planned time, not live location' };
    if (rows.length) return { label: `${ROLES[next]} is assumed home`, value: `Next away ends ${new Date(rows[0].end).toLocaleDateString('en-US',{weekday:'short'})} · ${humanTime(rows[0].end)}`, detail: 'Home is assumed unless marked out' };
    return { label: `${ROLES[next]} is assumed home`, value: 'No upcoming away blocks', detail: 'Home is assumed unless marked out' };
  }
  function calendarContent() {
    const day = dailySummary();
    return `<section class="page-heading"><div><p class="eyebrow">Availability · Planned, not tracked</p><h1>Who's home?</h1><p class="muted">One shared timeline. You schedule only the time you'll be out.</p></div>
      <div class="button-set"><button class="button soft" data-action="show-updates">Updates ${state.data.activity.length ? `<span class="counter">${state.data.activity.length}</span>` : ''}</button><button class="button primary" data-action="add-away" ${state.preview ? 'disabled' : ''}>+ Add away time</button></div></section>
      <div class="summary-grid"><div class="summary-primary"><span class="eyebrow">${enc(day.label)}</span><div class="summary-value">${enc(day.value)}</div><div class="muted small">${enc(day.detail)}</div></div>
      <div class="summary-secondary"><span class="eyebrow">Your schedule</span><strong>${state.dirty ? 'Unpublished edits' : 'All changes published'}</strong><span class="muted small">${state.dirty ? 'Only you can see these drafts.' : 'Last published information shown below.'}</span></div></div>
      <section class="panel calendar-panel"><div class="panel-header"><div><h2>Timeline</h2><p class="muted small">Red: Andrew · Blue: Greyson · Purple: overlap</p></div>
        <div class="view-controls"><button class="icon-button" data-action="prev-date" aria-label="Previous ${state.view}">‹</button><input aria-label="Select day" id="date-picker" type="date" value="${state.date}"><button class="icon-button" data-action="next-date" aria-label="Next ${state.view}">›</button><div class="seg-toggle" role="group" aria-label="Calendar view"><button data-view="day" class="${state.view==='day'?'chosen':''}">Day</button><button data-view="week" class="${state.view==='week'?'chosen':''}">Week</button></div></div></div>
        <div class="hours"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span></div>
        <div class="days" id="days">${daysInView().map(dayRow).join('')}</div>
        <div class="timeline-footer"><span class="swatch red"></span> Andrew <span class="swatch blue"></span> Greyson <span class="swatch purple"></span> Both <span class="swatch draft"></span> Draft
        <span class="muted small footnote">Long press & drag on a timeline to draft an away block. Use Day / Week if pinch gestures aren't available.</span></div>
      </section>
      <div class="publish-row"><span>${state.dirty ? `${state.draft.length} item(s) in your private draft.` : 'Create a draft to start planning.'}</span><div class="button-set">
       <button class="button soft" data-action="urgent" ${state.preview || !(state.data.schedules[state.role]?.events?.length) ? 'disabled' : ''}>⚡ Coming home early</button>
       <button class="button primary" data-action="publish" ${!state.dirty || state.preview ? 'disabled' : ''}>Save & Sync ${state.dirty ? '· publish draft' : ''}</button></div></div>`;
  }
  function monthBillDates(bill, month) {
    const results = [];
    if (bill.recurrence === 'none') return bill.due_date.startsWith(month) ? [bill.due_date] : [];
    const day = Number(bill.due_date.slice(8));
    const [year, m] = month.split('-').map(Number);
    const last = new Date(year, m, 0).getDate();
    const occurrence = `${month}-${pad(Math.min(day, last))}`;
    return occurrence >= bill.due_date ? [occurrence] : [];
  }
  function billView() {
    const month = state.date.slice(0,7);
    const occurrences = state.data.bills.flatMap(b => monthBillDates(b, month).map(day => ({ b, day })));
    const total = occurrences.reduce((sum,x) => sum+x.b.amount_cents,0);
    const personal = role => occurrences.filter(x => x.b.owner === role).reduce((sum,x) => sum+x.b.amount_cents,0);
    const shared = personal('shared');
    return `<section class="page-heading"><div><p class="eyebrow">Bills · Scheduled only</p><h1>Money obligations.</h1><p class="muted">Due dates, paid markers and monthly totals. Not a bank account or transaction tracker.</p></div>
      <button class="button primary" data-action="add-bill" ${state.preview?'disabled':''}>+ New bill</button></section>
      <section class="summary-grid bill-totals"><div class="summary-primary"><span class="eyebrow">Scheduled this month · ${enc(month)}</span><div class="summary-value">${money(total)}</div><span class="muted small">Shared bills counted once in the household total.</span></div>
      <div class="summary-secondary"><span class="eyebrow">By attribution</span><strong>Andrew ${money(personal('andrew'))} · Greyson ${money(personal('greyson'))}</strong><span class="muted small">Shared ${money(shared)} · split contributions not specified</span></div></section>
      <section class="panel"><div class="panel-header"><h2>Due this month</h2><span class="muted small">${occurrences.length} scheduled</span></div><div class="bill-list">${occurrences.length ? occurrences.sort((a,b)=>a.day.localeCompare(b.day)).map(({b,day}) => {
        const paid = paymentFor(b.id, day);
        return `<div class="bill-row"><div class="bill-icon">${paid?'✓':'$'}</div><div class="bill-info"><strong>${enc(b.title)}</strong><span class="muted small">${enc(dateLabel(day))} · ${enc(ROLES[b.owner]||'Shared')} · ${b.recurrence==='monthly'?'Monthly':'One-time'}</span></div>
          <div class="bill-end"><strong>${money(b.amount_cents)}</strong><button class="mini-link" data-action="toggle-bill" data-id="${enc(b.id)}" data-day="${day}" ${state.preview?'disabled':''}>${paid ? `Paid ${enc(paid.paid_date)} · undo` : 'Mark paid'}</button></div></div>`;
      }).join('') : '<p class="empty">No bills scheduled for this month. A rare moment of peace.</p>'}</div></section>`;
  }
  function dayFact() {
    const facts = window.DEX_FACTS || [];
    const tags = state.data?.interests.flatMap(t => t.tags.map(x=>x.toLowerCase())) || [];
    const dateKey = localToday().slice(5);
    const relevant = facts.filter(f => f.monthDay === dateKey);
    const general = facts.filter(f => !f.monthDay && (tags.length===0 || tags.includes(f.category)));
    const rest = facts.filter(f => !f.monthDay && !general.includes(f));
    const pool = [...relevant, ...general, ...rest];
    const indexKey = `dex:fact:${state.role || 'guest'}:${localToday()}`;
    const seen = Number(sessionStorage.getItem(indexKey) || 0);
    if (!pool.length) return null;
    return pool[seen % pool.length];
  }
  function nextFact() {
    const indexKey = `dex:fact:${state.role || 'guest'}:${localToday()}`;
    sessionStorage.setItem(indexKey, String(Number(sessionStorage.getItem(indexKey) || 0) + 1));
    state.fact = dayFact();
    render();
  }
  function triviaView() {
    const f = state.fact || dayFact();
    const tags = [...new Set(state.data.interests.flatMap(row => row.tags))];
    return `<section class="page-heading"><div><p class="eyebrow">Shared curiosity</p><h1>Today's peculiarities.</h1><p class="muted">On-this-day history and general trivia selected from both your interests.</p></div><button class="button primary" data-action="next-fact">Another fact →</button></section>
    <section class="panel fact-card"><div class="fact-top"><span class="fact-label">${f?.monthDay===localToday().slice(5)?'On this day':'Daily curiosity'} · ${enc(f?.category||'general')}</span><span class="muted small">${enc(dateLabel(localToday()))}</span></div>
      <h2>${enc(f?.title || 'The archives are temporarily silent.')}</h2><p class="fact-body">${enc(f?.text || '')}</p>
      ${f?.source ? `<a class="source" href="${enc(f.source)}" target="_blank" rel="noopener noreferrer">Read the source ↗</a>` : ''}<div class="dex-comment">DEXTER'S ASSESSMENT <span>“I have reviewed this fact. Humanity remains questionable.”</span></div></section>
    <section class="panel interests-panel"><div class="panel-header"><div><h2>Combined interests</h2><p class="muted small">Both people's interests contribute to the same pool.</p></div></div>
      <div class="chips">${tags.length ? tags.map(tag=>`<span class="chip">${enc(tag)}</span>`).join('') : '<span class="muted">Nothing added yet</span>'}</div>
      <form id="interests-form"><label for="interest-input">Your interests (comma-separated)</label><div class="inline-form"><input id="interest-input" name="tags" value="${enc(state.data.interests.find(x=>x.role===state.role)?.tags.join(', ')||'')}" placeholder="history, space, animals" ${state.preview?'disabled':''}><button class="button soft" ${state.preview?'disabled':''}>Save interests</button></div></form>
      <p class="muted small">This first build uses a small curated, sourced set. Daily generation using OpenAI is not enabled until a secure backend key and fact-verification workflow are added.</p></section>`;
  }
  function updatesView() {
    return `<section class="page-heading"><div><p class="eyebrow">Publication log</p><h1>Recent updates.</h1><p class="muted">A dependable fallback while push notifications are being configured.</p></div><button class="button soft" data-action="refresh">Refresh</button></section>
    <section class="panel"><div class="bill-list">${state.data.activity.length ? state.data.activity.map(a => `<div class="bill-row"><div class="bill-icon ${a.type==='urgent'?'urgent':''}">${a.type==='urgent'?'⚡':'↻'}</div><div class="bill-info"><strong>${enc(a.type==='urgent'?'Urgent return update':'Schedule published')}</strong><span class="muted small">${enc(a.message)}</span></div><time class="muted small">${new Date(a.created_at).toLocaleString()}</time></div>`).join('') : `<p class="empty">No updates yet. Suspiciously orderly.</p>`}</div></section>`;
  }
  function appMarkup() {
    const pending = state.dirty && !state.preview ? ' · unpublished edits' : '';
    return `<div class="shell"><aside class="sidebar"><div class="brand"><div class="brand-icon">D</div><div><strong>DEX Scheduler</strong><small>The household, accounted for.</small></div></div>
      <nav aria-label="Main navigation">
       <button data-nav="calendar" class="nav-item ${state.screen==='calendar'?'active':''}"><span>◫</span> Calendar</button>
       <button data-nav="bills" class="nav-item ${state.screen==='bills'?'active':''}"><span>♧</span> Scheduled bills</button>
       <button data-nav="trivia" class="nav-item ${state.screen==='trivia'?'active':''}"><span>✦</span> Daily curiosity</button>
       <button data-nav="updates" class="nav-item ${state.screen==='updates'?'active':''}"><span>↻</span> Updates</button>
      </nav><div class="sidebar-bottom"><div class="familiar-label">THE FAMILIAR'S VERDICT</div><p>“An organized household. What a revolting concept.”</p><span class="muted small">Dexter · Chief of Disapproval</span></div></aside>
      <div class="main-column"><header class="topbar"><div class="topbar-left"><span class="status-dot ${state.preview?'warn':''}"></span><span>${state.preview?'SAMPLE PREVIEW — NOTHING SYNCED':'Private household · '+enc(ROLES[state.role])}${enc(pending)}</span></div><div class="topbar-actions"><span class="muted small">${enc(new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}))}</span><button class="user-pill" data-action="logout">${state.preview?'Exit preview':enc(ROLES[state.role])+' · Sign out'}</button></div></header>
        <main class="page-content">${state.screen==='calendar'?calendarContent():state.screen==='bills'?billView():state.screen==='trivia'?triviaView():updatesView()}
        <p class="page-footnote">Schedule = planned availability, not verified presence. ${state.preview?'All entries here are fictitious examples.':'Private drafts stay on this device until published.'}</p></main>
      </div><nav class="mobile-nav" aria-label="Mobile navigation"><button data-nav="calendar" class="${state.screen==='calendar'?'active':''}">◫<span>Calendar</span></button><button data-nav="bills" class="${state.screen==='bills'?'active':''}">♧<span>Bills</span></button><button data-nav="trivia" class="${state.screen==='trivia'?'active':''}">✦<span>Trivia</span></button><button data-nav="updates" class="${state.screen==='updates'?'active':''}">↻<span>Updates</span></button></nav>
      <div id="familiar" class="familiar ${state.cameoVisible?'show':''}" aria-live="off"><span class="familiar-monogram">D</span><div><span class="familiar-title">DEXTER HAS AN OPINION</span><p>${enc(dexLine())}</p></div><button data-action="hide-cameo" aria-label="Dismiss Dexter">×</button></div></div>
      <dialog id="edit-dialog" class="modal"><form id="away-form" method="dialog"><div class="modal-header"><h2>Create an away draft</h2><button type="button" class="close-modal" data-action="close-modal" aria-label="Close">×</button></div><p class="muted small">Visible only to you until Save & Sync.</p><label>Date</label><input name="date" type="date" required><div class="time-fields"><div><label>From</label><input name="from" type="time" required></div><div><label>Until</label><input name="until" type="time" required></div></div><label>Optional note</label><input name="label" maxlength="100" placeholder="Work, appointment, or nothing at all"><div class="button-set modal-actions"><button class="button soft" type="button" data-action="close-modal">Cancel</button><button class="button primary" type="submit">Confirm draft</button></div></form></dialog>
      <dialog id="bill-dialog" class="modal"><form id="bill-form" method="dialog"><div class="modal-header"><h2>New scheduled bill</h2><button type="button" class="close-modal" data-action="close-modal">×</button></div><label>Bill name</label><input name="title" maxlength="90" required placeholder="Electricity"><label>Amount in dollars</label><input name="amount" type="number" min="0" max="1000000" step="0.01" required><label>Due date</label><input name="date" type="date" required><label>Attribution</label><select name="owner"><option value="shared">Shared</option><option value="andrew">Andrew</option><option value="greyson">Greyson</option></select><label>Repeat</label><select name="recurrence"><option value="monthly">Monthly</option><option value="none">One-time</option></select><div class="button-set modal-actions"><button class="button soft" type="button" data-action="close-modal">Cancel</button><button class="button primary" type="submit">Save bill</button></div></form></dialog>
      <dialog id="bill-day-dialog" class="modal"><div class="modal-header"><h2>Bills due</h2><button class="close-modal" data-action="close-modal">×</button></div><div id="bill-day-content"></div><button class="button soft wide" data-action="close-modal">Close</button></dialog>
      <dialog id="urgent-dialog" class="modal"><form id="urgent-form" method="dialog"><div class="modal-header"><h2>⚡ Coming home early</h2><button type="button" class="close-modal" data-action="close-modal">×</button></div><p class="muted small">Publish one urgent arrival change immediately. Your other drafts remain private.</p><label>Your published away block</label><select name="id">${(state.data.schedules[state.role]?.events||[]).filter(e=>e.end>Date.now()).map(e=>`<option value="${enc(e.id)}">${enc(new Date(e.start).toLocaleDateString('en-US',{month:'short',day:'numeric'}))} ${enc(humanTime(e.start))}–${enc(humanTime(e.end))}</option>`).join('')}</select><label>New arrival date and time</label><input name="arrival" type="datetime-local" required><div class="button-set modal-actions"><button class="button soft" type="button" data-action="close-modal">Cancel</button><button class="button primary" type="submit">Publish urgent update</button></div></form></dialog>`;
  }
  function dexLine() {
    const x = state.data?.schedules || {};
    const a = x.andrew?.events?.length || 0, g = x.greyson?.events?.length || 0;
    const lines = [
      'Both humans continue to schedule their own incompetence. Efficient.',
      'Weasel walks are not to be entered here. I will be issuing no reminders.',
      `${g} entries for Greyson. ${a} for Andrew. I decline to comment.`,
      'You have opened the household ledger. I have lowered my expectations.',
      'Another day, another demonstration of human dependence on clocks.',
      'I see you have plans. I also see you have no dignity.'
    ];
    return lines[Math.floor(Date.now()/17000) % lines.length];
  }
  function scheduleCameo() {
    clearTimeout(state.cameoTimer);
    if (state.step !== 'app') return;
    state.cameoTimer = setTimeout(() => {
      if (document.hidden || state.step !== 'app') return;
      state.cameoVisible = true;
      const familiar = document.getElementById('familiar');
      if (familiar) { familiar.querySelector('p').textContent = dexLine(); familiar.classList.add('show'); }
      setTimeout(() => { state.cameoVisible = false; document.getElementById('familiar')?.classList.remove('show'); }, 8500);
      state.cameoTimer = setTimeout(scheduleCameo, 6000 + Math.floor(Math.random() * 11000));
    }, 14000 + Math.floor(Math.random() * 17000));
  }
  function render() {
    if (state.step === 'gate') app.innerHTML = gateMarkup();
    else if (state.step === 'roles') app.innerHTML = rolesMarkup();
    else if (state.step === 'password') app.innerHTML = passwordMarkup();
    else if (state.step === 'app') app.innerHTML = appMarkup();
    if (state.step === 'app') initGestureHandlers();
  }
  async function refresh() {
    if (state.preview || !state.token) return;
    const next = await api('/api/state');
    const prior = state.data?.schedules[state.role]?.revision;
    state.data = next;
    if (state.dirty && prior !== undefined && prior !== next.schedules[state.role].revision) {
      show('Your published schedule changed. Review your private drafts before publishing again.');
    }
    if (!state.dirty) resetDraft();
    state.fact = dayFact();
    render();
  }
  async function afterLogin(role, token) {
    state.role = role; state.token = token;
    localStorage.setItem('dex:token:v1', token);
    state.data = await api('/api/state');
    state.step = 'app'; state.preview = false;
    restoreDraft();
    state.fact = dayFact();
    render(); scheduleCameo(); beginPolling();
  }
  async function init() {
    consumeInvite();
    if (apiBase) {
      try {
        state.status = await api('/api/status', 'GET', null, true);
        if (state.token) {
          const account = await api('/api/me');
          await afterLogin(account.role, state.token);
          return;
        }
      } catch (err) { state.token = null; localStorage.removeItem('dex:token:v1'); show('Private service not reachable yet.'); }
    }
    render();
  }
  function beginPolling() {
    clearInterval(state.pollTimer);
    if (!state.preview) state.pollTimer = setInterval(() => { if (!document.hidden && state.step === 'app') refresh().catch(() => {}); }, 60000);
  }
  async function handleSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    await busyAction(async () => {
      const data = new FormData(form);
      if (form.id === 'entry-form') {
        const password = String(data.get('password') || '');
        if (!apiBase) { if (password !== 'Dexter') throw new Error('Incorrect entry password'); toast.classList.remove('visible'); state.step = 'roles'; render(); return; }
        const result = await api('/api/gate', 'POST', { password }, true);
        toast.classList.remove('visible');
        state.ticket = result.ticket;
        state.step = 'roles'; render(); return;
      }
      if (form.id === 'account-form') {
        const password = String(data.get('password') || '');
        const claimed = state.status?.claimed?.includes(state.selectedRole);
        if (!claimed && password !== data.get('confirm')) throw new Error('The passwords do not match');
        const payload = { role: state.selectedRole, password, ticket: state.ticket };
        if (!claimed) payload.invite = state.invite || String(data.get('invite') || '');
        const result = await api(claimed?'/api/login':'/api/enroll','POST',payload,true);
        if (!claimed) { sessionStorage.removeItem('dex:invite'); state.invite = ''; }
        await afterLogin(result.role, result.token);
        return;
      }
      if (form.id === 'away-form') {
        const date = String(data.get('date')), start = dayAt(date,String(data.get('from'))), end = dayAt(date,String(data.get('until')));
        if (!(end > start)) throw new Error('Return time must be after departure time');
        state.draft.push({ id: crypto.randomUUID(), start, end, label: String(data.get('label')||'').trim() });
        saveDraft(); form.closest('dialog').close(); render(); show('Draft saved privately. Publish when ready.'); return;
      }
      if (form.id === 'bill-form') {
        const cents = Math.round(Number(data.get('amount')) * 100);
        await api('/api/bills','POST',{ title:String(data.get('title')),amountCents:cents,owner:data.get('owner'),dueDate:data.get('date'),recurrence:data.get('recurrence')});
        form.closest('dialog').close(); await refresh(); show('Bill saved for both people.'); return;
      }
      if (form.id === 'urgent-form') {
        const newEnd = new Date(String(data.get('arrival'))).getTime();
        if (!Number.isSafeInteger(newEnd)) throw new Error('Enter a valid arrival time');
        if (!confirm('Publish this early return immediately? This notifies the other person in the in-app updates.')) return;
        await api('/api/urgent','POST',{ id:data.get('id'),newEnd });
        form.closest('dialog').close(); await refresh(); show('Urgent change published. Your other drafts are untouched.'); return;
      }
      if (form.id === 'interests-form') {
        const tags = String(data.get('tags')||'').split(',').map(x=>x.trim()).filter(Boolean);
        await api('/api/interests','PUT',{tags});
        await refresh(); show('Shared interests updated.'); return;
      }
    });
  }
  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    if (id==='edit-dialog') { dialog.querySelector('[name=date]').value = state.date; dialog.querySelector('[name=from]').value = '09:00'; dialog.querySelector('[name=until]').value = '17:00'; }
    if (id==='bill-dialog') dialog.querySelector('[name=date]').value = state.date;
    if (id==='urgent-dialog') {
      const row = state.data.schedules[state.role]?.events.find(e=>e.end>Date.now());
      if (!row) { show('No upcoming published away blocks to update.'); return; }
      const d = new Date(row.end - 60 * 60_000);
      dialog.querySelector('[name=arrival]').value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    dialog.showModal();
  }
  async function clickAction(event) {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.role) { state.selectedRole = button.dataset.role; state.step = 'password'; render(); return; }
    if (button.dataset.view) { state.view=button.dataset.view; render(); return; }
    if (button.dataset.nav) { state.screen=button.dataset.nav; state.cameoVisible=false; render(); return; }
    const action = button.dataset.action;
    if (!action) return;
    if (action==='back-to-gate') { state.step='gate'; state.ticket=null; render(); return; }
    if (action==='back-to-roles') { state.step='roles'; render(); return; }
    if (action==='preview') { state.preview=true; state.role='andrew'; state.data=demoState(); state.step='app'; resetDraft(); state.fact=dayFact(); render(); scheduleCameo(); return; }
    if (action==='hide-cameo') { state.cameoVisible=false; document.getElementById('familiar')?.classList.remove('show'); return; }
    if (action==='close-modal') { button.closest('dialog')?.close(); return; }
    if (action==='add-away') return openDialog('edit-dialog');
    if (action==='add-bill') return openDialog('bill-dialog');
    if (action==='urgent') return openDialog('urgent-dialog');
    if (action==='next-fact') return nextFact();
    if (action==='show-updates') { state.screen='updates'; render(); return; }
    if (action==='prev-date' || action==='next-date') { state.date=addDays(state.date,(action==='next-date'?1:-1)*(state.view==='week'?7:1));state.fact=dayFact();render();return; }
    if (action==='bill-day') {
      const day=button.dataset.day, dialog=document.getElementById('bill-day-dialog');
      dialog.querySelector('#bill-day-content').innerHTML = `<p class="muted small">${enc(dateLabel(day))}</p>${billsFor(day).map(b=>`<div class="bill-row"><div class="bill-icon">$</div><div class="bill-info"><strong>${enc(b.title)}</strong><span class="muted small">${enc(ROLES[b.owner]||'Shared')} · ${paymentFor(b.id,day)?'Paid':'Unpaid'}</span></div><strong>${money(b.amount_cents)}</strong></div>`).join('')}`;
      dialog.showModal(); return;
    }
    if (action==='logout') {
      clearInterval(state.pollTimer);clearTimeout(state.cameoTimer);
      if (!state.preview) {
        const oldRole=state.role;
        try { await api('/api/logout','POST',{}); } catch { /* local sign-out still wins */ }
        localStorage.removeItem(`dex:draft:${oldRole}`);
      }
      localStorage.removeItem('dex:token:v1');
      Object.assign(state,{step:'gate',role:null,token:null,selectedRole:null,ticket:null,preview:false,dirty:false,data:null,draft:null,cameoVisible:false}); render(); return;
    }
    await busyAction(async () => {
      if (action==='refresh') { await refresh();show('Checked for new updates.');return; }
      if (action==='publish') {
        if (!state.dirty) return;
        if (!confirm('Publish all your draft schedule changes and notify the other person?')) return;
        const version = state.data.schedules[state.role].revision;
        await api('/api/publish','POST',{events:state.draft,baseRevision:version});
        state.dirty=false; localStorage.removeItem(`dex:draft:${state.role}`);
        await refresh(); show('Published. One in-app update was created.'); return;
      }
      if (action==='toggle-bill') {
        const id=button.dataset.id, day=button.dataset.day;
        const existing=paymentFor(id,day);
        if (!confirm(existing?'Remove this payment mark?':'Mark this bill paid for both of you?')) return;
        await api(`/api/bills/${encodeURIComponent(id)}/payment`, existing?'DELETE':'POST', existing?{occurrenceDate:day}:{occurrenceDate:day,paidDate:localToday()});
        await refresh();show(existing?'Payment mark removed.':'Bill marked paid.');return;
      }
    });
  }
  function initGestureHandlers() {
    const container=document.getElementById('days');
    if (!container || state.preview) return;
    let pointer = null, timer = null, touchStart = null;
    container.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !event.isPrimary) return;
      const track = event.target.closest('[data-timeline-day]');
      if (!track) return;
      const rect=track.getBoundingClientRect();
      pointer={track,rect,fromX:event.clientX,toX:event.clientX,ready:false};
      timer=setTimeout(() => { if (pointer) { pointer.ready=true;track.classList.add('selecting'); } }, 430);
    });
    container.addEventListener('pointermove', event => { if (pointer) pointer.toX=event.clientX; });
    const done=event => {
      clearTimeout(timer);
      if (!pointer) return;
      const p=pointer;pointer=null;p.track.classList.remove('selecting');
      if (!p.ready) return;
      const pos=x=>Math.min(1,Math.max(0,(x-p.rect.left)/p.rect.width));
      const from=Math.floor(Math.min(pos(p.fromX),pos(p.toX))*48)/2;
      const to=Math.ceil(Math.max(pos(p.fromX),pos(p.toX))*48)/2;
      const fmt=h=>`${pad(Math.floor(h))}:${pad(Math.round((h%1)*60))}`;
      const dialog=document.getElementById('edit-dialog');
      dialog.querySelector('[name=date]').value=p.track.dataset.timelineDay;
      dialog.querySelector('[name=from]').value=fmt(Math.min(23,from));
      dialog.querySelector('[name=until]').value=fmt(Math.min(23.5,Math.max(to,from+0.5)));
      dialog.showModal();
    };
    container.addEventListener('pointerup',done);
    container.addEventListener('pointercancel',()=>{clearTimeout(timer);pointer?.track.classList.remove('selecting');pointer=null;});
    container.addEventListener('touchstart', event=>{ if(event.touches.length===2){clearTimeout(timer);pointer=null;const a=event.touches[0],b=event.touches[1];touchStart=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);}}, {passive:true});
    container.addEventListener('touchmove', event=>{if(touchStart!==null && event.touches.length===2){const a=event.touches[0],b=event.touches[1];const d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);if(Math.abs(d-touchStart)>80){state.view=d<touchStart?'week':'day';touchStart=null;clearTimeout(timer);pointer=null;render();}}}, {passive:true});
    container.addEventListener('touchend',()=>{touchStart=null;}, {passive:true});
  }
  app.addEventListener('submit',handleSubmit);
  app.addEventListener('click',clickAction);
  app.addEventListener('change',event=>{ if(event.target.id==='date-picker'){state.date=event.target.value;state.fact=dayFact();render();} });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.step==='app'&&!state.preview)refresh().catch(()=>{});});
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  init();
})();
