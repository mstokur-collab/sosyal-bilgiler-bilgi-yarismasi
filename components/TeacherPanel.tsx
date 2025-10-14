// FIX: Add missing import for React and hooks to resolve multiple 'Cannot find name' errors.
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
// FIX: Imported 'GameSettings' type to resolve a 'Cannot find name' error.
import type { Question, Difficulty, QuestionType, DocumentLibraryItem, QuizQuestion, GameSettings, Exam } from '../types';
import { generateQuestionWithAI, generateImageForQuestion, extractQuestionFromImage, extractTopicsFromPDF, generateExamFromKazanims, improveGeneratedExam } from '../services/geminiService';
import { curriculumData } from '../data/curriculum';
import { Button, Modal } from './UI';
import { PromptTemplateGenerator } from './PromptTemplateGenerator';

declare const mammoth: any;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });

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

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, className, ...props }) => (
  <select
    className={`p-2 bg-slate-800 rounded-md border border-slate-600 w-full disabled:opacity-50 text-white ${className}`}
    {...props}
  >
    {children}
  </select>
);

const QuestionGenerator: React.FC<{
  selectedSubjectId: string;
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  documentLibrary: DocumentLibraryItem[];
}> = ({ selectedSubjectId, setQuestions, documentLibrary }) => {
  const [grade, setGrade] = useState<number>(8);
  const [ogrenmeAlani, setOgrenmeAlani] = useState<string>('');
  const [kazanımId, setKazanımId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('orta');
  const [questionType, setQuestionType] = useState<QuestionType>('quiz');
  const [questionCount, setQuestionCount] = useState<number>(1);
  const [shouldGenerateImage, setShouldGenerateImage] = useState(false);
  const [generationContext, setGenerationContext] = useState<'default' | 'pdf-topic'>('default');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [paragraphSkill, setParagraphSkill] = useState<string>('main-idea');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const ogrenmeAlanlari = useMemo(() => curriculumData[selectedSubjectId]?.[grade] || [], [grade, selectedSubjectId]);
  const kazanımlar = useMemo(() => {
    if (!ogrenmeAlani) return [];
    const alan = ogrenmeAlanlari.find(oa => oa.name === ogrenmeAlani);
    return alan?.altKonular.flatMap(ak => ak.kazanımlar) || [];
  }, [ogrenmeAlani, ogrenmeAlanlari]);

  const selectedDocument = useMemo(() => 
    documentLibrary.find(doc => doc.id === selectedDocumentId),
  [documentLibrary, selectedDocumentId]);
  
  const paragraphSkills = {
    'main-idea': 'Ana Fikir / Konu',
    'supporting-idea': 'Yardımcı Fikir',
    'inference': 'Çıkarım Yapma',
    'vocabulary': 'Sözcük Anlamı',
    'author-purpose': 'Yazarın Amacı / Tutumu',
    'negative-question': 'Değinilmemiştir / Çıkarılamaz',
    'structure-completion': 'Paragraf Tamamlama',
    'structure-flow': 'Anlatım Akışını Bozan Cümle',
    'structure-division': 'Paragrafı İkiye Bölme'
  };


  useEffect(() => {
    if (ogrenmeAlanlari.length > 0) {
      setOgrenmeAlani(ogrenmeAlanlari[0].name);
    } else {
      setOgrenmeAlani('');
    }
  }, [ogrenmeAlanlari]);

  useEffect(() => {
    if (kazanımlar.length > 0) {
      setKazanımId(kazanımlar[0].id);
    } else {
      setKazanımId('');
    }
  }, [kazanımlar]);
  
  const handleGenerate = async () => {
    const kazanımText = kazanımlar.find(k => k.id === kazanımId)?.text || '';
    if ((generationContext === 'default' && !kazanımId) || (generationContext === 'pdf-topic' && (!selectedDocument || !selectedTopic))) {
      setError('Lütfen gerekli tüm alanları seçin.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
        const generatedQuestionsRaw = await generateQuestionWithAI(
            grade,
            generationContext === 'pdf-topic' ? `${selectedDocumentId}-${selectedTopic.replace(/\s/g, '_')}` : kazanımId,
            generationContext === 'pdf-topic' ? selectedTopic : kazanımText,
            difficulty,
            questionType,
            questionCount,
            selectedSubjectId,
            selectedSubjectId === 'paragraph' ? paragraphSkill : '',
            shouldGenerateImage,
            generationContext === 'pdf-topic' ? selectedDocument?.content : undefined,
            generationContext,
        );

        const newQuestionsWithImages = await Promise.all(
            generatedQuestionsRaw.map(async (q, index) => {
                let imageUrl: string | undefined = undefined;
                if (q.visualPrompt) {
                    const generatedImageBase64 = await generateImageForQuestion(q.visualPrompt);
                    if (generatedImageBase64) {
                        imageUrl = generatedImageBase64;
                    }
                }
                const baseQuestionData = {
                    ...q,
                    id: Date.now() + index,
                    grade: grade,
                    topic: ogrenmeAlani,
                    difficulty: difficulty,
                    type: questionType,
                    imageUrl: imageUrl,
                    kazanımId: kazanımId, // Ensure kazanımId from the form is used
                    subjectId: selectedSubjectId,
                };
                
                // This is a type guard for narrowing
                if (questionType === 'quiz') return { ...baseQuestionData, type: 'quiz' } as Question;
                if (questionType === 'fill-in') return { ...baseQuestionData, type: 'fill-in' } as Question;
                if (questionType === 'matching') return { ...baseQuestionData, type: 'matching' } as Question;
                return baseQuestionData as Question; // Fallback
            })
        );
        setQuestions(prev => [...newQuestionsWithImages, ...prev]);
    } catch (err: any) {
        setError(err.message || 'Soru üretilirken bir hata oluştu.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h3 className="text-xl font-bold text-indigo-300">AI ile Yeni Soru Üret</h3>
      <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-indigo-500/30">
        
        <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="context" value="default" checked={generationContext === 'default'} onChange={() => setGenerationContext('default')} className="form-radio text-indigo-500" />
                <span>Müfredattan</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="context" value="pdf-topic" checked={generationContext === 'pdf-topic'} onChange={() => setGenerationContext('pdf-topic')} className="form-radio text-indigo-500" />
                <span>Kütüphaneden (PDF)</span>
            </label>
        </div>

        {generationContext === 'default' ? (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select value={grade} onChange={e => setGrade(parseInt(e.target.value))}>
                        {[5, 6, 7, 8].map(g => <option key={g} value={g}>{g}. Sınıf</option>)}
                    </Select>
                    <Select value={ogrenmeAlani} onChange={e => setOgrenmeAlani(e.target.value)}>
                        <option value="">Öğrenme Alanı Seçin</option>
                        {ogrenmeAlanlari.map(oa => <option key={oa.name} value={oa.name}>{oa.name}</option>)}
                    </Select>
                </div>
                <Select value={kazanımId} onChange={e => setKazanımId(e.target.value)} disabled={!ogrenmeAlani}>
                    <option value="">Kazanım Seçin</option>
                    {kazanımlar.map(k => <option key={k.id} value={k.id}>{k.id} - {k.text}</option>)}
                </Select>
            </>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select value={selectedDocumentId} onChange={e => setSelectedDocumentId(e.target.value)}>
                    <option value="">Döküman Seçin</option>
                    {documentLibrary.filter(d => d.content.mimeType === 'application/pdf').map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
                <Select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)} disabled={!selectedDocument}>
                    <option value="">Konu Seçin</option>
                    {selectedDocument?.topics.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
            </div>
        )}

        {selectedSubjectId === 'paragraph' && (
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 block">Paragraf Soru Tipi</label>
                <Select value={paragraphSkill} onChange={e => setParagraphSkill(e.target.value)}>
                    {Object.entries(paragraphSkills).map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                    ))}
                </Select>
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}>
            <option value="kolay">Kolay</option>
            <option value="orta">Orta</option>
            <option value="zor">Zor</option>
          </Select>
          <Select value={questionType} onChange={e => setQuestionType(e.target.value as QuestionType)}>
            <option value="quiz">Çoktan Seçmeli</option>
            <option value="fill-in">Boşluk Doldurma</option>
            <option value="matching">Eşleştirme</option>
          </Select>
          <Select value={questionCount} onChange={e => setQuestionCount(parseInt(e.target.value))}>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Soru</option>)}
          </Select>
        </div>
        <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
          <input
            type="checkbox"
            checked={shouldGenerateImage}
            onChange={e => setShouldGenerateImage(e.target.checked)}
            className="form-checkbox h-5 w-5 text-indigo-600 bg-slate-700 border-slate-500 rounded focus:ring-indigo-500"
          />
          <span>AI ile Görsel Oluşturulsun mu? (Yalnızca Çoktan Seçmeli)</span>
        </label>
        <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
          {isLoading ? 'Sorular Üretiliyor...' : '✨ AI ile Soru Üret'}
        </Button>
        {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
};

const QuestionLibrary: React.FC<{
    questions: Question[];
    setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
    onSelectQuestion: (question: Question) => void;
}> = ({ questions, setQuestions, onSelectQuestion }) => {
    const [filter, setFilter] = useState<Partial<GameSettings>>({});
    
    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            return (!filter.grade || q.grade === filter.grade) &&
                   (!filter.topic || q.topic === filter.topic) &&
                   (!filter.kazanımId || q.kazanımId === filter.kazanımId) &&
                   (!filter.difficulty || q.difficulty === filter.difficulty) &&
                   (!filter.gameMode || q.type === filter.gameMode);
        });
    }, [questions, filter]);

    const deleteQuestion = (id: number) => {
        setQuestions(prev => prev.filter(q => q.id !== id));
    };

    return (
        <div className="p-4 sm:p-6 space-y-4">
            <h3 className="text-xl font-bold text-emerald-300">Soru Bankası ({filteredQuestions.length} / {questions.length})</h3>
            {/* TODO: Add filter controls */}
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                {filteredQuestions.length > 0 ? filteredQuestions.map(q => (
                    <div key={q.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <p className="font-semibold text-slate-200 mb-2">
                            {q.type === 'quiz' ? q.question.split('\n\n').slice(-1)[0] : q.type === 'fill-in' ? q.sentence : q.question || 'Eşleştirme Sorusu'}
                        </p>
                        <div className="text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1 mb-3">
                            <span>Sınıf: {q.grade}</span>
                            <span>Zorluk: {q.difficulty}</span>
                            <span>Tip: {q.type}</span>
                            <span>Kazanım: {q.kazanımId}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => onSelectQuestion(q)} variant="success" className="text-sm px-3 py-1">Test Et</Button>
                            <Button onClick={() => deleteQuestion(q.id)} variant="secondary" className="text-sm px-3 py-1">Sil</Button>
                        </div>
                    </div>
                )) : (
                    <p className="text-slate-400 text-center py-8">Soru bankasında soru bulunmuyor veya filtrelere uyan soru yok.</p>
                )}
            </div>
        </div>
    );
};

const DocumentManager: React.FC<{
    documentLibrary: DocumentLibraryItem[];
    setDocumentLibrary: React.Dispatch<React.SetStateAction<DocumentLibraryItem[]>>;
    setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
    selectedSubjectId: string;
}> = ({ documentLibrary, setDocumentLibrary, setQuestions, selectedSubjectId }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError('');

        try {
            const base64Data = await fileToBase64(file);
            const mimeType = file.type;
            
            if (mimeType.startsWith('image/')) {
                const extractedQuestions = await extractQuestionFromImage({ mimeType, data: base64Data });
                const newQuestions = extractedQuestions.map((q, i) => ({
                    ...q,
                    id: Date.now() + i,
                    grade: 0, // Should be set by user
                    topic: 'Görselden Aktarılan',
                    type: 'quiz',
                    kazanımId: 'N/A',
                    subjectId: selectedSubjectId,
                } as QuizQuestion));
                setQuestions(prev => [...newQuestions, ...prev]);

            } else if (mimeType === 'application/pdf') {
                const topics = await extractTopicsFromPDF({ mimeType, data: base64Data });
                const newDoc: DocumentLibraryItem = {
                    id: `doc-${Date.now()}`,
                    name: file.name,
                    content: { mimeType, data: base64Data },
                    topics: topics
                };
                setDocumentLibrary(prev => [newDoc, ...prev]);
            } else {
                throw new Error('Desteklenmeyen dosya türü. Lütfen resim veya PDF yükleyin.');
            }

        } catch (err: any) {
            setError(err.message || 'Dosya işlenirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    const deleteDocument = (id: string) => {
        setDocumentLibrary(prev => prev.filter(doc => doc.id !== id));
    };

    const exportLibrary = () => {
        const dataStr = JSON.stringify(documentLibrary);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'kaynak-kutuphanem.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const importLibraryInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        importLibraryInputRef.current?.click();
    };

    const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("Dosya okunamadı");
                const importedLibrary = JSON.parse(text);
                // TODO: Add validation for the imported data structure
                if (Array.isArray(importedLibrary)) {
                    setDocumentLibrary(importedLibrary);
                } else {
                    throw new Error("Geçersiz dosya formatı.");
                }
            } catch (err) {
                setError("Kütüphane içe aktarılırken hata oluştu: " + (err as Error).message);
            }
        };
        reader.readAsText(file);
    };


    return (
        <div className="p-4 sm:p-6 space-y-4">
            <h3 className="text-xl font-bold text-rose-300">Kaynak Kütüphanem</h3>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-rose-500/30">
                <p className="text-sm text-slate-400 mb-2">
                    Soru bankasına soru aktarmak için resim (JPG, PNG) veya soru üretmek için kaynak olarak kullanmak üzere PDF dosyası yükleyin.
                </p>
                <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} ref={fileInputRef} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 block w-full text-sm text-slate-400" />
                {isLoading && <p className="text-center mt-4 text-rose-300">Dosya işleniyor, lütfen bekleyin...</p>}
                {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
            </div>
            
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
                 <h4 className="text-lg font-semibold text-rose-200">Döküman Kütüphanesi</h4>
                 <div className="sm:ml-auto flex gap-2">
                     <Button onClick={handleImportClick} variant="success" className="text-sm px-3 py-1">İçe Aktar</Button>
                     <Button onClick={exportLibrary} variant="primary" className="text-sm px-3 py-1" disabled={documentLibrary.length === 0}>Dışa Aktar</Button>
                     <input type="file" accept=".json" ref={importLibraryInputRef} onChange={handleImportFile} className="hidden" />
                 </div>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                {documentLibrary.length > 0 ? documentLibrary.map(doc => (
                    <div key={doc.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                         <div className="flex justify-between items-start">
                             <div>
                                <p className="font-semibold text-slate-200">{doc.name}</p>
                                <p className="text-xs text-slate-400">Çıkarılan Konu Sayısı: {doc.topics.length}</p>
                             </div>
                             <Button onClick={() => deleteDocument(doc.id)} variant="secondary" className="text-xs px-2 py-1 flex-shrink-0">Sil</Button>
                         </div>
                    </div>
                )) : (
                    <p className="text-slate-400 text-center py-4">Henüz bir döküman yüklenmedi.</p>
                )}
            </div>
        </div>
    );
};

const Tools: React.FC<{ onResetSolvedQuestions: () => void; onClearAllData: () => void; selectedSubjectId: string; }> = ({ onResetSolvedQuestions, onClearAllData, selectedSubjectId }) => {
    const [showClearSolvedModal, setShowClearSolvedModal] = useState(false);
    const [showClearAllModal, setShowClearAllModal] = useState(false);

    return (
        <>
            <div className="p-4 sm:p-6 space-y-6">
                <PromptTemplateGenerator selectedSubjectId={selectedSubjectId} />

                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-yellow-300 border-t border-slate-700 pt-6">Veri Yönetimi</h3>
                    <p className="text-slate-400">
                        Uygulama verilerini yönetin. Bu işlemler geri alınamaz.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button onClick={() => setShowClearSolvedModal(true)} variant="warning">
                            Çözülmüş Soruları Sıırla
                        </Button>
                        <Button onClick={() => setShowClearAllModal(true)} variant="secondary">
                            Tüm Verileri Sil
                        </Button>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={showClearSolvedModal}
                title="Çözülmüş Soruları Sıfırla"
                message="Daha önce çözdüğünüz tüm soruların 'çözüldü' işaretini kaldırmak istediğinizden emin misiniz? Bu, aynı sorularla tekrar oynamanıza olanak tanır."
                onConfirm={() => { onResetSolvedQuestions(); setShowClearSolvedModal(false); }}
                onCancel={() => setShowClearSolvedModal(false)}
            />
            <Modal
                isOpen={showClearAllModal}
                title="Tüm Verileri Sil"
                message="DİKKAT! Bu işlem, ürettiğiniz tüm soruları, yüksek skorları ve çözülmüş soru kayıtlarını kalıcı olarak silecektir. Emin misiniz?"
                onConfirm={() => { onClearAllData(); setShowClearAllModal(false); }}
                onCancel={() => setShowClearAllModal(false)}
            />
        </>
    );
};

const ExamGenerator: React.FC<{
    generatedExams: Exam[];
    setGeneratedExams: React.Dispatch<React.SetStateAction<Exam[]>>;
    selectedSubjectId: string;
    documentLibrary: DocumentLibraryItem[];
}> = ({ generatedExams, setGeneratedExams, selectedSubjectId, documentLibrary }) => {
    const [grade, setGrade] = useState<number>(8);
    const [selectedKazanims, setSelectedKazanims] = useState<Map<string, { text: string; count: number }>>(new Map());
    const [expandedOgrenmeAlani, setExpandedOgrenmeAlani] = useState<string | null>(null);
    
    const [sourceDocumentIds, setSourceDocumentIds] = useState<string[]>([]);
    const [referenceExamFile, setReferenceExamFile] = useState<File | null>(null);
    const referenceFileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedExamId, setExpandedExamId] = useState<number | null>(null);
    const [copyStatus, setCopyStatus] = useState<{ id: number | null, text: string }>({ id: null, text: 'Panoya Kopyala' });
    const [improvingExamId, setImprovingExamId] = useState<number | null>(null);
    const [visibleAnswerKeyId, setVisibleAnswerKeyId] = useState<number | null>(null);
    const [answerKeyCopyStatus, setAnswerKeyCopyStatus] = useState<{ id: number | null, text: string }>({ id: null, text: 'Anahtarı Kopyala' });


    const ogrenmeAlanlari = useMemo(() => curriculumData[selectedSubjectId]?.[grade] || [], [grade, selectedSubjectId]);

    useEffect(() => {
        setSelectedKazanims(new Map());
        setExpandedOgrenmeAlani(ogrenmeAlanlari.length > 0 ? ogrenmeAlanlari[0].name : null);
    }, [grade, selectedSubjectId, ogrenmeAlanlari]);

    const handleKazanımToggle = (kazanım: { id: string; text: string }) => {
        setSelectedKazanims(prev => {
            const newMap = new Map(prev);
            if (newMap.has(kazanım.id)) {
                newMap.delete(kazanım.id);
            } else {
                newMap.set(kazanım.id, { text: kazanım.text, count: 1 });
            }
            return newMap;
        });
    };

    const handleCountChange = (id: string, count: number) => {
        const newCount = Math.max(1, count);
        setSelectedKazanims(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(id);
            if (current) {
                newMap.set(id, { ...current, count: newCount });
            }
            return newMap;
        });
    };

    const handleReferenceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setReferenceExamFile(file || null);
    };

    const handleSourceDocumentToggle = (docId: string) => {
        setSourceDocumentIds(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        );
    };
    
    const handleGenerateExam = async () => {
        if (selectedKazanims.size === 0) {
            setError('Lütfen en az bir kazanım seçin.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const selections = Array.from(selectedKazanims.entries()).map(([id, data]) => ({
                id,
                text: data.text,
                count: data.count,
            }));
            
            const subjectNameMap: Record<string, string> = {
                'social-studies': 'Sosyal Bilgiler',
                'math': 'Matematik',
                'science': 'Fen Bilimleri',
                'turkish': 'Türkçe',
                'english': 'İngilizce',
                'paragraph': 'Paragraf',
            };
            const currentSubjectName = subjectNameMap[selectedSubjectId] || 'Ders';

            let referenceExamDoc: { mimeType: string; data: string } | undefined = undefined;
            if (referenceExamFile) {
                 if (referenceExamFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    const arrayBuffer = await referenceExamFile.arrayBuffer();
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    referenceExamDoc = { mimeType: 'text/plain', data: result.value };
                } else if (referenceExamFile.type === 'application/pdf') {
                    const base64Data = await fileToBase64(referenceExamFile);
                    referenceExamDoc = { mimeType: referenceExamFile.type, data: base64Data };
                } else {
                    setError(`Desteklenmeyen referans dosya türü: ${referenceExamFile.type}. Lütfen PDF veya DOCX kullanın.`);
                    setIsLoading(false);
                    return;
                }
            }

            const sourceContentDocs = documentLibrary
                .filter(doc => sourceDocumentIds.includes(doc.id))
                .map(doc => ({ name: doc.name, content: doc.content }));

            const { examContent, answerKeyContent } = await generateExamFromKazanims(
                grade, 
                currentSubjectName, 
                selections,
                referenceExamDoc,
                sourceContentDocs.length > 0 ? sourceContentDocs : undefined
            );
            const examName = examContent.split('\n').find(line => line.trim() !== '')?.replace(/#/g, '').trim() || `Yeni Yazılı - ${new Date().toLocaleDateString()}`;

            const newExam: Exam = {
                id: Date.now(),
                name: examName,
                content: examContent,
                createdAt: Date.now(),
                answerKey: answerKeyContent,
            };

            // FIX: Spreading `prevExams` can cause a runtime error if the data from localStorage is corrupted and not an array. Added a guard to ensure we are always spreading an array.
            setGeneratedExams(prevExams => [newExam, ...(Array.isArray(prevExams) ? prevExams : [])]);
            setSelectedKazanims(new Map());
            setReferenceExamFile(null);
            if(referenceFileInputRef.current) referenceFileInputRef.current.value = "";
            setSourceDocumentIds([]);

        } catch (err: any) {
            setError(err.message || 'Yazılı kağıdı üretilirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyExam = (exam: Exam) => {
        const cleanMarkdown = exam.content.replace(/<!-- FONT_INFO: (.*) -->\s*/, '');
        navigator.clipboard.writeText(cleanMarkdown).then(() => {
            setCopyStatus({ id: exam.id, text: '✅ Kopyalandı!' });
            setTimeout(() => setCopyStatus({ id: null, text: 'Panoya Kopyala' }), 2500);
        }).catch(err => {
            setError('Metin kopyalanamadı. Lütfen manuel olarak kopyalayın.');
            console.error('Kopyalama hatası:', err);
        });
    };
    
    const handleCopyAnswerKey = (exam: Exam) => {
        if (!exam.answerKey) return;
        navigator.clipboard.writeText(exam.answerKey).then(() => {
            setAnswerKeyCopyStatus({ id: exam.id, text: '✅ Kopyalandı!' });
            setTimeout(() => setAnswerKeyCopyStatus({ id: null, text: 'Anahtarı Kopyala' }), 2500);
        }).catch(err => {
            setError('Cevap anahtarı kopyalanamadı.');
        });
    };

    const handleDeleteExam = (idToDelete: number) => {
        setGeneratedExams(prevExams => (Array.isArray(prevExams) ? prevExams : []).filter(exam => exam.id !== idToDelete));
    };

    const handleImproveExam = async (examToImprove: Exam) => {
        if (improvingExamId) return; // Prevent multiple requests
        setImprovingExamId(examToImprove.id);
        setError('');
        try {
            const feedback = await improveGeneratedExam(examToImprove.content);
            setGeneratedExams(prevExams => 
                (Array.isArray(prevExams) ? prevExams : []).map(exam => {
                    if (exam.id === examToImprove.id) {
                        return { ...exam, feedback };
                    }
                    return exam;
                })
            );
        } catch (err: any) {
            setError(err.message || 'Yazılı iyileştirilirken bir hata oluştu.');
        } finally {
            setImprovingExamId(null);
        }
    };
    
    return (
        <div className="p-4 sm:p-6 space-y-4">
            <h3 className="text-xl font-bold text-cyan-300">Yazılı Kağıdı Asistanı</h3>
            <div className="bg-slate-900/50 p-6 rounded-xl border border-cyan-500/30 space-y-4 animate-fadeIn">
                <h4 className="text-lg font-semibold text-cyan-200 mb-2">1. Adım: Temel Bilgileri Belirleyin</h4>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Sınıf Seviyesi</label>
                    <Select value={grade} onChange={e => setGrade(parseInt(e.target.value))}>
                        {[5, 6, 7, 8].map(g => <option key={g} value={g}>{g}. Sınıf</option>)}
                    </Select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Kazanımlar (Açık Uçlu Soru)</label>
                    <div className="max-h-60 overflow-y-auto space-y-1 bg-slate-800 border border-slate-700 rounded-lg p-2">
                        {ogrenmeAlanlari.map(oa => (
                            <div key={oa.name}>
                                <button 
                                    onClick={() => setExpandedOgrenmeAlani(expandedOgrenmeAlani === oa.name ? null : oa.name)}
                                    className="w-full text-left p-2 font-semibold bg-slate-700/50 rounded-md hover:bg-slate-700"
                                >
                                    {oa.name}
                                </button>
                                {expandedOgrenmeAlani === oa.name && (
                                    <div className="pl-4 pt-2 space-y-2">
                                        {oa.altKonular.flatMap(ak => ak.kazanımlar).map(kazanım => (
                                            <div key={kazanım.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-slate-900/40">
                                                <label className="flex items-start gap-3 cursor-pointer flex-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedKazanims.has(kazanım.id)}
                                                        onChange={() => handleKazanımToggle(kazanım)}
                                                        className="mt-1 form-checkbox h-5 w-5 text-cyan-600 bg-slate-700 border-slate-500 rounded focus:ring-cyan-500"
                                                    />
                                                    <span className="text-sm text-slate-300">{kazanım.id} - {kazanım.text}</span>
                                                </label>
                                                {selectedKazanims.has(kazanım.id) && (
                                                    <div className="flex items-center gap-2">
                                                        <label htmlFor={`count-${kazanım.id}`} className="text-xs text-slate-400">Soru:</label>
                                                        <input
                                                            id={`count-${kazanım.id}`}
                                                            type="number"
                                                            min="1"
                                                            value={selectedKazanims.get(kazanım.id)?.count || 1}
                                                            onChange={(e) => handleCountChange(kazanım.id, parseInt(e.target.value))}
                                                            className="w-16 p-1 text-center bg-slate-700 border border-slate-600 rounded-md text-white"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <h4 className="text-lg font-semibold text-cyan-200 pt-4 mb-2">2. Adım: Gelişmiş Ayarlar (İsteğe Bağlı)</h4>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">İçerik için Bilgi Kaynağı Seçin (Çoklu Seçim)</label>
                        <div className="max-h-40 overflow-y-auto space-y-2 bg-slate-800 border border-slate-700 rounded-lg p-3">
                            {documentLibrary.filter(d => d.content.mimeType === 'application/pdf').length > 0 ? (
                                documentLibrary.filter(d => d.content.mimeType === 'application/pdf').map(doc => (
                                    <label key={doc.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-slate-700/50">
                                        <input
                                            type="checkbox"
                                            checked={sourceDocumentIds.includes(doc.id)}
                                            onChange={() => handleSourceDocumentToggle(doc.id)}
                                            className="form-checkbox h-5 w-5 text-cyan-600 bg-slate-700 border-slate-500 rounded focus:ring-cyan-500"
                                        />
                                        <span className="text-sm text-slate-300">{doc.name}</span>
                                        {!doc.content.data && (
                                            <span className="ml-2 text-xs text-yellow-500" title="Sayfa yenilendiğinde bu dosyanın içeriği kaybolur. Tekrar kullanmak için yeniden yüklemeniz gerekebilir.">(Oturuma Özel)</span>
                                        )}
                                    </label>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 text-center py-2">Kaynak olarak kullanılabilecek PDF bulunmuyor.</p>
                            )}
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Stil ve Format için Referans Yazılı Yükleyin</label>
                        <input 
                            type="file" 
                            ref={referenceFileInputRef} 
                            onChange={handleReferenceFileChange} 
                            accept=".pdf, .docx, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 block w-full text-sm text-slate-400" 
                        />
                        {referenceExamFile && <p className="text-xs text-green-400 mt-1">Yüklendi: {referenceExamFile.name}</p>}
                    </div>
                </div>
                
                {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                
                <Button 
                    onClick={handleGenerateExam} 
                    disabled={selectedKazanims.size === 0 || isLoading} 
                    className="w-full mt-4"
                >
                    {isLoading ? 'Yazılı Oluşturuluyor...' : '✍️ AI ile Yeni Yazılı Oluştur'}
                </Button>
            </div>

            <div className="mt-8">
                <h3 className="text-xl font-bold text-green-300 mb-4">Kaydedilmiş Yazılılar</h3>
                <div className="space-y-2">
                    {generatedExams.length > 0 ? (
                        generatedExams.map(exam => (
                            <div key={exam.id} className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                                <button 
                                    onClick={() => setExpandedExamId(expandedExamId === exam.id ? null : exam.id)}
                                    className="w-full text-left p-4 hover:bg-slate-700/50 transition-colors flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-100">{exam.name}</p>
                                        <p className="text-xs text-slate-400">{new Date(exam.createdAt).toLocaleString('tr-TR')}</p>
                                    </div>
                                    <span className={`transform transition-transform text-2xl ${expandedExamId === exam.id ? 'rotate-180' : ''}`}>▼</span>
                                </button>
                                {expandedExamId === exam.id && (
                                    <div className="p-4 border-t border-slate-700 animate-fadeIn">
                                        <div className="p-4 border border-slate-600 rounded-md bg-slate-800 min-h-[200px] max-h-[50vh] overflow-y-auto text-slate-300 whitespace-pre-wrap font-sans">
                                            {exam.content.replace(/<!-- FONT_INFO: (.*) -->\s*/, '')}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                            <Button onClick={() => handleDeleteExam(exam.id)} variant="secondary" className="w-full text-base py-2">
                                                Sil
                                            </Button>
                                            <Button onClick={() => handleCopyExam(exam)} variant="success" className="w-full text-base py-2">
                                                {copyStatus.id === exam.id ? copyStatus.text : 'Panoya Kopyala'}
                                            </Button>
                                             {exam.answerKey && (
                                                <Button onClick={() => setVisibleAnswerKeyId(prev => prev === exam.id ? null : exam.id)} variant="primary" className="w-full text-base py-2 bg-sky-600 hover:bg-sky-500">
                                                    🔑 Cevap Anahtarı
                                                </Button>
                                            )}
                                            <Button 
                                                onClick={() => handleImproveExam(exam)} 
                                                variant="primary" 
                                                className="w-full text-base py-2"
                                                disabled={!!exam.feedback || improvingExamId !== null}
                                            >
                                                {improvingExamId === exam.id ? 'İnceleniyor...' : (exam.feedback ? '✅ Rapor Hazır' : '✨ İyileştirme Önerileri Al')}
                                            </Button>
                                        </div>

                                        {visibleAnswerKeyId === exam.id && exam.answerKey && (
                                            <div className="mt-4 p-4 bg-slate-900/40 border border-slate-600/80 rounded-lg animate-fadeIn">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="font-bold text-lg text-slate-200">🔑 Cevap Anahtarı</h4>
                                                    <Button onClick={() => handleCopyAnswerKey(exam)} variant="success" className="text-xs px-3 py-1">
                                                        {answerKeyCopyStatus.id === exam.id ? answerKeyCopyStatus.text : 'Anahtarı Kopyala'}
                                                    </Button>
                                                </div>
                                                <div className="text-slate-300 whitespace-pre-wrap font-sans text-sm leading-relaxed p-2 border border-slate-700 rounded bg-slate-800 max-h-60 overflow-y-auto">
                                                    {exam.answerKey}
                                                </div>
                                            </div>
                                        )}

                                        {exam.feedback && (
                                            <div className="mt-4 p-4 bg-indigo-900/30 border border-indigo-500/50 rounded-lg animate-fadeIn">
                                                <h4 className="font-bold text-lg text-indigo-200 mb-2">🤖 AI İyileştirme Asistanı Raporu</h4>
                                                <div className="text-slate-300 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                                    {exam.feedback}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-400 text-center py-6">Henüz oluşturulmuş bir yazılı yok.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export const TeacherPanel: React.FC<TeacherPanelProps> = ({
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
        // New questions have subjectId, which is the most reliable filter
        if (q.subjectId) {
            return q.subjectId === selectedSubjectId;
        }
        // Fallback for older data without subjectId, infer from kazanımId prefix
        if (q.kazanımId) {
            return prefixes.some(prefix => q.kazanımId.startsWith(prefix));
        }
        // Questions from old image imports without a kazanımId or subjectId won't be shown
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