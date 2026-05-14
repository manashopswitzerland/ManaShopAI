(function () {
  'use strict';

  // ── Config (overridable via window.ManaChat before script loads) ──
  const cfg = Object.assign({
    store:    'mana-shop',
    lang:     'de',
    apiBase:  'https://manashopai.onrender.com',
    position: 'right',          // 'right' | 'left'
    accentColor: '#2D4A3E',
    bubbleColor: '#C4853A',
  }, window.ManaChat || {});

  const sessionId = 'w-' + Math.random().toString(36).slice(2);

  // ── Inject styles ─────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #mana-chat-bubble {
      position: fixed;
      bottom: 24px;
      ${cfg.position}: 24px;
      width: 58px; height: 58px;
      border-radius: 50%;
      background: ${cfg.bubbleColor};
      box-shadow: 0 4px 18px rgba(0,0,0,0.22);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      z-index: 99999;
      transition: transform .2s, box-shadow .2s;
    }
    #mana-chat-bubble:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(0,0,0,0.28); }
    #mana-chat-bubble svg  { width: 28px; height: 28px; }

    #mana-chat-panel {
      position: fixed;
      bottom: 96px;
      ${cfg.position}: 24px;
      width: 360px;
      height: 520px;
      background: #FDFAF6;
      border-radius: 18px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      display: flex; flex-direction: column;
      z-index: 99998;
      overflow: hidden;
      transform: scale(0.92) translateY(20px);
      opacity: 0;
      pointer-events: none;
      transition: transform .25s cubic-bezier(.34,1.56,.64,1), opacity .2s;
    }
    #mana-chat-panel.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    /* Header */
    .mc-header {
      background: ${cfg.accentColor};
      padding: 14px 16px;
      display: flex; align-items: center; gap: 10px;
    }
    .mc-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: #C4853A;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .mc-avatar svg { width: 20px; height: 20px; }
    .mc-header-text { flex: 1; }
    .mc-header-text strong { color: #fff; font-size: 14px; display: block; font-family: Georgia, serif; }
    .mc-header-text span   { color: rgba(255,255,255,.7); font-size: 11px; }
    .mc-close {
      color: rgba(255,255,255,.8); cursor: pointer; font-size: 20px;
      line-height: 1; padding: 4px; border-radius: 50%;
    }
    .mc-close:hover { color: #fff; background: rgba(255,255,255,.15); }

    /* Messages */
    .mc-messages {
      flex: 1; overflow-y: auto; padding: 14px 12px;
      display: flex; flex-direction: column; gap: 10px;
      scroll-behavior: smooth;
    }
    .mc-messages::-webkit-scrollbar { width: 4px; }
    .mc-messages::-webkit-scrollbar-thumb { background: #D4C5B2; border-radius: 4px; }

    .mc-msg { max-width: 82%; display: flex; flex-direction: column; gap: 3px; }
    .mc-msg.user { align-self: flex-end; align-items: flex-end; }
    .mc-msg.bot  { align-self: flex-start; align-items: flex-start; }

    .mc-bubble {
      padding: 9px 13px; border-radius: 16px; font-size: 13.5px;
      line-height: 1.5; font-family: -apple-system, sans-serif;
    }
    .mc-msg.user .mc-bubble { background: ${cfg.accentColor}; color: #fff; border-bottom-right-radius: 4px; }
    .mc-msg.bot  .mc-bubble { background: #fff; color: #333; border-bottom-left-radius: 4px;
                               box-shadow: 0 1px 4px rgba(0,0,0,0.08); }

    /* Typing indicator */
    .mc-typing .mc-bubble { padding: 12px 16px; }
    .mc-dots { display: flex; gap: 4px; align-items: center; }
    .mc-dots span {
      width: 7px; height: 7px; border-radius: 50%;
      background: #C4853A; animation: mc-bounce .9s infinite;
    }
    .mc-dots span:nth-child(2) { animation-delay: .15s; }
    .mc-dots span:nth-child(3) { animation-delay: .30s; }
    @keyframes mc-bounce {
      0%,60%,100% { transform: translateY(0); }
      30%          { transform: translateY(-6px); }
    }

    /* Input */
    .mc-input-row {
      display: flex; gap: 8px; padding: 10px 12px;
      border-top: 1px solid #EDE8E0; background: #FDFAF6;
    }
    .mc-input {
      flex: 1; border: 1.5px solid #DDD5C8; border-radius: 22px;
      padding: 9px 14px; font-size: 13.5px; outline: none;
      font-family: -apple-system, sans-serif; background: #fff;
      resize: none; height: 40px; line-height: 1.3;
      transition: border-color .15s;
    }
    .mc-input:focus { border-color: ${cfg.accentColor}; }
    .mc-send {
      width: 40px; height: 40px; border-radius: 50%; border: none;
      background: ${cfg.accentColor}; color: #fff; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s; flex-shrink: 0;
    }
    .mc-send:hover { background: #1e3329; }
    .mc-send svg { width: 16px; height: 16px; }
    .mc-send:disabled { background: #ccc; cursor: not-allowed; }

    .mc-powered {
      text-align: center; font-size: 10px; color: #bbb;
      padding: 4px 0 8px; font-family: -apple-system, sans-serif;
    }

    @media (max-width: 420px) {
      #mana-chat-panel { width: calc(100vw - 24px); ${cfg.position}: 12px; bottom: 90px; }
      #mana-chat-bubble { ${cfg.position}: 12px; }
    }
  `;
  document.head.appendChild(style);

  // ── SVG helpers ───────────────────────────────────────────────────
  const lotusSVG = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="26" rx="10" ry="6" fill="rgba(255,255,255,0.25)"/>
    <path d="M20 28 C15 20 10 16 10 10 C14 12 17 16 20 20 C23 16 26 12 30 10 C30 16 25 20 20 28Z" fill="white" opacity="0.9"/>
    <path d="M20 28 C18 22 14 18 8 16 C10 20 14 24 20 28Z" fill="white" opacity="0.7"/>
    <path d="M20 28 C22 22 26 18 32 16 C30 20 26 24 20 28Z" fill="white" opacity="0.7"/>
  </svg>`;

  const sendSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>`;

  const chatSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>`;

  // ── Build DOM ─────────────────────────────────────────────────────
  const bubble = document.createElement('div');
  bubble.id = 'mana-chat-bubble';
  bubble.innerHTML = chatSVG;
  document.body.appendChild(bubble);

  const panel = document.createElement('div');
  panel.id = 'mana-chat-panel';
  panel.innerHTML = `
    <div class="mc-header">
      <div class="mc-avatar">${lotusSVG}</div>
      <div class="mc-header-text">
        <strong>Mana Assistentin</strong>
        <span>Online · antwortet sofort</span>
      </div>
      <div class="mc-close" id="mc-close">✕</div>
    </div>
    <div class="mc-messages" id="mc-messages"></div>
    <div class="mc-input-row">
      <textarea class="mc-input" id="mc-input" placeholder="Schreibe eine Nachricht…" rows="1"></textarea>
      <button class="mc-send" id="mc-send">${sendSVG}</button>
    </div>
    <div class="mc-powered">Powered by Mana AI Hub</div>
  `;
  document.body.appendChild(panel);

  // ── State ─────────────────────────────────────────────────────────
  let open = false;
  let busy = false;
  let humanMode = false;
  let shownMessages = new Set(); // track by content+role to avoid duplicates
  let pollTimer = null;

  function togglePanel() {
    open = !open;
    panel.classList.toggle('open', open);
    if (open && document.getElementById('mc-messages').children.length === 0) {
      addBotMessage('Hallo! Ich bin die KI-Assistentin von Mana. Ich helfe dir gerne bei Fragen zu unseren Produkten, Behandlungen und Bestellungen. Falls du deine Antwort nicht findest, verbinde ich dich mit einem echten Mitarbeiter.');
    }
    if (open) setTimeout(() => document.getElementById('mc-input').focus(), 300);
  }

  bubble.addEventListener('click', togglePanel);
  document.getElementById('mc-close').addEventListener('click', togglePanel);

  // ── Messages ──────────────────────────────────────────────────────
  function linkify(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/ • /g, '\n• ')
      .replace(/\n/g, '<br>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;word-break:break-all;">$1</a>');
  }

  function addMessage(role, text) {
    const msgs = document.getElementById('mc-messages');
    const wrap = document.createElement('div');
    wrap.className = `mc-msg ${role}`;
    const bub = document.createElement('div');
    bub.className = 'mc-bubble';
    bub.innerHTML = linkify(text);
    wrap.appendChild(bub);
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
    return wrap;
  }

  function addBotMessage(text) { return addMessage('bot', text); }
  function addUserMessage(text) { return addMessage('user', text); }

  function showTyping() {
    const msgs = document.getElementById('mc-messages');
    const wrap = document.createElement('div');
    wrap.className = 'mc-msg bot mc-typing';
    wrap.id = 'mc-typing';
    wrap.innerHTML = '<div class="mc-bubble"><div class="mc-dots"><span></span><span></span><span></span></div></div>';
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById('mc-typing');
    if (t) t.remove();
  }

  // ── Human mode polling ────────────────────────────────────────────
  function msgKey(m) { return m.timestamp + '|' + m.role + '|' + m.content.slice(0, 60); }

  function startPolling() {
    if (pollTimer) return;
    console.log('[ManaChat] Human mode — starting polling for', sessionId);
    fetch(`${cfg.apiBase}/chat/web/messages/${sessionId}?since=1970-01-01`)
      .then(r => r.json())
      .then(data => {
        console.log('[ManaChat] Snapshot:', data.messages?.length, 'msgs, status:', data.status);
        (data.messages || []).forEach(m => shownMessages.add(msgKey(m)));
        pollTimer = setInterval(pollMessages, 3000);
      })
      .catch(e => { console.error('[ManaChat] Snapshot error:', e); pollTimer = setInterval(pollMessages, 3000); });
  }

  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  async function pollMessages() {
    try {
      const res = await fetch(`${cfg.apiBase}/chat/web/messages/${sessionId}?since=1970-01-01`);
      const data = await res.json();
      console.log('[ManaChat] Poll —', data.messages?.length, 'total msgs, status:', data.status);

      if (data.status === 'resolved' || data.status === 'ai') {
        humanMode = false; stopPolling();
      }

      let hasNew = false;
      (data.messages || []).forEach(m => {
        if (m.role !== 'assistant') return;
        const key = msgKey(m);
        if (shownMessages.has(key)) return;
        shownMessages.add(key);
        console.log('[ManaChat] New message from agent:', m.content.slice(0, 40));
        addBotMessage(m.content);
        hasNew = true;
      });

      if (hasNew) {
        const msgs = document.getElementById('mc-messages');
        msgs.scrollTop = msgs.scrollHeight;
      }
    } catch(e) { console.error('[ManaChat] Poll error:', e); }
  }

  // ── Send ──────────────────────────────────────────────────────────
  async function sendMessage() {
    const input = document.getElementById('mc-input');
    const text = input.value.trim();
    if (!text || busy) return;

    busy = true;
    input.value = '';
    input.style.height = 'auto';
    document.getElementById('mc-send').disabled = true;

    addUserMessage(text);

    // In human mode — just store message silently, agent will reply via polling
    if (humanMode) {
      try {
        await fetch(`${cfg.apiBase}/chat/web`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, sessionId, storeId: cfg.store }),
        });
      } catch { /* silent */ }
      busy = false;
      document.getElementById('mc-send').disabled = false;
      input.focus();
      return;
    }

    showTyping();

    try {
      const res = await fetch(`${cfg.apiBase}/chat/web`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId, storeId: cfg.store }),
      });
      const data = await res.json();
      hideTyping();

      // Detect handoff
      if (data.handoffTriggered || data.conversationStatus === 'human_pending' || data.conversationStatus === 'human') {
        humanMode = true;
      }

      addBotMessage(data.reply || 'Es tut mir leid, bitte versuche es erneut.');

      if (humanMode) startPolling();
    } catch {
      hideTyping();
      addBotMessage('Verbindungsfehler. Bitte versuche es später erneut.');
    }

    busy = false;
    document.getElementById('mc-send').disabled = false;
    input.focus();
  }

  // Also start polling if page loads mid-conversation in human mode
  async function checkInitialStatus() {
    try {
      const res = await fetch(`${cfg.apiBase}/chat/web/messages/${sessionId}?since=1970-01-01`);
      const data = await res.json();
      if (data.status === 'human_pending' || data.status === 'human') {
        humanMode = true; startPolling();
      }
    } catch { /* silent */ }
  }

  document.getElementById('mc-send').addEventListener('click', sendMessage);
  document.getElementById('mc-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // Check status on open
  const _origToggle = togglePanel;
  checkInitialStatus();
})();
