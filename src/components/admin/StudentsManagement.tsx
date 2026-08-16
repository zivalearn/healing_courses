import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../models/profile';
import { profileService } from '../../services/profileService';
import { enrollmentService } from '../../services/enrollmentService';
import { certificateService } from '../../services/certificateService';
import { Enrollment } from '../../types/enrollment';
import { Certificate } from '../../types/certificate';
import { 
  Users, 
  Search, 
  Filter, 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Eye, 
  CheckCircle2, 
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const StudentsManagement: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Student Modal
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<Enrollment[]>([]);
  const [studentCerts, setStudentCerts] = useState<Certificate[]>([]);

  const loadData = async () => {
    setLoading(true);
    const [profRes, enrRes, certRes] = await Promise.all([
      profileService.getAllProfiles(),
      enrollmentService.getAllEnrollments(),
      certificateService.getAllCertificates()
    ]);

    const fetchedProfiles = profRes.data || [];
    const fetchedEnrollments = enrRes.data || [];

    // Ensure every user_id in enrollments has a profile entry in Admin list
    const existingIds = new Set(fetchedProfiles.map(p => p.id));
    fetchedEnrollments.forEach(e => {
      if (e.user_id && !existingIds.has(e.user_id)) {
        fetchedProfiles.push({
          id: e.user_id,
          email: 'student@healwithheer.com',
          full_name: 'Enrolled Student',
          avatar_url: '',
          role: 'student',
          created_at: e.created_at || new Date().toISOString(),
        });
        existingIds.add(e.user_id);
      }
    });

    setProfiles(fetchedProfiles);
    setEnrollments(fetchedEnrollments);
    setCertificates(certRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter profiles
  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch = 
      (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage) || 1;
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenStudentModal = (student: UserProfile) => {
    setSelectedStudent(student);
    const userEnr = enrollments.filter(e => e.user_id === student.id);
    const userCert = certificates.filter(c => c.user_id === student.id);
    setStudentEnrollments(userEnr);
    setStudentCerts(userCert);
  };

  // Helper counts per student
  const getEnrollmentCount = (userId: string) => enrollments.filter(e => e.user_id === userId).length;
  const getCertCount = (userId: string) => certificates.filter(c => c.user_id === userId).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#102A36]">Student Management</h2>
          <p className="text-xs text-[#486D7A] mt-1">View enrolled students, track course progress, and inspect awarded certificates.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            <span>Total Registered: {profiles.length}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-2xl bg-white border border-[#C8E6E1] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#486D7A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] focus:outline-none focus:ring-2 focus:ring-[#287687]"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs text-[#486D7A] font-semibold">
            <Filter className="w-3.5 h-3.5 text-[#287687]" />
            <span>Role:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs px-3 py-2 rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] font-semibold focus:outline-none focus:ring-2 focus:ring-[#287687]"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="instructor">Instructors</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-[#C8E6E1] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#486D7A] flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#287687]" />
            <span className="text-xs font-semibold">Loading student roster...</span>
          </div>
        ) : paginatedProfiles.length === 0 ? (
          <div className="p-12 text-center text-[#486D7A]">
            <Users className="w-10 h-10 mx-auto text-[#C8E6E1] mb-2" />
            <p className="text-sm font-bold text-[#102A36]">No students found</p>
            <p className="text-xs text-[#486D7A] mt-1">Try updating your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EEF7F5] border-b border-[#C8E6E1] text-[11px] font-bold text-[#102A36] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4 text-center">Enrolled Courses</th>
                  <th className="py-3.5 px-4 text-center">Certificates</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2F1EE] text-xs">
                {paginatedProfiles.map((student) => {
                  const enrCount = getEnrollmentCount(student.id);
                  const certCount = getCertCount(student.id);

                  return (
                    <tr key={student.id} className="hover:bg-[#F7FCFA] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#102A36]">
                        <div className="flex items-center gap-3">
                          {student.avatar_url ? (
                            <img
                              src={student.avatar_url}
                              alt={student.full_name || 'Student'}
                              className="w-8 h-8 rounded-full object-cover border border-[#C8E6E1]"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#287687] text-white flex items-center justify-center font-bold text-xs">
                              {(student.full_name || student.email || 'S').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-[#102A36]">
                              {student.full_name || 'Unnamed Student'}
                            </div>
                            <div className="text-[10px] text-[#486D7A]">ID: {student.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#486D7A]">{student.email || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          student.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : student.role === 'instructor' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          {student.role || 'Student'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-teal-50 text-teal-800 text-xs font-bold">
                          {enrCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-amber-50 text-amber-800 text-xs font-bold">
                          {certCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenStudentModal(student)}
                          className="px-3 py-1.5 rounded-lg bg-[#EEF7F5] hover:bg-[#287687] text-[#287687] hover:text-white font-bold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredProfiles.length > 0 && (
          <div className="p-4 border-t border-[#C8E6E1] bg-[#F7FCFA] flex items-center justify-between">
            <span className="text-xs text-[#486D7A] font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProfiles.length)} of {filteredProfiles.length} students
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-[#C8E6E1] bg-white text-[#102A36] disabled:opacity-40 hover:bg-[#EEF7F5] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-[#102A36] px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-[#C8E6E1] bg-white text-[#102A36] disabled:opacity-40 hover:bg-[#EEF7F5] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Profile Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#C8E6E1] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#C8E6E1] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#287687] text-white flex items-center justify-center font-bold text-lg">
                  {(selectedStudent.full_name || selectedStudent.email || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#102A36]">
                    {selectedStudent.full_name || 'Student Profile'}
                  </h3>
                  <p className="text-xs text-[#486D7A]">{selectedStudent.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-[#486D7A] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats inside modal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
                <div className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-teal-600" />
                  <span>Enrolled Courses</span>
                </div>
                <div className="text-2xl font-serif font-bold text-teal-900 mt-2">
                  {studentEnrollments.length}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Certificates Earned</span>
                </div>
                <div className="text-2xl font-serif font-bold text-amber-900 mt-2">
                  {studentCerts.length}
                </div>
              </div>
            </div>

            {/* Enrolled Courses List */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-sm text-[#102A36]">Active Enrollments</h4>
              {studentEnrollments.length === 0 ? (
                <p className="text-xs text-[#486D7A] italic">No active enrollments found for this student.</p>
              ) : (
                <div className="space-y-2">
                  {studentEnrollments.map((enr) => (
                    <div key={enr.id} className="p-3 rounded-xl bg-[#F7FCFA] border border-[#E2F1EE] flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#102A36]">Course ID: {enr.course_id}</span>
                        <div className="text-[10px] text-[#486D7A]">
                          Enrolled: {enr.enrolled_at ? new Date(enr.enrolled_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        enr.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {enr.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Earned Certificates List */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-sm text-[#102A36]">Issued Certificates</h4>
              {studentCerts.length === 0 ? (
                <p className="text-xs text-[#486D7A] italic">No certificates issued yet.</p>
              ) : (
                <div className="space-y-2">
                  {studentCerts.map((cert) => (
                    <div key={cert.id} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#102A36]">{cert.certificate_number}</span>
                        <div className="text-[10px] text-[#486D7A]">
                          Issued: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        Valid
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
