import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { COURSE_CONFIG } from './courseConfig';
import { Search, Loader2, Download, Lock, RefreshCw, Code2 } from 'lucide-react';

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [filterGroup, setFilterGroup] = useState('');
  const [filterAssignment, setFilterAssignment] = useState('');
  const [searchName, setSearchName] = useState('');

  // كلمة مرور المعلم
  const ADMIN_PASSWORD = '778836';

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert('كلمة المرور خاطئة');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: assignments, error } = await supabase
        .from(COURSE_CONFIG.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedData = (assignments || []).map(item => ({
        timestamp: new Date(item.created_at).toLocaleString('ar-EG'),
        studentName: item.student_name,
        studentId: item.student_id,
        groupName: item.group_name,
        assignmentName: item.assignment_name,
        fileName: item.file_name,
        fileUrl: item.file_url
      }));

      setData(formattedData);
    } catch (error) {
      console.error(error);
      alert(`حدث خطأ في جلب البيانات من جدول (${COURSE_CONFIG.tableName}): ` + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ maxWidth: '420px', marginTop: '100px' }}>
        <div className="glass-card">
          <div className="header">
            <div className="course-badge">
              <Code2 size={18} />
              <span>C++ Dashboard</span>
            </div>
            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--primary-color)' }}>
              <Lock size={22} /> لوحة تحكم المعلم
            </h2>
            <p>يرجى إدخال كلمة المرور للاطلاع على تكاليف C++</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input
                type="password"
                className="form-input"
                placeholder="أدخل كلمة المرور..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <button className="submit-btn" type="submit">تسجيل الدخول</button>
          </form>
        </div>
      </div>
    );
  }

  const filteredData = data.filter(item => {
    const matchGroup = filterGroup ? item.groupName === filterGroup : true;
    const matchAssignment = filterAssignment ? item.assignmentName === filterAssignment : true;
    const matchName = searchName ? (item.studentName.includes(searchName) || item.studentId.includes(searchName)) : true;
    return matchGroup && matchAssignment && matchName;
  });

  return (
    <div className="container dashboard-container" style={{ marginTop: '60px' }}>
      <div className="glass-card" style={{ padding: '30px' }}>
        <div className="dashboard-header">
          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
              إدارة تكاليف برمجة C++ ({filteredData.length})
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              جدول قاعدة البيانات: <code style={{ direction: 'ltr', display: 'inline-block' }}>{COURSE_CONFIG.tableName}</code>
            </p>
          </div>
          <button onClick={fetchData} className="refresh-btn" title="تحديث البيانات">
            <RefreshCw size={16} className={isLoading ? 'loader' : ''} /> تحديث البيانات
          </button>
        </div>

        <div className="filters-row">
          <div style={{ flex: 1.5, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', right: '12px', top: '14px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingRight: '38px' }}
              placeholder="ابحث باسم الطالب أو رقمه الأكاديمي..."
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <select
              className="form-select"
              value={filterGroup}
              onChange={e => setFilterGroup(e.target.value)}
            >
              <option value="">كل المجموعات ({COURSE_CONFIG.groups.length})</option>
              {COURSE_CONFIG.groups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <select
              className="form-select"
              value={filterAssignment}
              onChange={e => setFilterAssignment(e.target.value)}
            >
              <option value="">كل التكاليف ({COURSE_CONFIG.assignmentsCount})</option>
              {Array.from({ length: COURSE_CONFIG.assignmentsCount }, (_, i) => i + 1).map(num => (
                <option key={num} value={`التكليف ${num}`}>التكليف {num}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <Loader2 className="loader" size={40} />
            <p>جاري تحميل البيانات من Supabase ({COURSE_CONFIG.tableName})...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>الوقت</th>
                  <th>اسم الطالب</th>
                  <th>الرقم الأكاديمي</th>
                  <th>المجموعة</th>
                  <th>التكليف</th>
                  <th>الملف</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>لا توجد بيانات مطابقة للبحث</td></tr>
                ) : (
                  filteredData.map((row, i) => (
                    <tr key={i}>
                      <td dir="ltr" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{row.timestamp}</td>
                      <td style={{ fontWeight: '600' }}>{row.studentName}</td>
                      <td>{row.studentId}</td>
                      <td><span className="badge">{row.groupName}</span></td>
                      <td><span className="assignment-tag">{row.assignmentName}</span></td>
                      <td>
                        <a href={row.fileUrl} target="_blank" rel="noopener noreferrer" className="download-btn">
                          <Download size={15} /> عرض / تحميل
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
