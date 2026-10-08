/* Two-person review UI. Shared content is requested only after the server authenticates a collaborator. */
(() => {
  'use strict';
  const sections = [
    ['gtm', 'Premium Year One'],
    ['first-piece', 'Year One experience'],
    ['your-eye', 'Bracelet requirements'],
    ['stones', 'Twelve stones'],
    ['together', 'Decisions to validate'],
    ['review-notes', 'Review notes'],
  ];
  const labels = Object.fromEntries(sections);
  const $ = selector => document.querySelector(selector);
  const launcher = $('#review-launcher');
  const panel = $('#review-panel');
  const status = $('#review-panel-status');
  const sectionSelect = $('#review-section-select');
  const commentInput = $('#review-comment');
  const noteInput = $('#review-note');
  const notesGrid = $('#review-notes-grid');
  const commentDrafts = new Map();
  const noteDrafts = new Map();
  let selected = 'gtm';
  let tab = 'comments';
  let user = null;
  let review = null;
  let available = false;
  let refreshing = false;
  let scrollScheduled = false;
  let returnFocus = launcher;

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = String(content);
    return node;
  }
  function message(text) {
    status.textContent = text;
    status.hidden = !text;
  }
  async function api(path, options = {}) {
    const response = await fetch(`/api/brief-review${path}`, {
      credentials: 'same-origin', cache: 'no-store', ...options,
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || `Review request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return data;
  }
  function formatTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? '' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }
  function reviewerName(id) { return id === 'partner' ? 'Partner' : id === 'connor' ? 'Connor' : String(id); }
  function sectionData(id) {
    return review?.sections?.[id] || { note: null, comments: [], unread: 0 };
  }
  function updateBadge() {
    const count = user ? Number(review?.unreadTotal || 0) : 0;
    const badge = $('#review-unread');
    badge.hidden = count === 0;
    badge.textContent = count > 99 ? '99+' : String(count);
    launcher.setAttribute('aria-label', count ? `Open private review, ${count} unread comment${count === 1 ? '' : 's'}` : 'Open private review');
    for (const [id] of sections) {
      const button = document.querySelector(`[data-section-review="${id}"]`);
      const countNode = button?.querySelector('span');
      if (countNode) countNode.textContent = sectionData(id).unread ? String(sectionData(id).unread) : '';
    }
  }
  function renderNotesGrid() {
    notesGrid.replaceChildren();
    if (!user || !review) {
      notesGrid.append(element('p', 'review-locked-message', available ? 'Unlock private review to see shared notes.' : 'Shared review is not available yet.'));
      return;
    }
    for (const [id, label] of sections.filter(([id]) => id !== 'review-notes')) {
      const note = sectionData(id).note;
      const button = element('button', 'review-note-card');
      button.type = 'button';
      button.append(element('strong', '', label));
      button.append(element('p', '', note?.body || 'No shared note yet.'));
      if (note?.updatedAt) button.append(element('small', '', `Updated by ${reviewerName(note.updatedBy)} · ${formatTime(note.updatedAt)}`));
      button.addEventListener('click', () => openReview(id, 'notes', button));
      notesGrid.append(button);
    }
  }
  function renderComments() {
    const content = $('#review-content');
    const wasAtBottom = content.scrollHeight - content.scrollTop - content.clientHeight < 40;
    const previousScroll = content.scrollTop;
    content.replaceChildren();
    const comments = sectionData(selected).comments || [];
    if (!comments.length) {
      content.append(element('p', 'review-empty', 'No comments on this section yet.'));
      return;
    }
    for (const comment of comments) {
      const article = element('article', 'review-message');
      const meta = element('div', 'review-message-meta');
      meta.append(element('strong', '', comment.author === user?.id ? 'You' : reviewerName(comment.author)));
      meta.append(element('time', '', formatTime(comment.createdAt)));
      article.append(meta, element('p', '', comment.body));
      content.append(article);
    }
    content.scrollTop = wasAtBottom ? content.scrollHeight : previousScroll;
  }
  function renderNote() {
    const content = $('#review-content');
    content.replaceChildren();
    const note = sectionData(selected).note;
    content.append(element('p', 'review-note-preview', note?.body || 'No shared note on this section yet.'));
    if (note?.updatedAt) content.append(element('p', 'review-note-meta', `Updated by ${reviewerName(note.updatedBy)} · ${formatTime(note.updatedAt)}`));
    else content.append(element('p', 'review-note-meta', 'Notes are shared with invited reviewers.'));
    if (!noteDrafts.has(selected)) noteInput.value = note?.body || '';
  }
  function renderPanel() {
    $('#review-panel-title').textContent = labels[selected];
    sectionSelect.value = selected;
    $('#review-auth').hidden = Boolean(user);
    $('#review-private').hidden = !user;
    $('#review-auth-form').hidden = !available;
    $('#review-auth > p').textContent = available ? 'Notes and comments are available only to invited reviewers.' : 'Shared review is not available yet.';
    if (!user || !review) return;
    $('#review-signed-in-as').textContent = `Signed in as ${user.label}`;
    for (const button of document.querySelectorAll('[data-review-tab]')) button.setAttribute('aria-pressed', String(button.dataset.reviewTab === tab));
    $('#review-comment-form').hidden = tab !== 'comments';
    $('#review-note-form').hidden = tab !== 'notes';
    if (tab === 'comments') renderComments(); else renderNote();
  }
  function render() {
    updateBadge();
    renderNotesGrid();
    renderPanel();
  }
  async function refresh() {
    if (!user || refreshing) return;
    refreshing = true;
    try {
      review = await api('');
      message('');
      render();
    } catch (error) {
      if (error.status === 401) { user = null; review = null; render(); }
      message(error.status === 503 ? 'Shared review is temporarily unavailable.' : error.message);
    } finally { refreshing = false; }
  }
  async function markRead() {
    if (!user || panel.hidden || tab !== 'comments' || !review || !sectionData(selected).unread) return;
    const throughSeq = Math.max(0, ...(sectionData(selected).comments || []).map(comment => comment.seq));
    try {
      await api('', { method: 'POST', body: JSON.stringify({ action: 'read', sectionId: selected, throughSeq }) });
      await refresh();
    } catch (error) { message(error.message); }
  }
  function rememberDrafts() {
    if (!user) return;
    if (tab === 'comments') {
      if (commentInput.value) commentDrafts.set(selected, commentInput.value); else commentDrafts.delete(selected);
    } else {
      const savedNote = sectionData(selected).note?.body || '';
      if (noteInput.value !== savedNote) noteDrafts.set(selected, noteInput.value); else noteDrafts.delete(selected);
    }
  }
  function chooseSection(id) {
    if (!labels[id] || id === selected) return;
    rememberDrafts();
    selected = id;
    commentInput.value = commentDrafts.get(id) || '';
    noteInput.value = noteDrafts.has(id) ? noteDrafts.get(id) : (sectionData(id).note?.body || '');
    renderPanel();
    void markRead();
  }
  function chooseTab(next) {
    if (next === tab) return;
    rememberDrafts();
    tab = next;
    renderPanel();
    void markRead();
  }
  function openReview(id = selected, view = 'comments', trigger = launcher) {
    returnFocus = trigger;
    if (labels[id]) chooseSection(id);
    tab = view;
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    renderPanel();
    if (user) {
      sectionSelect.focus();
      void markRead();
    } else $('#review-code').focus();
  }
  function closeReview() {
    rememberDrafts();
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    message('');
    (returnFocus?.isConnected ? returnFocus : launcher).focus();
  }

  for (const [id, label] of sections) {
    sectionSelect.add(new Option(label, id));
    const header = document.querySelector(`#${id} > .section-title`);
    if (!header) continue;
    const button = element('button', 'section-review-button', 'Comment');
    button.type = 'button';
    button.dataset.sectionReview = id;
    button.setAttribute('aria-label', `Comment on ${label}`);
    button.append(element('span'));
    button.addEventListener('click', () => openReview(id, 'comments', button));
    header.append(button);
  }
  launcher.addEventListener('click', () => openReview());
  $('#review-close').addEventListener('click', closeReview);
  sectionSelect.addEventListener('change', () => chooseSection(sectionSelect.value));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) closeReview(); });
  document.querySelectorAll('[data-review-tab]').forEach(button => button.addEventListener('click', () => chooseTab(button.dataset.reviewTab)));
  commentInput.addEventListener('input', () => commentDrafts.set(selected, commentInput.value));
  noteInput.addEventListener('input', () => noteDrafts.set(selected, noteInput.value));
  $('#review-auth-form').addEventListener('submit', async event => {
    event.preventDefault();
    const input = $('#review-code');
    const code = input.value.trim();
    input.value = '';
    if (!code) return;
    message('Checking access…');
    try {
      const result = await api('/session', { method: 'POST', body: JSON.stringify({ code }) });
      user = result.user;
      await refresh();
      if (user) sectionSelect.focus();
    } catch (error) { message(error.status === 401 ? 'That access code was not recognized.' : error.message); }
  });
  $('#review-comment-form').addEventListener('submit', async event => {
    event.preventDefault();
    const body = commentInput.value.trim();
    if (!body) return;
    const sectionId = selected;
    const submittedDraft = commentInput.value;
    const button = event.submitter || $('#review-comment-form button');
    button.disabled = true;
    try {
      await api('', { method: 'POST', body: JSON.stringify({ action: 'comment', sectionId, body }) });
      if (commentDrafts.get(sectionId) === submittedDraft) commentDrafts.delete(sectionId);
      if (selected === sectionId && commentInput.value === submittedDraft) commentInput.value = '';
      await refresh();
    } catch (error) { message(error.message); }
    finally { button.disabled = false; }
  });
  $('#review-note-form').addEventListener('submit', async event => {
    event.preventDefault();
    const body = noteInput.value.trim();
    const sectionId = selected;
    const submittedDraft = noteInput.value;
    const revision = sectionData(sectionId).note?.revision || 0;
    const button = event.submitter || $('#review-note-form button');
    button.disabled = true;
    try {
      await api('', { method: 'POST', body: JSON.stringify({ action: 'note', sectionId, body, revision }) });
      if (noteDrafts.get(sectionId) === submittedDraft) noteDrafts.delete(sectionId);
      await refresh();
    } catch (error) {
      if (error.status === 409) await refresh();
      message(error.status === 409 ? 'This note changed elsewhere. Your draft is still here; compare it with the latest note before saving again.' : error.message);
    } finally { button.disabled = false; }
  });
  $('#review-sign-out').addEventListener('click', async () => {
    try { await api('/session', { method: 'DELETE' }); }
    catch (error) { message(error.message); return; }
    user = null;
    review = null;
    commentDrafts.clear();
    noteDrafts.clear();
    commentInput.value = '';
    noteInput.value = '';
    render();
    $('#review-code').focus();
  });

  const contentSections = sections.map(([id]) => document.getElementById(id));
  window.addEventListener('scroll', () => {
    if (scrollScheduled || !panel.hidden) return;
    scrollScheduled = true;
    requestAnimationFrame(() => {
      scrollScheduled = false;
      const current = contentSections.filter(section => section.getBoundingClientRect().top <= innerHeight * .4).at(-1);
      if (current) chooseSection(current.id);
    });
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void refresh(); });
  // Keep an open conversation current without repeatedly reading every section
  // while the brief is simply left open in a browser tab.
  let lastBackgroundRefresh = 0;
  setInterval(() => {
    if (document.hidden || !user) return;
    if (!panel.hidden || Date.now() - lastBackgroundRefresh >= 120000) {
      lastBackgroundRefresh = Date.now();
      void refresh();
    }
  }, 30000);
  (async () => {
    try {
      const result = await api('/session');
      available = Boolean(result.available);
      user = result.user || null;
      if (user) await refresh();
    } catch { available = false; }
    render();
  })();
})();
