'use strict';

const loginForm = document.querySelector('[data-login-form]');
const loginMessage = document.querySelector('[data-auth-message]');
const loginButton = document.querySelector('[data-submit]');

if (loginForm) {
  const query = new URLSearchParams(window.location.search);
  if (query.get('setup') === 'complete') {
    window.TaskFlowAuth.showMessage(loginMessage, 'تم إنشاء حساب المدير بنجاح. سجّل الدخول باستخدام بيانات الحساب التي أنشأتها.', 'success');
  }

  window.TaskFlowAuth.request('/api/auth/me').then((data) => {
    if (data.authenticated) window.location.replace('/projects.html');
  }).catch(() => {});

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginMessage.className = 'auth-message';
    const identifier = loginForm.elements.identifier.value.trim();
    const password = loginForm.elements.password.value;
    if (!identifier || !password) {
      window.TaskFlowAuth.showMessage(loginMessage, 'أدخل اسم المستخدم أو البريد الإلكتروني وكلمة المرور.');
      return;
    }

    window.TaskFlowAuth.setBusy(loginButton, true, 'جارٍ تسجيل الدخول…');
    try {
      await window.TaskFlowAuth.request('/api/auth/login', { method: 'POST', body: { identifier, password } });
      window.location.assign('/projects.html');
    } catch (error) {
      window.TaskFlowAuth.showMessage(loginMessage, error.message);
    } finally {
      window.TaskFlowAuth.setBusy(loginButton, false);
    }
  });
}
