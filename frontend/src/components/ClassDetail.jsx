// src/components/ClassDetail.jsx
import { useState, useEffect } from 'react';
import { getClassSessions } from '../services/academicService';
import { getSessionAssignments, createSessionAssignment, getSubmissions, submitAssignment } from '../services/learningService';
import './ClassDetail.css';

const ClassDetail = ({ classInfo, onBack }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    due_date: '',
    max_score: 100
  });
  const [submitForm, setSubmitForm] = useState({
    submission_text: '',
    submission_url: ''
  });

  useEffect(() => {
    fetchSessions();
  }, [classInfo]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      // Get all sessions for this class
      const allSessions = await getClassSessions({ class_id: classInfo.classId });
      
      // Sort by date
      allSessions.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
      
      setSessions(allSessions);

      // Fetch assignments for each session
      const assignmentsMap = {};
      const submissionsMap = {};
      
      await Promise.all(allSessions.map(async (session) => {
        try {
          const sessionAssignments = await getSessionAssignments({ session_id: session.id });
          assignmentsMap[session.id] = sessionAssignments;

          // Fetch submissions for each assignment
          for (const assignment of sessionAssignments) {
            const assignmentSubmissions = await getSubmissions({ assignment_id: assignment.id });
            submissionsMap[assignment.id] = assignmentSubmissions;
          }
        } catch (err) {
          console.error('Error fetching assignments for session:', err);
        }
      }));

      setAssignments(assignmentsMap);
      setSubmissions(submissionsMap);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      alert('Không thể tải danh sách buổi học');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedSession) return;
    
    try {
      await createSessionAssignment({
        session_id: selectedSession.id,
        ...assignmentForm
      });
      
      alert('✅ Đã tạo bài tập thành công!');
      setShowAssignmentForm(false);
      setAssignmentForm({ title: '', description: '', due_date: '', max_score: 100 });
      fetchSessions(); // Refresh
    } catch (err) {
      console.error('Error creating assignment:', err);
      alert('❌ Không thể tạo bài tập: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleSubmitAssignment = async (assignmentId) => {
    try {
      const currentUserId = JSON.parse(localStorage.getItem('user'))?.sub;
      
      await submitAssignment({
        assignment_id: assignmentId,
        student_id: currentUserId,
        ...submitForm
      });
      
      alert('✅ Đã nộp bài thành công!');
      setShowSubmitForm(false);
      setSubmitForm({ submission_text: '', submission_url: '' });
      fetchSessions(); // Refresh
    } catch (err) {
      console.error('Error submitting assignment:', err);
      alert('❌ Không thể nộp bài: ' + (err.response?.data?.detail || err.message));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getSessionNumber = (index) => {
    return `Buổi ${index + 1}`;
  };

  return (
    <div className="class-detail">
      <div className="class-detail-header">
        <button className="btn btn-ghost" onClick={onBack} style={{ marginRight: '10px' }}>
          ← Quay lại
        </button>
        <div>
          <h2>{classInfo.name}</h2>
          <p className="uid">Lớp: {classInfo.className} • Học viên: {classInfo.studentName}</p>
        </div>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="sessions-list">
          <h3 style={{ marginBottom: '15px' }}>Danh sách buổi học ({sessions.length} buổi)</h3>
          
          {sessions.length === 0 ? (
            <p className="uid">Chưa có buổi học nào.</p>
          ) : (
            <div className="sessions-grid">
              {sessions.map((session, index) => {
                const sessionAssignments = assignments[session.id] || [];
                
                return (
                  <div key={session.id} className="session-card">
                    <div className="session-header">
                      <h4>{getSessionNumber(index)}</h4>
                      <span className={`session-status status-${session.status}`}>
                        {session.status === 'scheduled' ? 'Sắp diễn ra' : 
                         session.status === 'completed' ? 'Đã hoàn thành' : 'Đã hủy'}
                      </span>
                    </div>
                    
                    <div className="session-info">
                      <p><strong>📅 Ngày:</strong> {formatDate(session.start_time)}</p>
                      <p><strong>🕐 Giờ:</strong> {formatTime(session.start_time)} - {formatTime(session.end_time)}</p>
                    </div>

                    <div className="session-assignments">
                      <h5>📝 Bài tập ({sessionAssignments.length})</h5>
                      
                      {sessionAssignments.length === 0 ? (
                        <p className="uid" style={{ fontSize: '13px' }}>Chưa có bài tập</p>
                      ) : (
                        <div className="assignments-list">
                          {sessionAssignments.map(assignment => {
                            const assignmentSubmissions = submissions[assignment.id] || [];
                            const hasSubmitted = assignmentSubmissions.length > 0;
                            
                            return (
                              <div key={assignment.id} className="assignment-item">
                                <div>
                                  <strong>{assignment.title}</strong>
                                  {assignment.due_date && (
                                    <p className="uid" style={{ fontSize: '12px' }}>
                                      Hạn: {formatDate(assignment.due_date)}
                                    </p>
                                  )}
                                </div>
                                {!hasSubmitted ? (
                                  <button 
                                    className="btn btn-sm btn-primary"
                                    onClick={() => {
                                      setSelectedSession(session);
                                      setShowSubmitForm(assignment.id);
                                    }}
                                  >
                                    Nộp bài
                                  </button>
                                ) : (
                                  <span className="tag" style={{ background: '#10b981', color: '#fff', fontSize: '12px' }}>
                                    ✓ Đã nộp
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      <button 
                        className="btn btn-ghost btn-sm"
                        style={{ marginTop: '10px', fontSize: '13px' }}
                        onClick={() => {
                          setSelectedSession(session);
                          setShowAssignmentForm(true);
                        }}
                      >
                        + Tạo bài tập
                      </button>
                    </div>

                    <div className="session-materials">
                      <h5>📚 Tài liệu</h5>
                      <p className="uid" style={{ fontSize: '13px' }}>Chưa có tài liệu</p>
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: '5px', fontSize: '13px' }}>
                        + Upload tài liệu
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Assignment Form Modal */}
      {showAssignmentForm && (
        <div className="modal-overlay" onClick={() => setShowAssignmentForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Tạo bài tập mới</h3>
            <div className="form-group">
              <label>Tiêu đề *</label>
              <input
                type="text"
                value={assignmentForm.title}
                onChange={(e) => setAssignmentForm({...assignmentForm, title: e.target.value})}
                placeholder="VD: Bài tập về nhà tuần 1"
              />
            </div>
            <div className="form-group">
              <label>Mô tả</label>
              <textarea
                value={assignmentForm.description}
                onChange={(e) => setAssignmentForm({...assignmentForm, description: e.target.value})}
                rows="4"
                placeholder="Mô tả chi tiết bài tập..."
              />
            </div>
            <div className="form-group">
              <label>Hạn nộp</label>
              <input
                type="datetime-local"
                value={assignmentForm.due_date}
                onChange={(e) => setAssignmentForm({...assignmentForm, due_date: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Điểm tối đa</label>
              <input
                type="number"
                value={assignmentForm.max_score}
                onChange={(e) => setAssignmentForm({...assignmentForm, max_score: parseFloat(e.target.value)})}
                min="0"
                max="100"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAssignmentForm(false)}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleCreateAssignment}>
                Tạo bài tập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Form Modal */}
      {showSubmitForm && (
        <div className="modal-overlay" onClick={() => setShowSubmitForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Nộp bài tập</h3>
            <div className="form-group">
              <label>Nội dung bài làm</label>
              <textarea
                value={submitForm.submission_text}
                onChange={(e) => setSubmitForm({...submitForm, submission_text: e.target.value})}
                rows="6"
                placeholder="Nhập nội dung bài làm..."
              />
            </div>
            <div className="form-group">
              <label>Link file (Google Drive, Dropbox,...)</label>
              <input
                type="url"
                value={submitForm.submission_url}
                onChange={(e) => setSubmitForm({...submitForm, submission_url: e.target.value})}
                placeholder="https://..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowSubmitForm(false)}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={() => handleSubmitAssignment(showSubmitForm)}>
                Nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassDetail;
