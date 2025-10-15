import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { DocumentLibraryItem, Exam } from '../../types';
import type { OgrenmeAlani } from '../../data/curriculum';
import { generateExamFromKazanims, improveGeneratedExam } from '../../services/geminiService';
import { getCurriculumData } from '../../services/curriculumService';
import { Button } from '../UI';

declare const mammoth: any;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
  
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, className, ...props }) => (
  <select
    className={`p-2 bg-slate-800 rounded-md border border-slate-600 w-full disabled:opacity-50 text-white ${className}`}
    {...props}
  >
    {children}
  </select>
);

export const ExamGenerator: React.FC<{
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

            setGeneratedExams(prevExams => {
                const existingExams = Array.isArray(prevExams) ? prevExams : [];
                return [newExam, ...existingExams];
            });
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
        setGeneratedExams(prevExams => (Array.isArray(prevExams) ? prevExams : []).filter(exam => exam && exam.id !== idToDelete));
    };

    const handleImproveExam = async (examToImprove: Exam) => {
        if (improvingExamId) return;
        setImprovingExamId(examToImprove.id);
        setError('');
        try {
            const feedback = await improveGeneratedExam(examToImprove.content);
            setGeneratedExams(prevExams => 
                (Array.isArray(prevExams) ? prevExams : []).map(exam => {
                    if (exam && exam.id === examToImprove.id) {
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
    
    if (isCurriculumLoading) {
      return <div className="p-6 text-center">Müfredat verisi yükleniyor...</div>;
    }

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
