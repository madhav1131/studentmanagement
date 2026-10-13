import { useEffect, useMemo, useState } from 'react'
import './App.css'

const emptyForm = { name: '', rollNumber: '', branch: '', email: '', phone: '' }

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-5 5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z" transform="translate(-1 -1)" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6" /><path d="M10 11v5m4-5v5" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
  }

  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?'
}

const API_URL = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}/api/students${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {
      // Keep the HTTP status message when the response is not JSON.
    }

    throw new Error(message);
  }

  return response.status === 204 ? null : response.json();
}

function App() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('All departments')
  const [sortOrder, setSortOrder] = useState('asc')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadStudents() {
    setLoading(true)
    setLoadError('')
    try {
      setStudents(await request(''))
    } catch (error) {
      setLoadError(error.message || 'Unable to connect to the student service.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStudents() }, [])

  const branches = useMemo(() => ['All departments', ...new Set(students.map((student) => student.branch).filter(Boolean).sort())], [students])
  const visibleStudents = useMemo(() => students
    .filter((student) => branchFilter === 'All departments' || student.branch === branchFilter)
    .filter((student) => `${student.name} ${student.rollNumber} ${student.branch} ${student.email}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)), [students, branchFilter, search, sortOrder])
  const newThisMonth = students.filter((student) => student.createdAt && new Date(student.createdAt).getMonth() === new Date().getMonth() && new Date(student.createdAt).getFullYear() === new Date().getFullYear()).length
  const openCreate = () => {
    setEditingStudent(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }
  const openEdit = (student) => {
    setEditingStudent(student)
    setForm({ name: student.name || '', rollNumber: student.rollNumber || '', branch: student.branch || '', email: student.email || '', phone: student.phone || '' })
    setFormError('')
    setModalOpen(true)
  }
  const saveStudent = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const saved = await request(editingStudent ? `/${editingStudent.id}` : '', {
        method: editingStudent ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      })
      setStudents((current) => editingStudent
        ? current.map((student) => student.id === saved.id ? saved : student)
        : [saved, ...current])
      setModalOpen(false)
      setNotice(editingStudent ? 'Student details updated.' : 'Student added to the directory.')
      window.setTimeout(() => setNotice(''), 3200)
    } catch (error) {
      setFormError(error.message || 'Could not save student details.')
    } finally {
      setSaving(false)
    }
  }
  const deleteStudent = async (student) => {
    if (!window.confirm(`Remove ${student.name} from the student directory?`)) return
    try {
      await request(`/${student.id}`, { method: 'DELETE' })
      setStudents((current) => current.filter((item) => item.id !== student.id))
      setNotice('Student removed from the directory.')
      window.setTimeout(() => setNotice(''), 3200)
    } catch (error) {
      setNotice(error.message || 'Could not remove this student.')
      window.setTimeout(() => setNotice(''), 4000)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Campus home"><span className="brand-mark"><Icon name="book" size={21} /></span><span>Northstar<span className="brand-sub">CAMPUS PORTAL</span></span></a>
        <div className="nav-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#overview"><Icon name="grid" />Overview</a>
          <a href="#students" className="active"><Icon name="users" />Students<span className="nav-count">{students.length}</span></a>
          <a href="#students"><Icon name="chart" />Reports</a>
        </nav>
        <div className="sidebar-bottom"><div className="help-block"><span className="help-icon">?</span><div><strong>Need a hand?</strong><span>Contact campus support</span></div><Icon name="chevron" size={16} /></div><div className="profile"><div className="profile-avatar">AD</div><div className="profile-copy"><strong>Admin Desk</strong><span>Administrator</span></div><button className="icon-button profile-more" aria-label="Profile options"><Icon name="more" /></button></div></div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar"><div className="breadcrumb">Workspace <Icon name="chevron" size={14} /> <span>Students</span></div><div className="topbar-actions"><span className="term-tag"><span className="live-dot" />2025 / 2026 <span className="term-label">Academic year</span></span><div className="top-avatar">AD</div></div></header>
        <div className="page-content" id="students">
          <section className="page-heading"><div><div className="eyebrow">PEOPLE DIRECTORY <span> / </span> 01</div><h1>Students</h1><p className="page-subtitle">A clear view of every learner in your campus community.</p></div><button className="primary-button" onClick={openCreate}><Icon name="plus" size={17} />Add student</button></section>

          <section className="stats-grid" aria-label="Student statistics">
            <article className="stat-card stat-total"><div className="stat-top"><span className="stat-label">TOTAL STUDENTS</span><span className="stat-icon green-icon"><Icon name="users" /></span></div><div className="stat-value">{loading ? '—' : students.length.toLocaleString()}</div><div className="stat-foot"><span className="stat-indicator">●</span> Enrolled across all departments</div><span className="stat-watermark">01</span></article>
            <article className="stat-card stat-programs"><div className="stat-top"><span className="stat-label">DEPARTMENTS</span><span className="stat-icon amber-icon"><Icon name="book" /></span></div><div className="stat-value">{loading ? '—' : branches.length - 1}</div><div className="stat-foot">Distinct academic programs</div><span className="stat-watermark">02</span></article>
            <article className="stat-card stat-new"><div className="stat-top"><span className="stat-label">JOINED THIS MONTH</span><span className="stat-icon coral-icon"><Icon name="arrow" /></span></div><div className="stat-value">{loading ? '—' : newThisMonth}</div><div className="stat-foot">New additions this month</div><span className="stat-watermark">03</span></article>
          </section>

          <section className="directory-panel">
            <div className="directory-heading"><div><h2>Student directory</h2><p>Browse, search, and manage student records.</p></div><span className="record-count">{visibleStudents.length} RECORDS</span></div>
            <div className="table-toolbar"><label className="search-box"><Icon name="search" size={18} /><input aria-label="Search students" placeholder="Search by name, ID, or email..." value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>/</kbd></label><div className="toolbar-controls"><label className="select-wrap"><span className="sr-only">Filter by department</span><select value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}>{branches.map((branch) => <option key={branch}>{branch}</option>)}</select></label><button className="sort-button" onClick={() => setSortOrder((order) => order === 'asc' ? 'desc' : 'asc')} title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}><span className="sort-glyph">{sortOrder === 'asc' ? 'A↓' : 'Z↑'}</span><span className="sort-text">Sort</span></button></div></div>
            {loadError && <div className="connection-error" role="alert"><span className="error-mark">!</span><div><strong>Could not load students</strong><span>{loadError}. Check that the backend and database are running.</span></div><button onClick={loadStudents}>Try again</button></div>}
            <div className="table-scroll"><table><thead><tr><th>STUDENT</th><th>STUDENT ID</th><th>DEPARTMENT</th><th>CONTACT</th><th className="actions-heading">ACTIONS</th></tr></thead><tbody>
              {loading ? <tr><td colSpan="5" className="table-message"><span className="spinner" />Loading student records...</td></tr> : visibleStudents.length === 0 ? <tr><td colSpan="5" className="table-message"><span className="empty-mark"><Icon name="users" size={21} /></span><strong>{students.length ? 'No matching students' : 'Your directory is ready'}</strong><span>{students.length ? 'Try adjusting your search or department filter.' : 'Add the first student to start building your campus directory.'}</span>{!students.length && !loadError && <button className="text-action" onClick={openCreate}><Icon name="plus" size={16} />Add a student</button>}</td></tr> : visibleStudents.map((student, index) => <tr key={student.id}><td><div className="student-cell"><div className={`student-avatar avatar-${index % 5}`}>{initials(student.name)}</div><div className="student-name"><strong>{student.name}</strong><span>{student.email}</span></div></div></td><td><span className="roll-number">{student.rollNumber}</span></td><td><span className="department-pill"><span />{student.branch}</span></td><td><span className="contact-value">{student.phone || '—'}</span></td><td><div className="row-actions"><button className="icon-button" aria-label={`Edit ${student.name}`} title="Edit student" onClick={() => openEdit(student)}><Icon name="edit" size={16} /></button><button className="icon-button delete-action" aria-label={`Delete ${student.name}`} title="Delete student" onClick={() => deleteStudent(student)}><Icon name="trash" size={16} /></button></div></td></tr>)}
            </tbody></table></div>
            <div className="directory-footer"><span>Showing <strong>{visibleStudents.length}</strong> of <strong>{students.length}</strong> students</span><span className="footer-status"><span className={`status-dot ${loadError ? 'status-offline' : ''}`} />{loadError ? 'Service unavailable' : 'Directory synced'}</span></div>
          </section>
          <footer className="page-footer"><span>Northstar Campus Portal <span>·</span> Student records</span><span>Academic year 2025 / 2026</span></footer>
        </div>
      </main>

      {notice && <div className="toast" role="status"><span className="toast-check">✓</span>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification"><Icon name="close" size={15} /></button></div>}
      {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false) }}><section className="student-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header className="modal-header"><div><div className="eyebrow">STUDENT RECORD</div><h2 id="modal-title">{editingStudent ? 'Edit student' : 'Add a student'}</h2></div><button className="icon-button" onClick={() => setModalOpen(false)} aria-label="Close dialog"><Icon name="close" /></button></header><form onSubmit={saveStudent}><div className="form-grid"><label className="form-field form-wide"><span>Full name <i>*</i></span><input required maxLength="100" autoFocus placeholder="e.g. Maya Chen" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="form-field"><span>Student ID <i>*</i></span><input required maxLength="50" placeholder="e.g. NS-2026-0142" value={form.rollNumber} onChange={(event) => setForm({ ...form, rollNumber: event.target.value })} /></label><label className="form-field"><span>Department <i>*</i></span><input required maxLength="80" placeholder="e.g. Computer Science" value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })} /></label><label className="form-field form-wide"><span>Email address <i>*</i></span><input required type="email" maxLength="150" placeholder="student@northstar.edu" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label className="form-field form-wide"><span>Phone number <small>OPTIONAL</small></span><input maxLength="20" type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label></div>{formError && <div className="form-error" role="alert">{formError}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving...' : editingStudent ? 'Save changes' : <><Icon name="plus" size={16} />Create student</>}</button></div></form></section></div>}
    </div>
  )
}

export default App
