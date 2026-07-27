/**
 * RepairBill Website Chat Widget
 * ---------------------------------------------------------------
 * Embeddable message-capture widget. Drops a floating bubble on any
 * website; visitor messages are POSTed to /api/web-integration/leads
 * and appear instantly in the RepairBill Inbox (Communication Hub).
 *
 * Usage — paste this before </body> on your website:
 *
 *   <script
 *     src="https://repairbill.shop/repairbill-widget.js"
 *     data-api-key="YOUR_WEB_LEAD_API_KEY"
 *     data-company="Your Business Name"
 *     data-color="#2563eb">
 *   </script>
 *
 * data-api-key must match the WEB_LEAD_API_KEY set on the server.
 * This widget captures a message (like a contact form) rather than
 * live two-way chat — replies from the dashboard are saved to the
 * conversation thread but are not yet pushed back to the visitor in
 * real time.
 */
(function () {
  var scriptTag = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var API_KEY = scriptTag.getAttribute('data-api-key') || '';
  var COMPANY = scriptTag.getAttribute('data-company') || 'Us';
  var COLOR = scriptTag.getAttribute('data-color') || '#2563eb';
  var API_BASE = scriptTag.getAttribute('data-api-base') ||
    (scriptTag.src ? new URL(scriptTag.src).origin : window.location.origin);

  if (!API_KEY) {
    console.warn('[RepairBill Widget] Missing data-api-key attribute — widget will not be able to send messages.');
  }

  var css = '' +
    '#rb-widget-bubble{position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;' +
    'background:' + COLOR + ';box-shadow:0 8px 24px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;' +
    'cursor:pointer;z-index:999999;border:none;transition:transform .2s ease;}' +
    '#rb-widget-bubble:hover{transform:scale(1.08);}' +
    '#rb-widget-panel{position:fixed;bottom:96px;right:24px;width:340px;max-width:calc(100vw - 32px);' +
    'background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.25);z-index:999999;overflow:hidden;' +
    'display:none;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}' +
    '#rb-widget-panel.rb-open{display:flex;}' +
    '#rb-widget-header{background:' + COLOR + ';color:#fff;padding:18px 20px;font-weight:700;font-size:14px;' +
    'display:flex;justify-content:space-between;align-items:center;}' +
    '#rb-widget-close{cursor:pointer;opacity:.8;font-size:18px;line-height:1;background:none;border:none;color:#fff;}' +
    '#rb-widget-body{padding:18px 20px;display:flex;flex-direction:column;gap:10px;}' +
    '#rb-widget-body p{margin:0 0 4px;font-size:12px;color:#666;}' +
    '.rb-input{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #e2e2e2;border-radius:10px;' +
    'font-size:13px;outline:none;font-family:inherit;}' +
    '.rb-input:focus{border-color:' + COLOR + ';}' +
    'textarea.rb-input{resize:none;min-height:70px;}' +
    '#rb-widget-send{background:' + COLOR + ';color:#fff;border:none;padding:11px;border-radius:10px;' +
    'font-weight:700;font-size:13px;cursor:pointer;margin-top:4px;}' +
    '#rb-widget-send:disabled{opacity:.5;cursor:not-allowed;}' +
    '#rb-widget-success{padding:30px 20px;text-align:center;font-size:13px;color:#333;display:none;}';

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var bubble = document.createElement('button');
  bubble.id = 'rb-widget-bubble';
  bubble.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  bubble.setAttribute('aria-label', 'Open chat');

  var panel = document.createElement('div');
  panel.id = 'rb-widget-panel';
  panel.innerHTML =
    '<div id="rb-widget-header">' +
      '<span>Message ' + COMPANY + '</span>' +
      '<button id="rb-widget-close" aria-label="Close">&times;</button>' +
    '</div>' +
    '<div id="rb-widget-body">' +
      '<p>Send us a message and we\'ll get back to you.</p>' +
      '<input class="rb-input" id="rb-w-name" type="text" placeholder="Your name" />' +
      '<input class="rb-input" id="rb-w-email" type="email" placeholder="Email address" />' +
      '<input class="rb-input" id="rb-w-phone" type="tel" placeholder="Phone (optional)" />' +
      '<textarea class="rb-input" id="rb-w-message" placeholder="How can we help?"></textarea>' +
      '<button id="rb-widget-send">Send Message</button>' +
    '</div>' +
    '<div id="rb-widget-success">✅ Thanks! Your message has been sent — we\'ll be in touch shortly.</div>';

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  bubble.addEventListener('click', function () {
    panel.classList.toggle('rb-open');
  });
  panel.querySelector('#rb-widget-close').addEventListener('click', function () {
    panel.classList.remove('rb-open');
  });

  panel.querySelector('#rb-widget-send').addEventListener('click', function () {
    var name = document.getElementById('rb-w-name').value.trim();
    var email = document.getElementById('rb-w-email').value.trim();
    var phone = document.getElementById('rb-w-phone').value.trim();
    var message = document.getElementById('rb-w-message').value.trim();
    var sendBtn = panel.querySelector('#rb-widget-send');

    if (!name || !message) {
      alert('Please enter your name and a message.');
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    fetch(API_BASE + '/api/web-integration/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY
      },
      body: JSON.stringify({
        customerName: name,
        customerEmail: email || undefined,
        customerPhone: phone || undefined,
        message: message,
        type: 'contact',
        metadata: { source: window.location.href }
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(function () {
        panel.querySelector('#rb-widget-body').style.display = 'none';
        panel.querySelector('#rb-widget-success').style.display = 'block';
      })
      .catch(function (err) {
        console.error('[RepairBill Widget] Failed to send message:', err);
        alert('Sorry, something went wrong sending your message. Please try again or contact us directly.');
      })
      .finally(function () {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send Message';
      });
  });
})();
