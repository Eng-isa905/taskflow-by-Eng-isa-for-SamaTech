'use strict';

const setupForm = document.querySelector('[data-setup-form]');
const setupStatus = document.querySelector('[data-setup-status]');
const setupMessage = document.querySelector('[data-auth-message]');
const setupButton = document.querySelector('[data-submit]');

function setSetupFormEnabled(enabled) { if (setupForm) setupForm.hidden = !enabled; }

async function checkSetupStatus() {
  try {
    const data = await window.TaskFlowAuth.request('/api/auth/setup-status');
    if (data.setupAllowed) {
      setupStatus.textContent = 'الإعداد الأولي متاح. أكمل النموذج مرة واحدة لإنشاء حساب المدير الأول.';
      setupStatus.className = 'auth-message is-visible is-success';
      setSetupFormEnabled(true);
    } else {
      setupStatus.textContent = 'الإعداد الأولي غير متاح؛ إما أنه اكتمل مسبقاً أو أن رمز الإعداد لم يُضبط على الخادم. لا تحذف قاعدة البيانات لإعادة فتح الإعداد.';
      setupStatus.className = 'auth-message is-visible is-info';
      setSetupFormEnabled(false);
    }
  } catch (error) {
    setupStatus.textContent = error.message;
    setupStatus.className = 'auth-message is-visible is-error';
    setSetupFormEnabled(false);
  }
}

if (setupForm) {
  checkSetupStatus();
  setupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setupMessage.className = 'auth-message';
    const password = setupForm.elements.password.value;
    const confirmPassword = setupForm.elements.confirmPassword.value;
    if (password !== confirmPassword) {
      window.TaskFlowAuth.showMessage(setupMessage, 'كلمتا المرور غير متطابقتين.');
      return;
    }
    if (password.length < 12 || new TextEncoder().encode(password).length > 72) {
      window.TaskFlowAuth.showMessage(setupMessage, 'اختر كلمة مرور من 12 محرفاً على الأقل، وبحد أقصى 72 بايت وفق UTF-8.');
      return;
    }
    const body = {
      setupToken: setupForm.elements.setupToken.value,
      fullName: setupForm.elements.fullName.value.trim(),
      username: setupForm.elements.username.value.trim(),
      email: setupForm.elements.email.value.trim(),
      password
    };
    window.TaskFlowAuth.setBusy(setupButton, true, 'جارٍ إنشاء الحساب…');
    try {
      await window.TaskFlowAuth.request('/api/auth/setup', { method: 'POST', body });
      setupForm.reset();
      setupForm.hidden = true;
      setupStatus.className = 'auth-message';
      window.TaskFlowAuth.showMessage(setupMessage, 'تم إنشاء حساب المدير بنجاح، وأُغلق الإعداد الأولي. سيتم نقلك إلى صفحة تسجيل الدخول…', 'success');
      window.setTimeout(() => window.location.assign('/login.html?setup=complete'), 900);
    } catch (error) {
      window.TaskFlowAuth.showMessage(setupMessage, error.message);
      if (error.code === 'SETUP_CLOSED') {
        setupForm.hidden = true;
        checkSetupStatus();
      }
    } finally {
      window.TaskFlowAuth.setBusy(setupButton, false);
    }
  });
}
