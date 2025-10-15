import React, { useState, useMemo, useEffect } from 'react';
import type { Question, Difficulty, QuestionType, DocumentLibraryItem } from '../../types';
import type { OgrenmeAlani } from '../../data/curriculum';
import { generateQuestionWithAI, generateImageForQuestion } from '../../services/geminiService';
import { getCurriculumData } from '../../services/curriculumService';
import { Button } from '../UI';

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, className, ...props }) => (
  <select
    className={`p-2 bg-slate-800 rounded-md border border-slate-600 w-full disabled:opacity-50 text-white ${className}`}
    {...props}
  >
    {children}
  </select>
);

export const QuestionGenerator: React.FC<{
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
  
  const [curriculumForSubject, setCurriculumForSubject] = useState<Record<number, OgrenmeAlani[]>>({});
  const [isCurriculumLoading, setIsCurriculumLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsCurriculumLoading(true);
      const allData = await getCurriculumData();
      setCurriculumForSubject(allData[selectedSubjectId] || {});
      setIsCurriculumLoading(false);
    };
    loadData();
  }, [selectedSubjectId]);

  const ogrenmeAlanlari = useMemo(() => curriculumForSubject[grade] || [], [grade, curriculumForSubject]);
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
                    kazanımId: kazanımId,
                    subjectId: selectedSubjectId,
                };
                
                if (questionType === 'quiz') return { ...baseQuestionData, type: 'quiz' } as Question;
                if (questionType === 'fill-in') return { ...baseQuestionData, type: 'fill-in' } as Question;
                if (questionType === 'matching') return { ...baseQuestionData, type: 'matching' } as Question;
                return baseQuestionData as Question;
            })
        );
        setQuestions(prev => [...newQuestionsWithImages, ...prev]);
    } catch (err: any) {
        setError(err.message || 'Soru üretilirken bir hata oluştu.');
    } finally {
        setIsLoading(false);
    }
  };

  if (isCurriculumLoading) {
    return <div className="p-6 text-center">Müfredat verisi yükleniyor...</div>;
  }

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
