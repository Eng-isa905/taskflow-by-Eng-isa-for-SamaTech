'use strict';

const workspaceMessage = document.querySelector('[data-auth-message]');
const directoryMessage = document.querySelector('[data-directory-message]');
const directoryWrap = document.querySelector('[data-directory-wrap]');
const directoryBody = document.querySelector('[data-directory-body]');
const logoutButton = document.querySelector('[data-logout]');
const roleLabels = { admin: 'مسؤول النظام', manager: 'مدير', member: 'عضو' };

function textAt(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value == null ? '—' : String(value);
}

function appendDirectoryRow(user) {
  const row = document.createElement('tr');
  for (const value of [user.fullName, user.username, roleLabels[user.role] || user.role, user.isActive ? 'نشط' : 'معطّل']) {
    const cell = document.createElement('td');
    cell.textContent = String(value);
    row.appendChild(cell);
  }
  directoryBody.appendChild(row);
}

function renderPermissions(capabilities) {
  const rows = [
    ['إدارة حسابات المستخدمين', capabilities.manageUsers === true],
    ['عرض قائمة المستخدمين', capabilities.viewUserDirectory === true],
    ['إنشاء المشاريع وتعديلها', capabilities.manageProjects === true],
    ['إدارة المهام', capabilities.manageTasks === true],
    ['تحديث المهام المسندة', capabilities.updateAssignedTasks === true]
  ];
  const list = document.querySelector('[data-permission-list]');
  list.replaceChildren();
  rows.forEach(([label, allowed]) => {
    const item = document.createElement('li');
    const title = document.createElement('span');
    title.textContent = label;
    const status = document.createElement('span');
    status.className = `permission-status${allowed ? '' : ' is-disabled'}`;
    status.textContent = allowed ? 'مسموح' : 'غير مسموح';
    item.append(title, status);
    list.appendChild(item);
  });
}

async function loadWorkspace() {
  try {
    const data = await window.TaskFlowAuth.request('/api/auth/me');
    if (!data.authenticated || !data.user) {
      window.location.replace('/login.html');
      return;
    }
    const user = data.user;
    textAt('[data-full-name]', user.fullName);
    textAt('[data-profile-name]', user.fullName);
    textAt('[data-profile-username]', user.username);
    textAt('[data-profile-email]', user.email);
    textAt('[data-profile-role]', roleLabels[user.role] || user.role);
    textAt('[data-profile-status]', user.isActive ? 'نشط' : 'معطّل');
    textAt('[data-role]', roleLabels[user.role] || user.role);
    renderPermissions(data.capabilities || {});

    if (user.role === 'admin') {
      try {
        const directory = await window.TaskFlowAuth.request('/api/admin/users');
        directoryMessage.textContent = `عدد الحسابات المسجلة في هذه النسخة: ${directory.count}. لا يعيد هذا المسار كلمات المرور أو تجزئاتها.`;
        directoryWrap.hidden = false;
        directoryBody.replaceChildren();
        directory.users.forEach(appendDirectoryRow);
      } catch (error) { directoryMessage.textContent = error.message; }
    } else {
      directoryMessage.textContent = 'هذه القائمة متاحة لمسؤول النظام فقط، ويتم فرض الصلاحية على الخادم.';
    }
  } catch (error) {
    window.TaskFlowAuth.showMessage(workspaceMessage, error.message);
    window.location.replace('/login.html');
  }
}

if (logoutButton) logoutButton.addEventListener('click', async () => {
  logoutButton.disabled = true;
  try {
    await window.TaskFlowAuth.request('/api/auth/logout', { method: 'POST', body: {} });
    window.location.replace('/login.html');
  } catch (error) {
    logoutButton.disabled = false;
    window.TaskFlowAuth.showMessage(workspaceMessage, error.message);
  }
});

loadWorkspace();
