import React, { useState, useEffect } from 'react';
import { Certificate } from '../../types/certificate';
import { certificateService } from '../../services/certificateService';
import { courseService } from '../../services/courseService';
import { Course } from '../../models/course';
import { 
  Award, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  QrCode
} from 'lucide-react';

export const CertificatesManagement: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'revoked'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Issue Certificate Modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newCourseId, setNewCourseId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Verify Certificate Modal
  const [verifyToken, setVerifyToken] = useState('');
  const [verifyResult, setVerifyResult] = useState<{ isValid: boolean; cert: Certificate | null } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [certRes, courseList] = await Promise.all([
      certificateService.getAllCertificates(),
      courseService.getAllCourses()
    ]);

    setCertificates(certRes.data || []);
    setCourses(courseList || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter logic
  const filteredCertificates = certificates.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (c.certificate_number || '').toLowerCase().includes(query) ||
      (c.user_id || '').toLowerCase().includes(query) ||
      (c.course_id || '').toLowerCase().includes(query);

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'valid' && !c.is_revoked) ||
      (statusFilter === 'revoked' && c.is_revoked);

    return matchesSearch && matchesStatus;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage) || 1;
  const paginatedCertificates = filteredCertificates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId || !newCourseId) return;

    setSubmitting(true);
    const res = await certificateService.createCertificate({
      user_id: newUserId,
      course_id: newCourseId,
      issued_at: new Date().toISOString()
    });

    if (res.data) {
      await loadData();
      setShowIssueModal(false);
      setNewUserId('');
      setNewCourseId('');
    }
    setSubmitting(false);
  };

  const handleRevokeCertificate = async (id: string) => {
    if (window.confirm('Are you sure you want to revoke this certificate?')) {
      const res = await certificateService.revokeCertificate(id, 'Revoked by admin decision');
      if (res.data) {
        setCertificates(prev => prev.map(c => c.id === id ? { ...c, is_revoked: true } : c));
      }
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyToken) return;

    setVerifying(true);
    const res = await certificateService.verifyCertificate(verifyToken.trim());
    setVerifyResult({
      isValid: res.isValid,
      cert: res.data
    });
    setVerifying(false);
  };

  const getCourseTitle = (courseId: string) => {
    const course = courses.find(c => c.id === courseId || c.slug === courseId);
    return course ? (course.name || course.title) : courseId;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#102A36]">Certificates Management</h2>
          <p className="text-xs text-[#486D7A] mt-1">Issue official course completion certificates, verify credentials, and manage revocation statuses.</p>
        </div>

        <button
          onClick={() => setShowIssueModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#287687] hover:bg-[#1C5B69] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-[#CBA258]" />
          <span>Issue New Certificate</span>
        </button>
      </div>

      {/* Verify Certificate Quick Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#102A36] to-[#1C5B69] text-white shadow-md space-y-3">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-[#CBA258]" />
          <h3 className="font-serif font-bold text-sm">Verify Certificate Authenticity</h3>
        </div>
        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            placeholder="Enter certificate number or verification token..."
            value={verifyToken}
            onChange={(e) => setVerifyToken(e.target.value)}
            className="flex-1 w-full px-4 py-2 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#CBA258]"
          />
          <button
            type="submit"
            disabled={verifying}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#CBA258] hover:bg-[#b08b47] text-[#102A36] font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {verifying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Verify Token</span>
          </button>
        </form>

        {verifyResult && (
          <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            verifyResult.isValid 
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100' 
              : 'bg-rose-500/20 border-rose-400 text-rose-100'
          }`}>
            {verifyResult.isValid ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Certificate Verified! Student ID: {verifyResult.cert?.user_id} | Issued: {verifyResult.cert?.issued_at?.slice(0, 10)}</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Certificate Invalid or Revoked! No valid matching record found.</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-2xl bg-white border border-[#C8E6E1] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#486D7A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search certificate number, student or course..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] focus:outline-none focus:ring-2 focus:ring-[#287687]"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs text-[#486D7A] font-semibold">
            <Filter className="w-3.5 h-3.5 text-[#287687]" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="text-xs px-3 py-2 rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] font-semibold focus:outline-none focus:ring-2 focus:ring-[#287687]"
          >
            <option value="all">All Statuses</option>
            <option value="valid">Valid Only</option>
            <option value="revoked">Revoked Only</option>
          </select>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-2xl border border-[#C8E6E1] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#486D7A] flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#287687]" />
            <span className="text-xs font-semibold">Loading certificates registry...</span>
          </div>
        ) : paginatedCertificates.length === 0 ? (
          <div className="p-12 text-center text-[#486D7A]">
            <Award className="w-10 h-10 mx-auto text-[#C8E6E1] mb-2" />
            <p className="text-sm font-bold text-[#102A36]">No certificates found</p>
            <p className="text-xs text-[#486D7A] mt-1">Try updating your search term or issue a new certificate.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EEF7F5] border-b border-[#C8E6E1] text-[11px] font-bold text-[#102A36] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Certificate Number</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Issued Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2F1EE] text-xs">
                {paginatedCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-[#F7FCFA] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#102A36]">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#CBA258]" />
                        <span>{cert.certificate_number}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#486D7A]">
                      {cert.user_id?.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#102A36]">
                      {getCourseTitle(cert.course_id)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        cert.is_revoked
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {cert.is_revoked ? (
                          <>
                            <XCircle className="w-3 h-3" />
                            Revoked
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Valid
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#486D7A]">
                      {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!cert.is_revoked && (
                        <button
                          onClick={() => handleRevokeCertificate(cert.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-bold text-[10px] transition-colors cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredCertificates.length > 0 && (
          <div className="p-4 border-t border-[#C8E6E1] bg-[#F7FCFA] flex items-center justify-between">
            <span className="text-xs text-[#486D7A] font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCertificates.length)} of {filteredCertificates.length} certificates
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

      {/* Modal: Issue Certificate */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#C8E6E1] shadow-2xl w-full max-w-md p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#C8E6E1] pb-4">
              <h3 className="font-serif font-bold text-lg text-[#102A36] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#CBA258]" />
                Issue Certificate
              </h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-[#486D7A] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueCertificate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#102A36] mb-1">
                  Student User ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., student-123 or UUID"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] focus:outline-none focus:ring-2 focus:ring-[#287687]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A36] mb-1">
                  Select Completed Course <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#C8E6E1] bg-[#F7FCFA] text-[#102A36] focus:outline-none focus:ring-2 focus:ring-[#287687]"
                >
                  <option value="">Select course...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#C8E6E1] text-[#102A36] font-bold text-xs hover:bg-[#F7FCFA] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#287687] hover:bg-[#1C5B69] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Generate Certificate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
