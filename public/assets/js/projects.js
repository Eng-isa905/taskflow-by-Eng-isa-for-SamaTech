'use strict';

const projectList = document.querySelector('[data-project-list]');
const pageMessage = document.querySelector('[data-page-message]');
const projectDialog = document.querySelector('[data-project-dialog]');
const detailsDialog = document.querySelector('[data-details-dialog]');
const projectForm = document.querySelector('[data-project-form]');
const formMessage = document.querySelector('[data-form-message]');
const filterForm = document.querySelector('[data-filter-form]');
const newProjectButton = document.querySelector('[data-new-project]');
const emptyNewButton = document.querySelector('[data-empty-new]');
const logoutButton = document.querySelector('[data-logout]');
const projectsEmpty = document.querySelector('[data-projects-empty]');
const statusLabels = {
  planned: 'مخطط', active: 'نشط', on_hold: 'متوقف مؤقتاً', completed: 'مكتمل', cancelled: 'ملغى'
};
const roleLabels = { admin: 'مسؤول النظام', manager: 'مدير', member: 'عضو' };
let currentUser = null;
let canManageProjects = false;
let canDeleteProjects = false;
let availableUsers = [];
let currentProjectForDetails = null;

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = String(text);
  return element;
}

function formatDate(value) {
  if (!value) return 'غير محدد';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(document.documentElement.lang || 'ar', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

function isDelayed(project) {
  return Boolean(project.dueDate && project.dueDate < new Date().toISOString().slice(0, 10) && !['completed', 'cancelled'].includes(project.status));
}

function setStats(summary) {
  document.querySelector('[data-stat-total]').textContent = String(summary.total ?? 0);
  document.querySelector('[data-stat-active]').textContent = String(summary.active ?? 0);
  document.querySelector('[data-stat-completed]').textContent = String(summary.completed ?? 0);
  document.querySelector('[data-stat-delayed]').textContent = String(summary.delayed ?? 0);
  document.querySelector('[data-project-count]').textContent = `${summary.total ?? 0} مشروع`;
}

function appendMeta(parent, label, value) {
  const wrapper = makeElement('div');
  wrapper.append(makeElement('dt', '', label), makeElement('dd', '', value || 'غير محدد'));
  parent.appendChild(wrapper);
}

function renderProject(project) {
  const card = makeElement('article', 'project-card');
  const top = makeElement('div', 'project-card-top');
  const titleWrap = makeElement('div', 'project-card-title-wrap');
  titleWrap.append(makeElement('span', 'project-code', project.projectCode), makeElement('h3', '', project.name));
  const status = makeElement('span', `project-status${project.status === 'active' ? ' is-active' : ''}${project.status === 'completed' ? ' is-completed' : ''}${isDelayed(project) ? ' is-delayed' : ''}`, isDelayed(project) ? 'متأخر' : (statusLabels[project.status] || project.status));
  top.append(titleWrap, status);
  card.appendChild(top);
  card.appendChild(makeElement('p', 'project-description', project.description || 'لا يوجد وصف مضاف لهذا المشروع.'));

  const progressHeading = makeElement('div', 'project-progress-heading');
  progressHeading.append(makeElement('span', '', 'نسبة الإنجاز'), makeElement('strong', '', `${project.progress || 0}%`));
  card.appendChild(progressHeading);
  const track = makeElement('div', 'progress-track');
  const fill = makeElement('div', 'progress-fill');
  const width = Math.min(100, Math.max(0, Math.round((Number(project.progress) || 0) / 5) * 5));
  fill.classList.add(`progress-width-${width}`);
  track.appendChild(fill);
  card.appendChild(track);

  const meta = makeElement('dl', 'project-meta');
  appendMeta(meta, 'المسؤول', project.ownerName || 'لم يحدد');
  appendMeta(meta, 'المهام', `${project.completedTasks || 0} مكتملة من ${project.taskCount || 0}`);
  appendMeta(meta, 'تاريخ البداية', formatDate(project.startDate));
  appendMeta(meta, 'تاريخ الانتهاء', formatDate(project.dueDate));
  card.appendChild(meta);

  const actions = makeElement('div', 'project-card-actions');
  const detailsButton = makeElement('button', '', 'التفاصيل');
  detailsButton.type = 'button';
  detailsButton.dataset.action = 'details';
  detailsButton.dataset.id = String(project.id);
  actions.appendChild(detailsButton);
  if (canManageProjects) {
    const editButton = makeElement('button', '', 'تعديل');
    editButton.type = 'button';
    editButton.dataset.action = 'edit';
    editButton.dataset.id = String(project.id);
    actions.appendChild(editButton);
  }
  if (canDeleteProjects) {
    const deleteButton = makeElement('button', 'delete-project', 'حذف');
    deleteButton.type = 'button';
    deleteButton.dataset.action = 'delete';
    deleteButton.dataset.id = String(project.id);
    actions.appendChild(deleteButton);
  }
  card.appendChild(actions);
  return card;
}

async function loadProjects() {
  projectList.replaceChildren(makeElement('div', 'projects-loading', 'جارٍ تحميل المشاريع…'));
  const formData = new FormData(filterForm);
  const params = new URLSearchParams();
  const q = String(formData.get('q') || '').trim();
  const status = String(formData.get('status') || 'all');
  if (q) params.set('q', q);
  if (status) params.set('status', status);
  try {
    const data = await window.TaskFlowAuth.request(`/api/projects${params.size ? `?${params}` : ''}`);
    projectList.replaceChildren();
    setStats(data.summary || { total: data.count || 0 });
    if (!Array.isArray(data.projects) || data.projects.length === 0) {
      projectsEmpty.hidden = false;
      emptyNewButton.hidden = !canManageProjects;
      return;
    }
    projectsEmpty.hidden = true;
    data.projects.forEach((project) => projectList.appendChild(renderProject(project)));
  } catch (error) {
    projectList.replaceChildren();
    window.TaskFlowAuth.showMessage(pageMessage, error.message);
    if (error.status === 401) window.location.replace('/login.html');
  }
}

function populateOwners(selectedId = '') {
  const ownerSelect = projectForm.elements.ownerId;
  const previous = selectedId === null ? '' : String(selectedId);
  ownerSelect.replaceChildren(new Option('لم يُحدد بعد', ''));
  availableUsers.forEach((user) => ownerSelect.add(new Option(`${user.fullName} (${user.username})`, String(user.id))));
  ownerSelect.value = previous;
}

function openCreateDialog() {
  projectForm.reset();
  projectForm.elements.projectId.value = '';
  projectForm.elements.status.value = 'planned';
  populateOwners('');
  document.querySelector('[data-project-dialog-title]').textContent = 'إنشاء مشروع جديد';
  document.querySelector('[data-save-project]').textContent = 'حفظ المشروع';
  formMessage.className = 'auth-message';
  projectDialog.showModal();
  projectForm.elements.name.focus();
}

function openEditDialog(project) {
  projectForm.reset();
  projectForm.elements.projectId.value = String(project.id);
  projectForm.elements.name.value = project.name || '';
  projectForm.elements.description.value = project.description || '';
  projectForm.elements.status.value = project.status || 'planned';
  projectForm.elements.startDate.value = project.startDate || '';
  projectForm.elements.dueDate.value = project.dueDate || '';
  populateOwners(project.ownerId || '');
  document.querySelector('[data-project-dialog-title]').textContent = 'تعديل المشروع';
  document.querySelector('[data-save-project]').textContent = 'حفظ التعديلات';
  formMessage.className = 'auth-message';
  projectDialog.showModal();
  projectForm.elements.name.focus();
}

function statusLabel(status) { return statusLabels[status] || status || 'غير محدد'; }

function showDetailTasks(tasks) {
  const holder = document.querySelector('[data-details-task-list]');
  holder.replaceChildren();
  if (!Array.isArray(tasks) || tasks.length === 0) {
    holder.appendChild(makeElement('p', 'directory-empty', 'لا توجد مهام مرتبطة بهذا المشروع حتى الآن.'));
    return;
  }
  const labels = { backlog: 'قائمة الانتظار', todo: 'جديدة', in_progress: 'قيد التنفيذ', blocked: 'متوقفة', completed: 'مكتملة', cancelled: 'ملغاة' };
  tasks.forEach((task) => {
    const row = makeElement('div', 'details-task-row');
    row.append(makeElement('span', '', task.title), makeElement('span', 'details-task-meta', `${labels[task.status] || task.status} · ${task.assigneeName || 'غير مسندة'}`));
    holder.appendChild(row);
  });
}

async function openDetails(id) {
  try {
    const data = await window.TaskFlowAuth.request(`/api/projects/${id}`);
    const project = data.project;
    currentProjectForDetails = project;
    document.querySelector('[data-details-code]').textContent = project.projectCode;
    document.querySelector('[data-details-name]').textContent = project.name;
    document.querySelector('[data-details-description]').textContent = project.description || 'لم تتم إضافة وصف لهذا المشروع.';
    document.querySelector('[data-details-status]').textContent = statusLabel(project.status);
    document.querySelector('[data-details-owner]').textContent = project.ownerName || 'لم يحدد';
    document.querySelector('[data-details-start]').textContent = formatDate(project.startDate);
    document.querySelector('[data-details-due]').textContent = formatDate(project.dueDate);
    document.querySelector('[data-details-progress]').textContent = `${project.progress || 0}%`;
    document.querySelector('[data-details-tasks]').textContent = `${project.completedTasks || 0} / ${project.taskCount || 0}`;
    document.querySelector('[data-edit-from-details]').hidden = !canManageProjects;
    showDetailTasks(data.tasks);
    detailsDialog.showModal();
  } catch (error) {
    window.TaskFlowAuth.showMessage(pageMessage, error.message);
  }
}

async function deleteProject(id) {
  if (!window.confirm('هل أنت متأكد من حذف هذا المشروع؟ سيؤدي الحذف إلى إزالة المهام المرتبطة به أيضاً.')) return;
  try {
    await window.TaskFlowAuth.request(`/api/projects/${id}`, { method: 'DELETE' });
    window.TaskFlowAuth.showMessage(pageMessage, 'تم حذف المشروع.', 'success');
    await loadProjects();
  } catch (error) {
    window.TaskFlowAuth.showMessage(pageMessage, error.message);
  }
}

async function handleProjectSave(event) {
  event.preventDefault();
  formMessage.className = 'auth-message';
  const form = projectForm.elements;
  const body = {
    name: form.name.value.trim(),
    description: form.description.value.trim(),
    status: form.status.value,
    ownerId: form.ownerId.value || null,
    startDate: form.startDate.value || null,
    dueDate: form.dueDate.value || null
  };
  const projectId = form.projectId.value;
  const button = document.querySelector('[data-save-project]');
  window.TaskFlowAuth.setBusy(button, true, 'جارٍ الحفظ…');
  try {
    const result = await window.TaskFlowAuth.request(projectId ? `/api/projects/${projectId}` : '/api/projects', {
      method: projectId ? 'PUT' : 'POST', body
    });
    projectDialog.close();
    window.TaskFlowAuth.showMessage(pageMessage, result.message || 'تم حفظ المشروع.', 'success');
    await loadProjects();
  } catch (error) {
    window.TaskFlowAuth.showMessage(formMessage, error.message);
  } finally {
    window.TaskFlowAuth.setBusy(button, false);
    button.textContent = projectId ? 'حفظ التعديلات' : 'حفظ المشروع';
  }
}

async function initializePage() {
  try {
    const session = await window.TaskFlowAuth.request('/api/auth/me');
    if (!session.authenticated || !session.user) {
      window.location.replace('/login.html');
      return;
    }
    currentUser = session.user;
    canManageProjects = Boolean(session.capabilities?.manageProjects);
    canDeleteProjects = currentUser.role === 'admin';
    document.querySelector('[data-current-user]').textContent = `${currentUser.fullName} · ${roleLabels[currentUser.role] || currentUser.role}`;
    newProjectButton.hidden = !canManageProjects;
    if (canManageProjects) {
      try {
        const data = await window.TaskFlowAuth.request('/api/projects/users');
        availableUsers = data.users || [];
      } catch (error) {
        window.TaskFlowAuth.showMessage(pageMessage, error.message);
      }
    }
    populateOwners('');
    await loadProjects();
  } catch (error) {
    window.TaskFlowAuth.showMessage(pageMessage, error.message);
    window.location.replace('/login.html');
  }
}

newProjectButton.addEventListener('click', openCreateDialog);
emptyNewButton.addEventListener('click', openCreateDialog);
projectForm.addEventListener('submit', handleProjectSave);
filterForm.addEventListener('submit', (event) => { event.preventDefault(); loadProjects(); });
filterForm.addEventListener('reset', () => window.setTimeout(loadProjects, 0));
projectList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = Number(button.dataset.id);
  if (button.dataset.action === 'details') openDetails(id);
  if (button.dataset.action === 'edit') {
    window.TaskFlowAuth.request(`/api/projects/${id}`).then((data) => openEditDialog(data.project)).catch((error) => window.TaskFlowAuth.showMessage(pageMessage, error.message));
  }
  if (button.dataset.action === 'delete') deleteProject(id);
});
document.querySelectorAll('[data-close-project]').forEach((button) => button.addEventListener('click', () => projectDialog.close()));
document.querySelectorAll('[data-close-details]').forEach((button) => button.addEventListener('click', () => detailsDialog.close()));
document.querySelector('[data-edit-from-details]').addEventListener('click', () => {
  detailsDialog.close();
  if (currentProjectForDetails) openEditDialog(currentProjectForDetails);
});
projectDialog.addEventListener('click', (event) => { if (event.target === projectDialog) projectDialog.close(); });
detailsDialog.addEventListener('click', (event) => { if (event.target === detailsDialog) detailsDialog.close(); });

if (logoutButton) logoutButton.addEventListener('click', async () => {
  logoutButton.disabled = true;
  try {
    await window.TaskFlowAuth.request('/api/auth/logout', { method: 'POST', body: {} });
    window.location.replace('/login.html');
  } catch (error) {
    logoutButton.disabled = false;
    window.TaskFlowAuth.showMessage(pageMessage, error.message);
  }
});

initializePage();


document.addEventListener('taskflow:languagechange', () => {
  if (document.querySelector('[data-project-list]')) loadProjects();
});
