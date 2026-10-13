const studentForm = document.getElementById('studentForm');
const studentTableBody = document.getElementById('studentTableBody');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const searchInput = document.getElementById('searchInput');
const branchFilter = document.getElementById('branchFilter');
const sortBySelect = document.getElementById('sortBy');
const sortDirectionSelect = document.getElementById('sortDirection');
const totalStudentsEl = document.getElementById('totalStudents');
const totalBranchesEl = document.getElementById('totalBranches');
const searchCountEl = document.getElementById('searchCount');
const loadingIndicator = document.getElementById('loadingIndicator');
const emptyState = document.getElementById('emptyState');
const toast = document.getElementById('toast');
const newStudentBtn = document.getElementById('newStudentBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');

const state = {
  students: [],
  editingId: null,
  searchValue: '',
  branchValue: 'all',
  sortBy: 'id',
  direction: 'asc'
};

const apiBaseUrl = '/api/students';

function showLoading(show) {
  loadingIndicator.hidden = !show;
}

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast show ${type}`;

  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

function safeTrim(value) {
  return value == null ? '' : String(value).trim();
}

function getStudentPayload() {
  return {
    name: safeTrim(document.getElementById('name').value),
    rollNumber: safeTrim(document.getElementById('rollNumber').value),
    branch: safeTrim(document.getElementById('branch').value),
    email: safeTrim(document.getElementById('email').value),
    phone: safeTrim(document.getElementById('phone').value)
  };
}

function resetForm() {
  studentForm.reset();
  state.editingId = null;
  formTitle.textContent = 'Add Student';
  submitBtn.textContent = 'Save Student';
  cancelEditBtn.hidden = true;
}

function fillForm(student) {
  document.getElementById('name').value = student.name || '';
  document.getElementById('rollNumber').value = student.rollNumber || '';
  document.getElementById('branch').value = student.branch || '';
  document.getElementById('email').value = student.email || '';
  document.getElementById('phone').value = student.phone || '';

  state.editingId = student.id;
  formTitle.textContent = 'Edit Student';
  submitBtn.textContent = 'Update Student';
  cancelEditBtn.hidden = false;
}

function buildRow(student) {
  const row = document.createElement('tr');

  const fields = [
    String(student.id ?? ''),
    student.name ?? '',
    student.rollNumber ?? '',
    student.branch ?? '',
    student.email ?? '',
    student.phone ?? '',
    student.createdAt ? new Date(student.createdAt).toLocaleString() : '',
    student.updatedAt ? new Date(student.updatedAt).toLocaleString() : ''
  ];

  fields.forEach((value) => {
    const cell = document.createElement('td');
    cell.textContent = value;
    row.appendChild(cell);
  });

  const actionCell = document.createElement('td');
  const actionGroup = document.createElement('div');
  actionGroup.className = 'action-group';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'edit-btn';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => fillForm(student));

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => deleteStudent(student.id));

  actionGroup.appendChild(editBtn);
  actionGroup.appendChild(deleteBtn);
  actionCell.appendChild(actionGroup);
  row.appendChild(actionCell);

  return row;
}

function renderSummary() {
  const totalStudents = state.students.length;
  const uniqueBranches = new Set(state.students.map((student) => student.branch).filter(Boolean));

  totalStudentsEl.textContent = String(totalStudents);
  totalBranchesEl.textContent = String(uniqueBranches.size);
  searchCountEl.textContent = String(totalStudents);
}

function updateBranchFilterOptions() {
  const branches = [...new Set(state.students.map((student) => student.branch).filter(Boolean))].sort();
  const currentValue = branchFilter.value || 'all';
  const previousSelected = currentValue;

  branchFilter.innerHTML = '<option value="all">All branches</option>';

  branches.forEach((branch) => {
    const option = document.createElement('option');
    option.value = branch;
    option.textContent = branch;
    branchFilter.appendChild(option);
  });

  if (branches.includes(previousSelected)) {
    branchFilter.value = previousSelected;
  } else {
    branchFilter.value = 'all';
  }
}

function renderTable() {
  const rows = [...state.students];
  const branchFilterValue = branchFilter.value;

  const filteredStudents = rows.filter((student) => {
    const matchesSearch = !state.searchValue ||
      [student.name, student.rollNumber, student.email].some((value) =>
        String(value || '').toLowerCase().includes(state.searchValue.toLowerCase())
      );

    const matchesBranch = branchFilterValue === 'all' || student.branch === branchFilterValue;
    return matchesSearch && matchesBranch;
  });

  studentTableBody.innerHTML = '';

  if (filteredStudents.length === 0) {
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
    filteredStudents.forEach((student) => {
      studentTableBody.appendChild(buildRow(student));
    });
  }

  renderSummary();
  searchCountEl.textContent = String(filteredStudents.length);
}

async function fetchStudents() {
  showLoading(true);

  try {
    const queryParams = new URLSearchParams({
      sortBy: state.sortBy,
      direction: state.direction
    });

    const response = await fetch(`${apiBaseUrl}?${queryParams.toString()}`);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || 'Unable to load students.');
    }

    const students = await response.json();
    state.students = Array.isArray(students) ? students : [];
    updateBranchFilterOptions();
    renderTable();
  } catch (error) {
    showToast(error.message || 'Failed to load students.', 'error');
    emptyState.hidden = false;
    emptyState.textContent = 'Unable to load students. Please refresh or check the backend connection.';
    studentTableBody.innerHTML = '';
  } finally {
    showLoading(false);
  }
}

async function submitStudent(event) {
  event.preventDefault();

  const payload = getStudentPayload();

  if (!payload.name || !payload.rollNumber || !payload.branch || !payload.email) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  const isUpdate = Boolean(state.editingId);
  const url = isUpdate ? `${apiBaseUrl}/${state.editingId}` : apiBaseUrl;
  const method = isUpdate ? 'PUT' : 'POST';

  submitBtn.disabled = true;
  submitBtn.textContent = isUpdate ? 'Updating...' : 'Saving...';

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      const message = responseData?.message || 'Request failed.';
      throw new Error(message);
    }

    showToast(isUpdate ? 'Student updated successfully.' : 'Student created successfully.', 'success');
    resetForm();
    await fetchStudents();
  } catch (error) {
    showToast(error.message || 'Failed to save student.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = state.editingId ? 'Update Student' : 'Save Student';
  }
}

async function deleteStudent(studentId) {
  const confirmed = window.confirm('Are you sure you want to delete this student?');
  if (!confirmed) return;

  try {
    const response = await fetch(`${apiBaseUrl}/${studentId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || 'Delete request failed.');
    }

    showToast('Student deleted successfully.', 'success');
    await fetchStudents();
    if (state.editingId === studentId) {
      resetForm();
    }
  } catch (error) {
    showToast(error.message || 'Failed to delete student.', 'error');
  }
}

searchInput.addEventListener('input', (event) => {
  state.searchValue = event.target.value;
  renderTable();
});

branchFilter.addEventListener('change', (event) => {
  state.branchValue = event.target.value;
  renderTable();
});

sortBySelect.addEventListener('change', (event) => {
  state.sortBy = event.target.value;
  fetchStudents();
});

sortDirectionSelect.addEventListener('change', (event) => {
  state.direction = event.target.value;
  fetchStudents();
});

exportCsvBtn.addEventListener('click', () => {
  const rows = [...state.students].filter((student) => {
    const matchesSearch = !state.searchValue ||
      [student.name, student.rollNumber, student.email].some((value) =>
        String(value || '').toLowerCase().includes(state.searchValue.toLowerCase())
      );

    const matchesBranch = state.branchValue === 'all' || student.branch === state.branchValue;
    return matchesSearch && matchesBranch;
  });

  if (rows.length === 0) {
    showToast('No records available to export.', 'error');
    return;
  }

  const headers = ['id', 'name', 'rollNumber', 'branch', 'email', 'phone', 'createdAt', 'updatedAt'];
  const csvLines = [
    headers.join(','),
    ...rows.map((student) => headers.map((header) => {
      const value = student[header] == null ? '' : String(student[header]);
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(','))
  ];

  const csvData = csvLines.join('\n');
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = 'students.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('Student CSV exported successfully.', 'success');
});

studentForm.addEventListener('submit', submitStudent);
newStudentBtn.addEventListener('click', () => {
  resetForm();
  document.getElementById('name').focus();
});
cancelEditBtn.addEventListener('click', resetForm);

window.addEventListener('DOMContentLoaded', async () => {
  emptyState.textContent = 'No student records found.';
  sortBySelect.value = state.sortBy;
  sortDirectionSelect.value = state.direction;
  await fetchStudents();
});
