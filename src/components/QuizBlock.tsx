import React, { useState, useEffect, useRef } from 'react';
import { LessonBlock } from '../models/lessonBlock';
import { lessonBlockService } from '../services/lessonBlockService';
import {
  HelpCircle,
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
  AlertCircle,
  Eye,
  Edit3,
  Shuffle,
  Save,
  Loader2,
  CheckSquare,
  Circle,
  RotateCcw,
  Award,
  Info,
  Sliders,
  MessageSquare,
} from 'lucide-react';

export type QuizQuestionType =
  | 'multiple_choice'
  | 'multiple_correct'
  | 'true_false'
  | 'short_answer';

export interface QuizMetadata {
  question_type: QuizQuestionType;
  options: string[];
  correct_index: number;
  correct_indices: number[];
  correct_boolean: boolean;
  correct_short_answer: string;
  explanation: string;
  passing_score: number;
  shuffle_answers: boolean;
  points: number;
}

const DEFAULT_METADATA: QuizMetadata = {
  question_type: 'multiple_choice',
  options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
  correct_index: 0,
  correct_indices: [0],
  correct_boolean: true,
  correct_short_answer: '',
  explanation: 'Great job! This is the correct answer because...',
  passing_score: 80,
  shuffle_answers: false,
  points: 10,
};

interface QuizBlockProps {
  block: LessonBlock;
  onUpdateBlock?: (updated: LessonBlock) => void;
  isStudentView?: boolean;
}

export const QuizBlock: React.FC<QuizBlockProps> = ({
  block,
  onUpdateBlock,
  isStudentView = false,
}) => {
  // Parsing metadata
  const metadata: QuizMetadata = {
    ...DEFAULT_METADATA,
    ...(block.metadata || {}),
  };

  const [mode, setMode] = useState<'edit' | 'preview'>(
    isStudentView ? 'preview' : 'preview'
  );

  // Editable fields
  const [question, setQuestion] = useState(block.title || 'Knowledge Check Question');
  const [description, setDescription] = useState(block.content || '');
  const [isRequired, setIsRequired] = useState(block.is_required || false);

  const [questionType, setQuestionType] = useState<QuizQuestionType>(
    metadata.question_type || 'multiple_choice'
  );
  const [options, setOptions] = useState<string[]>(
    Array.isArray(metadata.options) && metadata.options.length > 0
      ? metadata.options
      : DEFAULT_METADATA.options
  );
  const [correctIndex, setCorrectIndex] = useState<number>(
    typeof metadata.correct_index === 'number' ? metadata.correct_index : 0
  );
  const [correctIndices, setCorrectIndices] = useState<number[]>(
    Array.isArray(metadata.correct_indices) ? metadata.correct_indices : [0]
  );
  const [correctBoolean, setCorrectBoolean] = useState<boolean>(
    typeof metadata.correct_boolean === 'boolean' ? metadata.correct_boolean : true
  );
  const [correctShortAnswer, setCorrectShortAnswer] = useState<string>(
    metadata.correct_short_answer || ''
  );
  const [explanation, setExplanation] = useState<string>(metadata.explanation || '');
  const [passingScore, setPassingScore] = useState<number>(
    typeof metadata.passing_score === 'number' ? metadata.passing_score : 80
  );
  const [shuffleAnswers, setShuffleAnswers] = useState<boolean>(
    !!metadata.shuffle_answers
  );
  const [points, setPoints] = useState<number>(
    typeof metadata.points === 'number' ? metadata.points : 10
  );

  // Auto-save & Status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Student Interactive Response State
  const [userSelectedOption, setUserSelectedOption] = useState<number | null>(null);
  const [userSelectedIndices, setUserSelectedIndices] = useState<number[]>([]);
  const [userSelectedBoolean, setUserSelectedBoolean] = useState<boolean | null>(null);
  const [userShortAnswerText, setUserShortAnswerText] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [isCorrectResult, setIsCorrectResult] = useState<boolean | null>(null);

  // Sync props when block changes
  useEffect(() => {
    setQuestion(block.title || 'Knowledge Check Question');
    setDescription(block.content || '');
    setIsRequired(block.is_required || false);

    const m: QuizMetadata = { ...DEFAULT_METADATA, ...(block.metadata || {}) };
    setQuestionType(m.question_type || 'multiple_choice');
    setOptions(Array.isArray(m.options) && m.options.length > 0 ? m.options : DEFAULT_METADATA.options);
    setCorrectIndex(typeof m.correct_index === 'number' ? m.correct_index : 0);
    setCorrectIndices(Array.isArray(m.correct_indices) ? m.correct_indices : [0]);
    setCorrectBoolean(typeof m.correct_boolean === 'boolean' ? m.correct_boolean : true);
    setCorrectShortAnswer(m.correct_short_answer || '');
    setExplanation(m.explanation || '');
    setPassingScore(typeof m.passing_score === 'number' ? m.passing_score : 80);
    setShuffleAnswers(!!m.shuffle_answers);
    setPoints(typeof m.points === 'number' ? m.points : 10);
  }, [block.id]);

  // Validation Checks
  const getValidationErrors = (): string[] => {
    const errors: string[] = [];
    if (!question.trim()) errors.push('Question prompt cannot be empty.');

    if (questionType === 'multiple_choice' || questionType === 'multiple_correct') {
      if (options.length < 2) errors.push('Must provide at least 2 choice options.');
      if (options.some((opt) => !opt.trim())) errors.push('Choice options cannot be blank.');
    }

    if (questionType === 'multiple_choice' && (correctIndex < 0 || correctIndex >= options.length)) {
      errors.push('Please select a valid correct option.');
    }

    if (questionType === 'multiple_correct' && correctIndices.length === 0) {
      errors.push('Please select at least one correct option.');
    }

    if (questionType === 'short_answer' && !correctShortAnswer.trim()) {
      errors.push('Please provide a valid correct short answer keyword/phrase.');
    }

    return errors;
  };

  const validationErrors = getValidationErrors();

  // Save Quiz Block
  const saveQuiz = async (
    newTitle = question,
    newContent = description,
    newRequired = isRequired,
    newType = questionType,
    newOpts = options,
    newCorrIdx = correctIndex,
    newCorrIndices = correctIndices,
    newCorrBool = correctBoolean,
    newCorrShort = correctShortAnswer,
    newExp = explanation,
    newPassScore = passingScore,
    newShuffle = shuffleAnswers,
    newPts = points
  ) => {
    setSaveStatus('saving');

    const updatedMetadata: QuizMetadata = {
      question_type: newType,
      options: newOpts,
      correct_index: newCorrIdx,
      correct_indices: newCorrIndices,
      correct_boolean: newCorrBool,
      correct_short_answer: newCorrShort,
      explanation: newExp,
      passing_score: newPassScore,
      shuffle_answers: newShuffle,
      points: newPts,
    };

    const { data } = await lessonBlockService.updateBlock(block.id, {
      title: newTitle.trim(),
      content: newContent.trim(),
      is_required: newRequired,
      metadata: updatedMetadata,
    });

    setSaveStatus('saved');
    if (data && onUpdateBlock) onUpdateBlock(data);
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  // Debounced Auto-save Trigger
  const triggerAutoSave = (overrides?: Partial<{
    title: string;
    content: string;
    is_required: boolean;
    question_type: QuizQuestionType;
    options: string[];
    correct_index: number;
    correct_indices: number[];
    correct_boolean: boolean;
    correct_short_answer: string;
    explanation: string;
    passing_score: number;
    shuffle_answers: boolean;
    points: number;
  }>) => {
    setSaveStatus('idle');
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      saveQuiz(
        overrides?.title ?? question,
        overrides?.content ?? description,
        overrides?.is_required ?? isRequired,
        overrides?.question_type ?? questionType,
        overrides?.options ?? options,
        overrides?.correct_index ?? correctIndex,
        overrides?.correct_indices ?? correctIndices,
        overrides?.correct_boolean ?? correctBoolean,
        overrides?.correct_short_answer ?? correctShortAnswer,
        overrides?.explanation ?? explanation,
        overrides?.passing_score ?? passingScore,
        overrides?.shuffle_answers ?? shuffleAnswers,
        overrides?.points ?? points
      );
    }, 600);
  };

  // Option Handler Helpers
  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
    triggerAutoSave({ options: updated });
  };

  const handleAddOption = () => {
    const updated = [...options, `Option ${options.length + 1}`];
    setOptions(updated);
    triggerAutoSave({ options: updated });
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);

    let nextCorrIdx = correctIndex;
    if (correctIndex >= updated.length) nextCorrIdx = 0;
    setCorrectIndex(nextCorrIdx);

    const nextCorrIndices = correctIndices.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i));
    setCorrectIndices(nextCorrIndices.length > 0 ? nextCorrIndices : [0]);

    triggerAutoSave({ options: updated, correct_index: nextCorrIdx, correct_indices: nextCorrIndices });
  };

  const toggleMultipleCorrectIndex = (index: number) => {
    let next: number[];
    if (correctIndices.includes(index)) {
      if (correctIndices.length === 1) return; // Keep at least one
      next = correctIndices.filter((i) => i !== index);
    } else {
      next = [...correctIndices, index];
    }
    setCorrectIndices(next);
    triggerAutoSave({ correct_indices: next });
  };

  // Student Submit Validation
  const handleSubmitAnswer = () => {
    let isCorrect = false;

    if (questionType === 'multiple_choice') {
      isCorrect = userSelectedOption === correctIndex;
    } else if (questionType === 'multiple_correct') {
      const sortedUser = [...userSelectedIndices].sort().join(',');
      const sortedTarget = [...correctIndices].sort().join(',');
      isCorrect = sortedUser === sortedTarget;
    } else if (questionType === 'true_false') {
      isCorrect = userSelectedBoolean === correctBoolean;
    } else if (questionType === 'short_answer') {
      const normalizedUser = userShortAnswerText.trim().toLowerCase();
      const normalizedTarget = correctShortAnswer.trim().toLowerCase();
      isCorrect = normalizedUser === normalizedTarget || normalizedTarget.includes(normalizedUser);
    }

    setIsCorrectResult(isCorrect);
    setHasSubmitted(true);
  };

  const handleResetAnswer = () => {
    setUserSelectedOption(null);
    setUserSelectedIndices([]);
    setUserSelectedBoolean(null);
    setUserShortAnswerText('');
    setHasSubmitted(false);
    setIsCorrectResult(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
      {/* Top Header / Mode Switcher */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <HelpCircle className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Quiz Block</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                {questionType === 'multiple_choice'
                  ? 'Multiple Choice'
                  : questionType === 'multiple_correct'
                  ? 'Multiple Correct'
                  : questionType === 'true_false'
                  ? 'True / False'
                  : 'Short Answer'}
              </span>
              <span className="text-[11px] font-mono font-semibold text-slate-500">
                • {points} Points
              </span>
            </div>
          </div>
        </div>

        {!isStudentView && (
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && (
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Auto-saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}

            <div className="flex items-center bg-slate-200/70 rounded-xl p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                  mode === 'edit'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Configure</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('preview')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                  mode === 'preview'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* EDIT CONFIGURATION MODE */}
      {mode === 'edit' && !isStudentView ? (
        <div className="p-6 space-y-6 bg-white">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Configuration Recommendations</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-amber-700">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 1. Question Prompt & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Question Prompt *
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  triggerAutoSave({ title: e.target.value });
                }}
                placeholder="e.g. What is the primary benefit of React hooks?"
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Question Type *
              </label>
              <select
                value={questionType}
                onChange={(e) => {
                  const val = e.target.value as QuizQuestionType;
                  setQuestionType(val);
                  triggerAutoSave({ question_type: val });
                }}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
              >
                <option value="multiple_choice">Multiple Choice (Single Correct)</option>
                <option value="multiple_correct">Multiple Correct (Select All)</option>
                <option value="true_false">True / False</option>
                <option value="short_answer">Short Answer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Context / Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                triggerAutoSave({ content: e.target.value });
              }}
              placeholder="Provide extra context or hints for the student before they answer..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed"
            />
          </div>

          {/* 2. Answer Options Configuration */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Answer Options & Keys
              </h4>
              <span className="text-[11px] text-slate-500 italic">
                Mark the correct answer(s) below
              </span>
            </div>

            {/* Multiple Choice (Single) */}
            {questionType === 'multiple_choice' && (
              <div className="space-y-2">
                {options.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCorrectIndex(idx);
                        triggerAutoSave({ correct_index: idx });
                      }}
                      className={`p-1.5 rounded-lg border transition-all ${
                        correctIndex === idx
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : 'bg-slate-100 text-slate-400 border-slate-200 hover:border-slate-300'
                      }`}
                      title={correctIndex === idx ? 'Correct Answer' : 'Set as Correct'}
                    >
                      <Circle className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}...`}
                      className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddOption}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Choice Option
                </button>
              </div>
            )}

            {/* Multiple Correct (Select All) */}
            {questionType === 'multiple_correct' && (
              <div className="space-y-2">
                {options.map((option, idx) => {
                  const isChecked = correctIndices.includes(idx);
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleMultipleCorrectIndex(idx)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isChecked
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : 'bg-slate-100 text-slate-400 border-slate-200 hover:border-slate-300'
                        }`}
                        title={isChecked ? 'Correct Answer' : 'Set as Correct'}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}...`}
                        className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={handleAddOption}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Choice Option
                </button>
              </div>
            )}

            {/* True / False */}
            {questionType === 'true_false' && (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCorrectBoolean(true);
                    triggerAutoSave({ correct_boolean: true });
                  }}
                  className={`flex-1 p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    correctBoolean === true
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Check className="w-4 h-4 text-emerald-600" /> True is Correct
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCorrectBoolean(false);
                    triggerAutoSave({ correct_boolean: false });
                  }}
                  className={`flex-1 p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    correctBoolean === false
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-4 h-4 text-rose-600" /> False is Correct
                </button>
              </div>
            )}

            {/* Short Answer */}
            {questionType === 'short_answer' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Correct Answer / Keyword
                </label>
                <input
                  type="text"
                  value={correctShortAnswer}
                  onChange={(e) => {
                    setCorrectShortAnswer(e.target.value);
                    triggerAutoSave({ correct_short_answer: e.target.value });
                  }}
                  placeholder="e.g. useState"
                  className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
            )}
          </div>

          {/* 3. Explanation & Feedback */}
          <div className="border-t border-slate-100 pt-5">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Answer Explanation / Feedback Text
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => {
                setExplanation(e.target.value);
                triggerAutoSave({ explanation: e.target.value });
              }}
              placeholder="Explain why the correct answer is right to aid student learning..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed"
            />
          </div>

          {/* 4. Quiz Settings (Points, Passing Score, Shuffle, Required) */}
          <div className="border-t border-slate-100 pt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Points
              </label>
              <input
                type="number"
                min={0}
                value={points}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPoints(val);
                  triggerAutoSave({ points: val });
                }}
                className="w-full text-xs font-mono font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Passing Score (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPassingScore(val);
                  triggerAutoSave({ passing_score: val });
                }}
                className="w-full text-xs font-mono font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={shuffleAnswers}
                  onChange={(e) => {
                    setShuffleAnswers(e.target.checked);
                    triggerAutoSave({ shuffle_answers: e.target.checked });
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="flex items-center gap-1">
                  <Shuffle className="w-3.5 h-3.5 text-slate-500" />
                  Shuffle Answers
                </span>
              </label>
            </div>

            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => {
                    setIsRequired(e.target.checked);
                    triggerAutoSave({ is_required: e.target.checked });
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Required to Progress</span>
              </label>
            </div>
          </div>
        </div>
      ) : (
        /* LIVE PREVIEW / STUDENT INTERACTIVE MODE */
        <div className="p-6 space-y-5 bg-slate-50/60">
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {question}
            </h3>
            {description && (
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Multiple Choice Preview */}
          {questionType === 'multiple_choice' && (
            <div className="space-y-2">
              {options.map((opt, idx) => {
                const isSelected = userSelectedOption === idx;
                const isTarget = idx === correctIndex;

                let btnStyle =
                  'bg-white border-slate-200 hover:border-indigo-300 text-slate-800';

                if (hasSubmitted) {
                  if (isSelected) {
                    btnStyle = isTarget
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                      : 'bg-rose-50 border-rose-500 text-rose-900 font-bold';
                  } else if (isTarget) {
                    btnStyle = 'bg-emerald-50/50 border-emerald-300 text-emerald-800';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={hasSubmitted}
                    onClick={() => setUserSelectedOption(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {hasSubmitted && isSelected && (
                      <span>
                        {isTarget ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <X className="w-4 h-4 text-rose-600" />
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Multiple Correct Preview */}
          {questionType === 'multiple_correct' && (
            <div className="space-y-2">
              {options.map((opt, idx) => {
                const isChecked = userSelectedIndices.includes(idx);
                const isTarget = correctIndices.includes(idx);

                let btnStyle =
                  'bg-white border-slate-200 hover:border-indigo-300 text-slate-800';

                if (hasSubmitted) {
                  if (isChecked) {
                    btnStyle = isTarget
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                      : 'bg-rose-50 border-rose-500 text-rose-900 font-bold';
                  } else if (isTarget) {
                    btnStyle = 'bg-emerald-50/50 border-emerald-300 text-emerald-800';
                  }
                } else if (isChecked) {
                  btnStyle = 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={hasSubmitted}
                    onClick={() => {
                      if (isChecked) {
                        setUserSelectedIndices(
                          userSelectedIndices.filter((i) => i !== idx)
                        );
                      } else {
                        setUserSelectedIndices([...userSelectedIndices, idx]);
                      }
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckSquare
                        className={`w-4 h-4 ${
                          isChecked ? 'text-indigo-600' : 'text-slate-300'
                        }`}
                      />
                      <span>{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* True / False Preview */}
          {questionType === 'true_false' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={hasSubmitted}
                onClick={() => setUserSelectedBoolean(true)}
                className={`p-4 rounded-xl border text-xs font-bold transition-all ${
                  hasSubmitted
                    ? userSelectedBoolean === true
                      ? correctBoolean === true
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-rose-50 border-rose-500 text-rose-900'
                      : correctBoolean === true
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600'
                    : userSelectedBoolean === true
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                True
              </button>

              <button
                type="button"
                disabled={hasSubmitted}
                onClick={() => setUserSelectedBoolean(false)}
                className={`p-4 rounded-xl border text-xs font-bold transition-all ${
                  hasSubmitted
                    ? userSelectedBoolean === false
                      ? correctBoolean === false
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-rose-50 border-rose-500 text-rose-900'
                      : correctBoolean === false
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600'
                    : userSelectedBoolean === false
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                False
              </button>
            </div>
          )}

          {/* Short Answer Preview */}
          {questionType === 'short_answer' && (
            <div className="space-y-2">
              <input
                type="text"
                disabled={hasSubmitted}
                value={userShortAnswerText}
                onChange={(e) => setUserShortAnswerText(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Action Buttons: Submit / Try Again */}
          <div className="flex items-center justify-between border-t border-slate-200/80 pt-4">
            {!hasSubmitted ? (
              <button
                type="button"
                onClick={handleSubmitAnswer}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all"
              >
                Check Answer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetAnswer}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Try Again
              </button>
            )}

            {hasSubmitted && (
              <div
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                  isCorrectResult
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                {isCorrectResult ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Correct! +{points} Points</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-rose-600" />
                    <span>Incorrect answer. Review explanation below.</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Explanation Display */}
          {hasSubmitted && explanation && (
            <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-950 space-y-1">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Explanation & Learning Note:
              </span>
              <p className="leading-relaxed pl-5 text-indigo-900/90 font-medium">{explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizBlock;
