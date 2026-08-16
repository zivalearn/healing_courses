import React, { useState } from 'react';
import { X, CheckCircle, Sparkles, MessageCircle, Send, PhoneCall } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    programInterest: 'General Consultation',
    message: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl border border-[#C8E6E1] shadow-2xl overflow-hidden my-8 text-[#102A36]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-[#102A36] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md text-[#CBA258]">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#CBA258] block">Personal Consultation</span>
              <h3 className="font-serif text-xl font-bold">
                Connect with Master Heer
              </h3>
            </div>
          </div>

          <button
            onClick={() => { setSubmitted(false); onClose(); }}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-[#E2F1EE] text-[#287687] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="font-serif text-2xl font-bold text-[#102A36]">
                Inquiry Received!
              </h4>
              <p className="text-xs text-[#486D7A] max-w-xs mx-auto">
                Thank you <strong className="text-[#102A36]">{formData.name}</strong>. Heer's team will reach out to you via WhatsApp / Email within 24 hours.
              </p>
              <button
                onClick={() => { setSubmitted(false); onClose(); }}
                className="py-3 px-8 rounded-full bg-[#287687] text-white text-xs font-bold cursor-pointer"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-[#486D7A]">
                Not sure which program is right for your healing goals? Leave a message and get personalized guidance.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ananya@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    WhatsApp Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                  Program of Interest
                </label>
                <select
                  value={formData.programInterest}
                  onChange={(e) => setFormData({ ...formData, programInterest: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-xs font-semibold focus:outline-none focus:border-[#287687]"
                >
                  <option value="General Consultation">General Healing Consultation</option>
                  <option value="Reiki Healing">Reiki Healing Certification</option>
                  <option value="NLP Master">NLP Master Practitioner</option>
                  <option value="Timeline Therapy">Timeline Therapy</option>
                  <option value="Trauma Healing">Somatic Trauma Healing</option>
                  <option value="Hypnotherapy">Clinical Hypnotherapy & EFT</option>
                  <option value="Relationship Mastery">Relationship Mastery</option>
                  <option value="Energy Healing">Energy Healing & Cord Cutting</option>
                  <option value="Tarot Courses">Intuitive Tarot Certification</option>
                  <option value="Train the Trainer">Train the Trainer Mentorship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                  How can we support you?
                </label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Share a short note on what you wish to heal or achieve..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#C8E6E1] text-sm focus:outline-none focus:border-[#287687]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#287687] hover:bg-[#1C5B69] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
