import React, { useState } from 'react';
import { Course } from '../types';
import { X, CheckCircle, ShieldCheck, Sparkles, CreditCard, Smartphone, Lock, ArrowRight } from 'lucide-react';
import { enrollmentService } from '../services/enrollmentService';
import { studentService } from '../services/studentService';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';

interface EnrollmentModalProps {
  course: Course | null;
  onClose: () => void;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  course,
  onClose
}) => {
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    certificateName: '',
    modePreference: course?.mode || 'Online',
    paymentMethod: 'upi'
  });

  if (!course) return null;

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handleCompletePayment = async () => {
    try {
      const user = await authService.getCurrentUser();
      let studentId = user?.id;

      if (!studentId) {
        studentId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `std_${Date.now()}`;
      }

      const studentEmail = formData.email || user?.email || 'student@example.com';
      const studentName = formData.fullName || user?.user_metadata?.full_name || 'Enrolled Student';

      // 1. Persist/Upsert student profile in Supabase profiles table & local cache
      await profileService.upsertProfile({
        id: studentId,
        email: studentEmail,
        full_name: studentName,
        role: 'student',
      });

      // 2. Persist enrollment in Supabase enrollments table & local cache
      await enrollmentService.createEnrollment({
        user_id: studentId,
        course_id: course.id,
        status: 'active',
        payment_status: 'paid',
        amount_paid: course.price,
      });

      // 3. Update student service
      await studentService.enrollDemoCourse(course.id, studentId);
      window.dispatchEvent(new Event('enrollment_updated'));
    } catch (err) {
      console.warn('Enrollment error:', err);
      await studentService.enrollDemoCourse(course.id);
      window.dispatchEvent(new Event('enrollment_updated'));
    }
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-white rounded-[2rem] border border-[#C8E6E1] shadow-2xl overflow-hidden my-8 text-[#102A36]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-[#102A36] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-[#CBA258]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#CBA258] font-bold block">Enrollment Portal</span>
              <h3 className="font-serif text-xl font-normal">
                {course.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content depending on step */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* STEP 1: Student Information */}
          {step === 'details' && (
            <form onSubmit={handleSubmitDetails} className="space-y-4">
              <div className="p-4 rounded-xl bg-[#E2F1EE] border border-[#C8E6E1] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#486D7A] block font-semibold uppercase text-[10px]">Selected Course</span>
                  <span className="font-bold text-[#102A36]">{course.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#486D7A] block font-semibold uppercase text-[10px]">Tuition Fee</span>
                  <span className="font-serif font-bold text-lg text-[#287687]">
                    {course.currency}{course.price.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-widest mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    fullName: e.target.value,
                    certificateName: formData.certificateName || e.target.value
                  })}
                  placeholder="e.g. Dr. Priya Sharma"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-widest mb-1">
                  Name for Official Certificate *
                </label>
                <input
                  type="text"
                  required
                  value={formData.certificateName}
                  onChange={(e) => setFormData({ ...formData, certificateName: e.target.value })}
                  placeholder="Exact name as required on Certificate"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-widest mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="priya@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-widest mb-1">
                    WhatsApp Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-full bg-[#287687] hover:bg-[#1C5B69] text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-md"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>

              <p className="text-[11px] text-center text-[#486D7A] flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-[#287687]" />
                256-bit Secure Encryption • Instant Confirmation
              </p>
            </form>
          )}

          {/* STEP 2: Payment Preview */}
          {step === 'payment' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#E2F1EE] border border-[#C8E6E1] space-y-2 text-xs">
                <div className="flex justify-between text-[#486D7A]">
                  <span>Student Name:</span>
                  <span className="font-bold text-[#102A36]">{formData.fullName}</span>
                </div>
                <div className="flex justify-between text-[#486D7A]">
                  <span>Certificate Name:</span>
                  <span className="font-bold text-[#102A36]">{formData.certificateName}</span>
                </div>
                <div className="flex justify-between text-[#486D7A] pt-2 border-t border-[#C8E6E1]">
                  <span className="font-bold text-[#102A36]">Amount Payable:</span>
                  <span className="font-serif text-xl font-bold text-[#287687]">
                    {course.currency}{course.price.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-widest">
                  Select Preferred Payment Method:
                </label>

                <div className="space-y-2">
                  <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    formData.paymentMethod === 'upi' ? 'bg-[#E2F1EE] border-[#287687]' : 'bg-white border-[#C8E6E1]'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value="upi"
                        checked={formData.paymentMethod === 'upi'}
                        onChange={() => setFormData({ ...formData, paymentMethod: 'upi' })}
                        className="accent-[#287687]"
                      />
                      <Smartphone className="w-5 h-5 text-[#287687]" />
                      <div>
                        <span className="text-xs font-bold text-[#102A36] block">UPI / GPay / PhonePe / Paytm</span>
                        <span className="text-[11px] text-[#486D7A]">Instant zero-fee payment</span>
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    formData.paymentMethod === 'card' ? 'bg-[#E2F1EE] border-[#287687]' : 'bg-white border-[#C8E6E1]'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={() => setFormData({ ...formData, paymentMethod: 'card' })}
                        className="accent-[#287687]"
                      />
                      <CreditCard className="w-5 h-5 text-[#287687]" />
                      <div>
                        <span className="text-xs font-bold text-[#102A36] block">Credit / Debit Card / Net Banking</span>
                        <span className="text-[11px] text-[#486D7A]">Supports Visa, Mastercard, Amex</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('details')}
                  className="w-1/3 py-3.5 rounded-full bg-white text-[#102A36] text-xs font-bold uppercase tracking-widest border border-[#C8E6E1] hover:border-[#287687] cursor-pointer"
                >
                  Back
                </button>

                <button
                  onClick={handleCompletePayment}
                  className="w-2/3 py-3.5 rounded-full bg-[#287687] hover:bg-[#1C5B69] text-white text-xs font-bold uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>Confirm ({course.currency}{course.price.toLocaleString()})</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Enrolment Success */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#E2F1EE] border border-[#C8E6E1] text-[#287687] flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#287687] block">
                  Enrollment Confirmed!
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#102A36] mt-1">
                  Welcome to Heal With Heer
                </h3>
                <p className="text-xs text-[#486D7A] mt-2 max-w-sm mx-auto">
                  Congratulations <strong className="text-[#102A36]">{formData.fullName}</strong>! Your seat for <strong>{course.name}</strong> is reserved.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#E2F1EE] border border-[#C8E6E1] text-xs space-y-1 text-left">
                <p className="font-bold text-[#102A36]">📋 Enrollment Summary:</p>
                <p className="text-[#486D7A]">Certificate Name: <strong>{formData.certificateName}</strong></p>
                <p className="text-[#486D7A]">Batch Schedule: <strong>{course.upcomingBatchDate || 'Immediate Access'}</strong></p>
                <p className="text-[#486D7A]">Access Code: <strong className="text-[#287687] font-mono">HEAL-HEER-{Math.floor(1000 + Math.random() * 9000)}</strong></p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-full bg-[#102A36] hover:bg-[#287687] text-white font-bold text-xs uppercase tracking-widest shadow-md transition-all cursor-pointer"
              >
                Done & Return to Courses
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
