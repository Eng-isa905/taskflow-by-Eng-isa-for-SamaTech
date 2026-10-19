'use strict';

const brand = window.TASKFLOW_BRAND;
document.querySelectorAll('[data-brand]').forEach((element) => {
  const key = element.dataset.brand;
  if (Object.prototype.hasOwnProperty.call(brand, key)) element.textContent = brand[key];
});

const statusDot = document.querySelector('[data-health-dot]');
const statusText = document.querySelector('[data-health-text]');
const apiState = document.querySelector('[data-api-state]');
const databaseState = document.querySelector('[data-db-state]');
const schemaState = document.querySelector('[data-schema-state]');
const schemaTables = document.querySelector('[data-schema-tables]');
const refreshedAt = document.querySelector('[data-refreshed-at]');

function setStatus(ok, message) {
  if (statusDot) statusDot.classList.toggle('is-online', ok);
  if (statusText) statusText.textContent = message;
  if (apiState) apiState.textContent = ok ? 'يعمل' : 'غير متاح';
  if (databaseState) databaseState.textContent = ok ? 'متصلة' : 'لم يتم التأكد';
}

async function refreshHealth() {
  try {
    const response = await fetch('/api/health', { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error('تعذر فحص حالة الخادم.');
    const data = await response.json();
    const db = data.database || {};
    const ok = data.status === 'ok' && db.connected === true;
    setStatus(ok, ok ? 'الخدمات الأساسية تعمل بشكل طبيعي' : 'الخدمة تحتاج إلى مراجعة');
    if (schemaState) schemaState.textContent = `الإصدار ${Number(db.schemaVersion || 0)}`;
    if (schemaTables) {
      const expected = ['users', 'projects', 'tasks'];
      const present = Array.isArray(db.initializedTables) ? db.initializedTables : [];
      schemaTables.textContent = `${present.length} من ${expected.length} جداول`;
    }
    if (refreshedAt) refreshedAt.textContent = `آخر فحص ${new Date().toLocaleTimeString(document.documentElement.lang || 'ar')}`;
  } catch (_error) {
    setStatus(false, 'تعذر الاتصال بواجهة النظام المحلية');
    if (schemaState) schemaState.textContent = 'غير متحقق منه';
    if (schemaTables) schemaTables.textContent = 'بيانات قاعدة البيانات غير متاحة';
    if (refreshedAt) refreshedAt.textContent = 'فشل الفحص. اضغط تحديث للمحاولة مجدداً.';
  }
}

const refreshButton = document.querySelector('[data-refresh-health]');
if (refreshButton) refreshButton.addEventListener('click', refreshHealth);
refreshHealth();


document.addEventListener('taskflow:languagechange', refreshHealth);
