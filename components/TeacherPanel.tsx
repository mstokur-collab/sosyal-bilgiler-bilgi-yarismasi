import React, { useState, useMemo } from 'react';
import type { Question, DocumentLibraryItem, Exam } from '../types';
import { QuestionGenerator } from './teacher_panel/QuestionGenerator';
import { QuestionLibrary } from './teacher_panel/QuestionLibrary';
import { DocumentManager } from './teacher_panel/DocumentManager';
import { Tools } from './teacher_panel/Tools';
import { ExamGenerator } from './teacher_panel/ExamGenerator';


interface TeacherPanelProps {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  onSelectQuestion: (question: Question) => void;
  onResetSolvedQuestions: () => void;
  onClearAllData: () => void;
  selectedSubjectId: string;
  documentLibrary: DocumentLibraryItem[];
  setDocumentLibrary: React.Dispatch<React.SetStateAction<DocumentLibraryItem[]>>;
  generatedExams: Exam[];
  setGeneratedExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  onBack: () => void;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-xs sm:px-4 sm:text-sm font-semibold rounded-md transition-colors duration-200 flex-shrink-0 flex items-center gap-1 ${
      active ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    }`}
  >
    {children}
  </button>
);

const TeacherPanel: React.FC<TeacherPanelProps> = ({
  questions,
  setQuestions,
  onSelectQuestion,
  onResetSolvedQuestions,
  onClearAllData,
  selectedSubjectId,
  documentLibrary,
  setDocumentLibrary,
  generatedExams,
  setGeneratedExams,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'exam-generator' | 'library' | 'import' | 'tools'>('generate');
  
  const subjectPrefixes: Record<string, string[]> = {
    'social-studies': ['SB.', 'İTA.'],
    'math': ['MAT.', 'M.'],
    'science': ['FEN.', 'F.'],
    'turkish': ['T.'],
    'english': ['E'],
    'paragraph': ['P.'],
  };

  const subjectQuestions = useMemo(() => {
    const prefixes = subjectPrefixes[selectedSubjectId] || [];
    return questions.filter(q => {
        if (q.subjectId) {
            return q.subjectId === selectedSubjectId;
        }
        if (q.kazanımId) {
            return prefixes.some(prefix => q.kazanımId.startsWith(prefix));
        }
        return false;
    });
  }, [questions, selectedSubjectId]);


  const renderContent = () => {
    switch (activeTab) {
      case 'generate':
        return <QuestionGenerator selectedSubjectId={selectedSubjectId} setQuestions={setQuestions} documentLibrary={documentLibrary} />;
      case 'exam-generator':
        return <ExamGenerator generatedExams={generatedExams} setGeneratedExams={setGeneratedExams} selectedSubjectId={selectedSubjectId} documentLibrary={documentLibrary} />;
      case 'library':
        return <QuestionLibrary questions={subjectQuestions} setQuestions={setQuestions} onSelectQuestion={onSelectQuestion} />;
      case 'import':
        return <DocumentManager documentLibrary={documentLibrary} setDocumentLibrary={setDocumentLibrary} setQuestions={setQuestions} selectedSubjectId={selectedSubjectId} />;
      case 'tools':
        return <Tools onResetSolvedQuestions={onResetSolvedQuestions} onClearAllData={onClearAllData} selectedSubjectId={selectedSubjectId} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-white">
      <header className="flex-shrink-0 bg-slate-800/50 p-3 sm:p-4 border-b border-slate-700 flex items-center justify-between z-10 sticky top-0">
          <div className="flex-1 flex justify-start">
            <button 
                onClick={onBack} 
                className="bg-amber-400/80 hover:bg-amber-300/90 text-slate-900 font-bold px-3 py-1 sm:px-4 sm:py-2 rounded-xl backdrop-blur-md transition-transform hover:scale-105 shadow-lg"
            >
                ← Geri
            </button>
          </div>
          <h2 className="flex-shrink-0 text-xl sm:text-2xl font-bold text-center text-slate-200 px-4">Öğretmen Paneli</h2>
          <div className="flex-1 flex justify-end items-center gap-1 sm:gap-2 flex-wrap">
            <TabButton active={activeTab === 'generate'} onClick={() => setActiveTab('generate')}>AI ile Soru Üret</TabButton>
            <TabButton active={activeTab === 'exam-generator'} onClick={() => setActiveTab('exam-generator')}>✍️ Yazılı Oluştur</TabButton>
            <TabButton active={activeTab === 'library'} onClick={() => setActiveTab('library')}>
              Soru Bankası <span className="text-yellow-400 font-bold">({subjectQuestions.length})</span>
            </TabButton>
            <TabButton active={activeTab === 'import'} onClick={() => setActiveTab('import')}>
              Kaynak Kütüphanem <span className="text-yellow-400 font-bold">({documentLibrary.length})</span>
            </TabButton>
            <TabButton active={activeTab === 'tools'} onClick={() => setActiveTab('tools')}>Araçlar</TabButton>
          </div>
      </header>
      <main className="flex-grow overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default TeacherPanel;