import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, File, Loader2, Code2 } from 'lucide-react';
import { supabase, supabaseUrl, supabaseAnonKey } from './supabaseClient';
import { COURSE_CONFIG } from './courseConfig';

export default function UploadPage() {
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    groupName: '',
    assignmentName: ''
  });
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null
  const [statusMessage, setStatusMessage] = useState('');
  
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;
    const fileExt = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!COURSE_CONFIG.allowedExtensions.includes(fileExt)) {
      setUploadStatus('error');
      setStatusMessage(`صيغة الملف غير مدعومة (${fileExt}). الصيغ المسموحة هي: ${COURSE_CONFIG.allowedExtensions.join('، ')}`);
      setFile(null);
      return;
    }
    setUploadStatus(null);
    setStatusMessage('');
    setFile(selectedFile);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const onFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setUploadStatus('error');
      setStatusMessage('الرجاء إرفاق ملف التكليف');
      return;
    }

    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!COURSE_CONFIG.allowedExtensions.includes(fileExt)) {
      setUploadStatus('error');
      setStatusMessage(`صيغة الملف غير مدعومة. الصيغ المسموحة: ${COURSE_CONFIG.allowedExtensions.join('، ')}`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus(null);
    setStatusMessage('');

    try {
      const rawExt = file.name.split('.').pop();
      const randomName = `${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${rawExt}`;
      const safeStudentId = formData.studentId.replace(/[^0-9a-zA-Z]/g, "");
      // مسار منظم لمادة C++
      const filePath = `${COURSE_CONFIG.storageFolder}/${safeStudentId}/assignment_${randomName}`;

      // استخدام XMLHttpRequest للحصول على نسبة تقدم الرفع الحقيقية
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${COURSE_CONFIG.storageBucket}/${filePath}`;
      
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`);
        xhr.setRequestHeader('apikey', supabaseAnonKey);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            let errorMsg = 'فشل الرفع';
            try {
              const err = JSON.parse(xhr.responseText);
              errorMsg = err.message || errorMsg;
            } catch {
              // ignore json parse error
            }
            reject(new Error(errorMsg));
          }
        };

        xhr.onerror = () => reject(new Error('فشل الاتصال بالخادم. تأكد من اتصالك بالإنترنت.'));
        xhr.send(file);
      });

      // 2. الحصول على رابط الملف العام
      const { data: publicUrlData } = supabase.storage
        .from(COURSE_CONFIG.storageBucket)
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData.publicUrl;

      // 3. حفظ البيانات في جدول C++ في Supabase
      const { error: dbError } = await supabase
        .from(COURSE_CONFIG.tableName)
        .insert([
          {
            student_name: formData.studentName,
            student_id: formData.studentId,
            group_name: formData.groupName,
            assignment_name: formData.assignmentName,
            file_name: file.name,
            file_url: fileUrl
          }
        ]);

      if (dbError) {
        throw new Error('فشل حفظ البيانات في قاعدة البيانات: ' + dbError.message);
      }

      setUploadStatus('success');
      setStatusMessage('تم رفع التكليف بنجاح وبسرعة فائقة!');
      setFormData({ studentName: '', studentId: '', groupName: '', assignmentName: '' });
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      setUploadProgress(0);
      console.error(error);
      setUploadStatus('error');
      setStatusMessage(error.message || 'حدث خطأ غير متوقع أثناء الرفع.');
    } finally {
      setTimeout(() => setIsUploading(false), 500);
    }
  };

  return (
    <div className="container" style={{marginTop: '60px'}}>
      <div className="glass-card">
        <div className="header">
          <div className="course-badge">
            <Code2 size={18} />
            <span>C++ Programming</span>
          </div>
          <h1>{COURSE_CONFIG.courseName}</h1>
          <p>{COURSE_CONFIG.courseSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">اسم الطالب (الرباعي)</label>
            <input 
              type="text" 
              name="studentName"
              className="form-input" 
              placeholder="أدخل اسمك الكامل..."
              value={formData.studentName}
              onChange={handleInputChange}
              required 
            />
          </div>

          <div className="form-grid">
            <div style={{flex: 1}}>
              <label className="form-label">الرقم الأكاديمي</label>
              <input 
                type="text" 
                name="studentId"
                className="form-input" 
                placeholder="مثال: 20211010"
                value={formData.studentId}
                onChange={handleInputChange}
                required 
              />
            </div>
            
            <div style={{flex: 1}}>
              <label className="form-label">المجموعة (الشعبة)</label>
              <select 
                name="groupName"
                className="form-select"
                value={formData.groupName}
                onChange={handleInputChange}
                required
              >
                <option value="" disabled>-- اختر مجموعتك --</option>
                {COURSE_CONFIG.groups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">اختر التكليف</label>
            <select 
              name="assignmentName"
              className="form-select"
              value={formData.assignmentName}
              onChange={handleInputChange}
              required
            >
              <option value="" disabled>-- الرجاء اختيار التكليف --</option>
              {Array.from({ length: COURSE_CONFIG.assignmentsCount }, (_, i) => i + 1).map(num => (
                <option key={num} value={`التكليف ${num}`}>التكليف {num}</option>
              ))}
            </select>
          </div>

          <div className="guidelines-card">
            <div className="guidelines-header">
              <AlertCircle size={20} />
              <span>تنبيهات هامة قبل الرفع (C++):</span>
            </div>
            <ul className="guidelines-list">
              <li>يمكنك رفع ملف الكود مباشرة بصيغة <code>.cpp</code> أو ملفات الترويسة <code>.h</code> / <code>.hpp</code>.</li>
              <li>في حال كان المشروع يحتوي على عدة ملفات، يرجى <strong>ضغطها في ملف ZIP</strong>.</li>
              <li>تأكد من خلو الكود من أخطاء الـ Compilation وعمله بالشكل الصحيح قبل الرفع.</li>
              <li><strong>تنبيه:</strong> لا ترفع ملفات الـ <code>.exe</code> أو مجلدات البناء لتجنب زيادة الحجم غير الضرورية.</li>
            </ul>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            accept={COURSE_CONFIG.allowedExtensions.join(',')}
            style={{ display: 'none' }} 
            onChange={onFileSelect}
          />
          <div 
            className={`file-drop-zone ${isDragging ? 'drag-active' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <>
                <File className="file-icon" />
                <p style={{ color: 'var(--text-primary)', fontWeight: '600' }}>تم اختيار الملف:</p>
                <p className="file-name">{file.name}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </>
            ) : (
              <>
                <UploadCloud className="file-icon" />
                <p style={{ color: 'var(--text-primary)', marginBottom: '8px', fontWeight: '600' }}>
                  اضغط لاختيار ملف، أو اسحب الملف وأفلته هنا
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  الصيغ المدعومة: {COURSE_CONFIG.allowedExtensions.join('، ')}
                </p>
              </>
            )}
          </div>

          {isUploading && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--primary-color)' }}>
                <span>جاري الرفع...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: 'var(--progress-track)', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, backgroundColor: 'var(--primary-color)', height: '100%', transition: 'width 0.3s ease' }}></div>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="loader" /> جاري الرفع...
              </>
            ) : (
              <>
                إرسال التكليف <UploadCloud size={20} />
              </>
            )}
          </button>

          {uploadStatus && (
            <div className={`status-msg ${uploadStatus === 'success' ? 'status-success' : 'status-error'}`}>
              {uploadStatus === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              {statusMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
