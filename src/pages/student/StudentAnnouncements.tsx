import React, { useState, useEffect } from 'react';
import { Announcement } from '../../types/announcement';
import { getCourseAnnouncements } from '../../services/announcementService';
import { Bell, Clock, Sparkles, Loader2, Pin } from 'lucide-react';

interface StudentAnnouncementsProps {
  courseId: string;
}

export const StudentAnnouncements: React.FC<StudentAnnouncementsProps> = ({ courseId }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAnnouncements();
  }, [courseId]);

  const loadAnnouncements = async () => {
    setLoading(true);
    const { data } = await getCourseAnnouncements(courseId);
    setAnnouncements(data || []);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-sm text-slate-900">Official Course Announcements</h3>
        </div>
        <span className="text-xs text-slate-500 font-semibold">{announcements.length} Updates</span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Fetching announcements...</span>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
          <p className="text-xs font-semibold text-slate-600">No course announcements yet.</p>
          <p className="text-[11px] text-slate-400">Important notices from instructors will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`p-4 rounded-xl border transition-all ${
                ann.is_pinned
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  {ann.is_pinned && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center gap-1">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  <h4 className="font-bold text-xs text-slate-900">{ann.title}</h4>
                </div>
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {new Date(ann.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {ann.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
