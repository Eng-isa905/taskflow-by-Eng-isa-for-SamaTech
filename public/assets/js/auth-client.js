'use strict';

window.TaskFlowAuth = (() => {
  let csrfToken = null;

  async function readResponse(response) {
    const data = await response.json().catch(() => ({}));
    if (data && typeof data.csrfToken === 'string') csrfToken = data.csrfToken;
    if (!response.ok) {
      const error = new Error(data.error || 'تعذر تنفيذ الطلب. يرجى المحاولة مجدداً.');
      error.status = response.status;
      error.code = data.code || 'REQUEST_FAILED';
      throw error;
    }
    return data;
  }

  async function getCsrfToken(forceRefresh = false) {
    if (csrfToken && !forceRefresh) return csrfToken;
    const response = await fetch('/api/auth/csrf', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store'
    });
    const data = await readResponse(response);
    csrfToken = data.csrfToken;
    return csrfToken;
  }

  async function request(url, options = {}) {
    const method = String(options.method || 'GET').toUpperCase();
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    let body = options.body;

    if (body !== undefined && body !== null && typeof body !== 'string' && !(body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(body);
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      headers.set('X-CSRF-Token', await getCsrfToken());
    }

    const response = await fetch(url, {
      ...options,
      method,
      headers,
      body,
      credentials: 'same-origin',
      cache: 'no-store'
    });
    return readResponse(response);
  }

  function showMessage(element, message, type = 'error') {
    if (!element) return;
    element.textContent = message;
    element.className = `auth-message is-visible is-${type}`;
  }

  function setBusy(button, busy, label) {
    if (!button) return;
    if (!button.dataset.originalText) button.dataset.originalText = button.textContent;
    button.disabled = busy;
    button.textContent = busy ? label : button.dataset.originalText;
  }

  return Object.freeze({ request, getCsrfToken, showMessage, setBusy });
})();
