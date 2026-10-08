/* Public section review. Display names are unverified; new-comment cursors stay in this browser. */
(() => {
  'use strict';
  const sections = [
    ['gtm', 'Premium Year One'],
    ['first-piece', 'Year One experience'],
    ['your-eye', 'Bracelet requirements'],
    ['stones', 'Twelve stones'],
    ['ai-generations-packaging', 'AI generations: Packaging'],
    ['together', 'Decisions to validate'],
    ['review-notes', 'Review notes'],
  ];
  const labels = Object.fromEntries(sections);
  const nameKey = 'halo-brief-review-display-name-v2';
  const readKey = 'halo-brief-review-read-v2';
  const $ = selector => document.querySelector(selector);
  const launcher = $('#review-launcher');
  const topTrigger = $('#review-top-trigger');
  const panel = $('#review-panel');
  const status = $('#review-panel-status');
  const sectionSelect = $('#review-section-select');
  const nameInput = $('#review-display-name');
  const commentInput = $('#review-comment');
  const noteInput = $('#review-note');
  const notesGrid = $('#review-notes-grid');
  const commentDrafts = new Map();
  const noteDrafts = new Map();
  let selected = 'gtm';
  let tab = 'comments';
  let review = null;
  let loaded = false;
  let readCursors = loadReadCursors();
  let refreshPromise = null;
  let scrollScheduled = false;
  let returnFocus = launcher;

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = String(content);
    return node;
  }
  function message(value) {
    status.textContent = value;
    status.hidden = !value;
  }
  function stored(key) {
    try { return localStorage.getItem(key); }
    catch { return null; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, value); }
    catch { /* The review still works when browser storage is disabled. */ }
  }
  function loadReadCursors() {
    const value = stored(readKey);
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
      return Object.fromEntries(sections.map(([id]) => [
        id, Number.isSafeInteger(parsed[id]) && parsed[id] >= 0 ? parsed[id] : 0,
      ]));
    } catch { return null; }
  }
  async function api(options = {}) {
    const response = await fetch('/api/brief-review', {
      credentials: 'same-origin',
      cache: 'no-store',
      ...options,
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || 'Review request failed.');
      error.status = response.status;
      throw error;
    }
    return data;
  }
  function formatTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? '' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }
  function reviewerName(value) {
    return typeof value === 'string' && value.trim() ? value.trim() : 'Someone';
  }
  function sectionData(id) {
    return review?.sections?.[id] || { note: null, comments: [] };
  }
  function latestSeq(data) {
    return Math.max(0, ...(data?.comments || []).map(comment => Number.isSafeInteger(comment.seq) ? comment.seq : 0));
  }
  function ensureReadCursors() {
    if (readCursors !== null || !review) return;
    // Existing comments are the starting point for a first-time visitor.
    readCursors = Object.fromEntries(sections.map(([id]) => [id, latestSeq(sectionData(id))]));
    save(readKey, JSON.stringify(readCursors));
  }
  function unreadCount(id) {
    if (!readCursors || !review) return 0;
    return (sectionData(id).comments || []).filter(comment =>
      Number.isSafeInteger(comment.seq) && comment.seq > (readCursors[id] || 0)).length;
  }
  function unreadTotal() {
    return sections.reduce((total, [id]) => total + unreadCount(id), 0);
  }
  function markRead() {
    if (panel.hidden || tab !== 'comments' || !review || !readCursors) return;
    const next = latestSeq(sectionData(selected));
    if (next <= (readCursors[selected] || 0)) return;
    readCursors[selected] = next;
    save(readKey, JSON.stringify(readCursors));
    updateBadge();
    updateHeroSummary();
  }
  function updateBadge() {
    const count = unreadTotal();
    for (const badge of [$('#review-unread'), $('#review-top-unread')]) {
      if (!badge) continue;
      badge.hidden = count === 0;
      badge.textContent = count > 99 ? '99+' : String(count);
    }
    launcher.setAttribute('aria-label', count ? 'Open review, ' + count + ' new comment' + (count === 1 ? '' : 's') : 'Open review');
    topTrigger?.setAttribute('aria-label', count ? 'Open comments, ' + count + ' new comment' + (count === 1 ? '' : 's') : 'Open comments');
    for (const [id] of sections) {
      const button = document.querySelector('[data-section-review="' + id + '"]');
      const countNode = button?.querySelector('span');
      if (countNode) countNode.textContent = unreadCount(id) || '';
    }
  }
  function updateHeroSummary() {
    const latestNode = $('#brief-latest-note');
    const unreadNode = $('#brief-unread-summary');
    if (!review) {
      if (latestNode) latestNode.textContent = loaded ? 'Shared notes unavailable right now' : 'Loading latest note…';
      if (unreadNode) unreadNode.textContent = loaded ? 'Comments unavailable right now' : 'Loading comments…';
      return;
    }
    const latest = sections
      .map(([id, label]) => ({ label, note: sectionData(id).note }))
      .filter(({ note }) => note?.body?.trim())
      .sort((a, b) => Date.parse(b.note.updatedAt) - Date.parse(a.note.updatedAt))[0];
    if (latestNode) {
      const excerpt = latest?.note.body.trim().replace(/\s+/g, ' ');
      latestNode.textContent = latest
        ? 'Latest note · ' + latest.label + ': ' + (excerpt.length > 140 ? excerpt.slice(0, 139).trimEnd() + '…' : excerpt)
        : 'No shared notes yet';
    }
    if (unreadNode) {
      const count = unreadTotal();
      unreadNode.textContent = count ? count + ' new comment' + (count === 1 ? '' : 's') : 'No new comments';
    }
  }
  function renderNotesGrid() {
    const focusedId = notesGrid.contains(document.activeElement) ? document.activeElement.dataset.reviewNote : null;
    notesGrid.replaceChildren();
    if (!review) {
      notesGrid.append(element('p', 'review-grid-message', loaded ? 'Shared notes are unavailable right now.' : 'Loading shared notes…'));
      return;
    }
    for (const [id, label] of sections.filter(([id]) => id !== 'review-notes')) {
      const note = sectionData(id).note;
      const button = element('button', 'review-note-card');
      button.type = 'button';
      button.dataset.reviewNote = id;
      button.append(element('strong', '', label));
      button.append(element('p', '', note?.body || 'No shared note yet.'));
      if (note?.updatedAt) button.append(element('small', '', 'Updated by ' + reviewerName(note.updatedBy) + ' (unverified) · ' + formatTime(note.updatedAt)));
      button.addEventListener('click', () => openReview(id, 'notes', button));
      notesGrid.append(button);
    }
    if (focusedId) notesGrid.querySelector('[data-review-note="' + focusedId + '"]')?.focus();
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
      meta.append(element('strong', '', reviewerName(comment.author) + ' (unverified)'));
      const time = element('time', '', formatTime(comment.createdAt));
      time.dateTime = comment.createdAt;
      meta.append(time);
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
    if (note?.updatedAt) content.append(element('p', 'review-note-meta', 'Updated by ' + reviewerName(note.updatedBy) + ' (unverified) · ' + formatTime(note.updatedAt)));
    else content.append(element('p', 'review-note-meta', 'Anyone with this link can read and edit this note.'));
    if (!noteDrafts.has(selected)) noteInput.value = note?.body || '';
  }
  function renderPanel() {
    $('#review-panel-title').textContent = labels[selected];
    sectionSelect.value = selected;
    for (const button of document.querySelectorAll('[data-review-tab]')) {
      button.setAttribute('aria-pressed', String(button.dataset.reviewTab === tab));
    }
    $('#review-comment-form').hidden = tab !== 'comments' || !review;
    $('#review-note-form').hidden = tab !== 'notes' || !review;
    if (!review) {
      $('#review-content').replaceChildren(element('p', 'review-empty',
        loaded ? 'Shared review is unavailable right now.' : 'Loading shared review…'));
      return;
    }
    if (tab === 'comments') renderComments(); else renderNote();
  }
  function render() {
    updateBadge();
    updateHeroSummary();
    renderNotesGrid();
    renderPanel();
  }
  function refresh() {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      try {
        const next = await api();
        if (!next || !next.sections || typeof next.sections !== 'object') throw new Error('Review data is unavailable.');
        review = next;
        loaded = true;
        ensureReadCursors();
        message('');
        render();
        markRead();
      } catch (error) {
        loaded = true;
        message(error.status === 503 ? 'Shared review is temporarily unavailable.' : error.message);
        render();
      }
    })().finally(() => { refreshPromise = null; });
    return refreshPromise;
  }
  async function refreshAfterMutation() {
    if (refreshPromise) await refreshPromise;
    await refresh();
  }
  function rememberDrafts() {
    if (tab === 'comments') {
      if (commentInput.value) commentDrafts.set(selected, commentInput.value);
      else commentDrafts.delete(selected);
    } else {
      const savedNote = sectionData(selected).note?.body || '';
      if (noteInput.value !== savedNote) noteDrafts.set(selected, noteInput.value);
      else noteDrafts.delete(selected);
    }
  }
  function chooseSection(id) {
    if (!labels[id] || id === selected) return;
    rememberDrafts();
    selected = id;
    commentInput.value = commentDrafts.get(id) || '';
    noteInput.value = noteDrafts.has(id) ? noteDrafts.get(id) : (sectionData(id).note?.body || '');
    renderPanel();
    markRead();
  }
  function chooseTab(next) {
    if (next === tab) return;
    rememberDrafts();
    tab = next;
    renderPanel();
    markRead();
  }
  function openReview(id = selected, view = 'comments', trigger = launcher) {
    returnFocus = trigger;
    if (labels[id]) chooseSection(id);
    tab = view;
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    topTrigger?.setAttribute('aria-expanded', 'true');
    renderPanel();
    sectionSelect.focus();
    markRead();
  }
  function closeReview() {
    rememberDrafts();
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    topTrigger?.setAttribute('aria-expanded', 'false');
    message('');
    const replacement = returnFocus?.dataset.reviewNote
      ? notesGrid.querySelector('[data-review-note="' + returnFocus.dataset.reviewNote + '"]')
      : null;
    (returnFocus?.isConnected ? returnFocus : replacement || launcher).focus();
  }
  function displayName() {
    const name = nameInput.value.trim().replace(/\s+/g, ' ');
    if (!name) {
      message('Enter a display name before posting.');
      nameInput.focus();
      return null;
    }
    nameInput.value = name;
    save(nameKey, name);
    return name;
  }
  async function post(action, sectionId, body, name, revision) {
    const payload = { action, sectionId, body, displayName: name };
    if (action === 'note') payload.revision = revision;
    const result = await api({ method: 'POST', body: JSON.stringify(payload) });
    if (review?.sections && result.section) {
      review.sections[sectionId] = result.section;
      if (action === 'comment' && readCursors) {
        readCursors[sectionId] = latestSeq(result.section);
        save(readKey, JSON.stringify(readCursors));
      }
      render();
    }
    await refreshAfterMutation();
  }

  nameInput.value = (stored(nameKey) || '').slice(0, 80);
  for (const [id, label] of sections) {
    sectionSelect.add(new Option(label, id));
    const header = document.querySelector('#' + id + ' > .section-title');
    if (!header) continue;
    const button = element('button', 'section-review-button', 'Comment');
    button.type = 'button';
    button.dataset.sectionReview = id;
    button.setAttribute('aria-label', 'Comment on ' + label);
    button.append(element('span'));
    button.addEventListener('click', () => openReview(id, 'comments', button));
    header.append(button);
  }
  launcher.addEventListener('click', () => openReview());
  topTrigger?.addEventListener('click', () => {
    const firstUnread = sections.find(([id]) => unreadCount(id) > 0)?.[0];
    openReview(firstUnread || selected, 'comments', topTrigger);
  });
  $('#review-close').addEventListener('click', closeReview);
  sectionSelect.addEventListener('change', () => chooseSection(sectionSelect.value));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) closeReview();
  });
  document.querySelectorAll('[data-review-tab]').forEach(button =>
    button.addEventListener('click', () => chooseTab(button.dataset.reviewTab)));
  nameInput.addEventListener('change', () => {
    const name = nameInput.value.trim().replace(/\s+/g, ' ');
    nameInput.value = name;
    save(nameKey, name);
  });
  commentInput.addEventListener('input', () => commentDrafts.set(selected, commentInput.value));
  noteInput.addEventListener('input', () => noteDrafts.set(selected, noteInput.value));
  $('#review-comment-form').addEventListener('submit', async event => {
    event.preventDefault();
    const body = commentInput.value.trim();
    if (!body) return;
    const name = displayName();
    if (!name) return;
    const sectionId = selected;
    const submittedDraft = commentInput.value;
    const button = event.submitter || $('#review-comment-form button');
    button.disabled = true;
    try {
      await post('comment', sectionId, body, name);
      if (commentDrafts.get(sectionId) === submittedDraft) commentDrafts.delete(sectionId);
      if (selected === sectionId && commentInput.value === submittedDraft) commentInput.value = '';
      message('');
    } catch (error) {
      message(error.status === 503 ? 'Shared review is temporarily unavailable.' : error.message);
    } finally { button.disabled = false; }
  });
  $('#review-note-form').addEventListener('submit', async event => {
    event.preventDefault();
    const body = noteInput.value.trim();
    const name = displayName();
    if (!name) return;
    const sectionId = selected;
    const submittedDraft = noteInput.value;
    const revision = sectionData(sectionId).note?.revision || 0;
    noteDrafts.set(sectionId, submittedDraft);
    const button = event.submitter || $('#review-note-form button');
    button.disabled = true;
    try {
      await post('note', sectionId, body, name, revision);
      if (noteDrafts.get(sectionId) === submittedDraft) noteDrafts.delete(sectionId);
      message('');
    } catch (error) {
      if (error.status === 409) await refreshAfterMutation();
      message(error.status === 409
        ? 'This note changed elsewhere. Your draft is still here; compare it with the latest note before saving again.'
        : error.status === 503 ? 'Shared review is temporarily unavailable.' : error.message);
    } finally { button.disabled = false; }
  });

  const contentSections = sections.map(([id]) => document.getElementById(id)).filter(Boolean);
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
  let lastBackgroundRefresh = 0;
  setInterval(() => {
    if (document.hidden) return;
    if (!panel.hidden || Date.now() - lastBackgroundRefresh >= 120000) {
      lastBackgroundRefresh = Date.now();
      void refresh();
    }
  }, 30000);
  render();
  void refresh();
})();
