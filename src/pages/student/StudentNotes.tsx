import React, { useState, useEffect, useRef } from 'react';
import { Note } from '../../types/note';
import { createNote, updateNote, deleteNote, getNotes } from '../../services/noteService';
import { FileText, Save, Trash2, Plus, Search, Loader2, Check, Clock } from 'lucide-react';

interface StudentNotesProps {
  userId: string;
  lessonId: string;
  lessonTitle: string;
}

export const StudentNotes: React.FC<StudentNotesProps> = ({
  userId,
  lessonId,
  lessonTitle,
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [noteContent, setNoteContent] = useState<string>('');
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load user notes
  useEffect(() => {
    loadUserNotes();
  }, [userId, lessonId]);

  const loadUserNotes = async () => {
    setLoading(true);
    const { data } = await getNotes(userId);
    const allNotes = data || [];
    setNotes(allNotes);

    // Check if a note already exists for this lesson
    const existingForLesson = allNotes.find((n) => n.lesson_id === lessonId);
    if (existingForLesson) {
      setCurrentNote(existingForLesson);
      setNoteTitle(existingForLesson.title || `Notes: ${lessonTitle}`);
      setNoteContent(existingForLesson.content || '');
    } else {
      setCurrentNote(null);
      setNoteTitle(`Notes: ${lessonTitle}`);
      setNoteContent('');
    }
    setLoading(false);
  };

  const handleContentChange = (text: string) => {
    setNoteContent(text);
    setSaveStatus('saving');

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (currentNote) {
        // Update existing note
        const { data } = await updateNote(currentNote.id, {
          title: noteTitle,
          content: text,
        });
        if (data) {
          setCurrentNote(data);
          setNotes((prev) => prev.map((n) => (n.id === data.id ? data : n)));
        }
      } else {
        // Create new note
        const { data } = await createNote({
          user_id: userId,
          lesson_id: lessonId,
          title: noteTitle || `Notes: ${lessonTitle}`,
          content: text,
        });
        if (data) {
          setCurrentNote(data);
          setNotes((prev) => [data, ...prev]);
        }
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const handleDelete = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (currentNote?.id === noteId) {
        setCurrentNote(null);
        setNoteContent('');
        setNoteTitle(`Notes: ${lessonTitle}`);
      }
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      (n.title && n.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
      {/* Top Controls */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-sm text-slate-900">Personal Study Notes</h3>
        </div>

        {/* Save indicator */}
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Autosaving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved to cloud
            </span>
          )}
        </div>
      </div>

      {/* Note Editor Area */}
      <div className="space-y-3">
        <input
          type="text"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
          placeholder="Note Title..."
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />

        <textarea
          value={noteContent}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Type your notes, thoughts, and reflections for this lesson here... (Autosaved)"
          rows={6}
          className="w-full p-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y font-sans"
        />
      </div>

      {/* Previously Saved Notes List */}
      {notes.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700">All Your Saved Notes ({notes.length})</h4>
            <div className="relative w-40">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredNotes.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  setCurrentNote(n);
                  setNoteTitle(n.title || '');
                  setNoteContent(n.content || '');
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  currentNote?.id === n.id
                    ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900'
                    : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/80 text-slate-800'
                }`}
              >
                <div className="space-y-0.5 truncate pr-2">
                  <h5 className="text-xs font-bold truncate">{n.title || 'Untitled Note'}</h5>
                  <p className="text-[10px] text-slate-500 truncate">{n.content || 'No content'}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(n.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200/60 transition-colors shrink-0"
                  title="Delete Note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
