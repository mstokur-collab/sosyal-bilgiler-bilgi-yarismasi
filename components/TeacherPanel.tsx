import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Question, QuestionType, Difficulty, QuizQuestion, FillInQuestion, MatchingQuestion, MatchingPair } from '../types';
import { Button, Modal } from './UI';
import { generateQuestionWithAI, extractQuestionFromImage, generateImageForQuestion } from '../services/geminiService';
import { curriculumData } from '../data/curriculum';

// --- Helper Components ---

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`flex-1 p-3 sm:p-4 font-semibold text-sm sm:text-base transition-colors duration-300 border-b-4 text-center ${active ? 'border-indigo-400 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
        {children}
    </button>
);

const SummaryCard: React.FC<{ value: number | string; label: string }> = ({ value, label }) => (
    <div className="bg-violet-600/80 rounded-xl p-4 text-center flex-grow flex-1 min-w-[160px] shadow-lg">
        <div className="text-4xl font-bold text-white">{value}</div>
        <div className="text-sm text-violet-200 mt-1">{label}</div>
    </div>
);

const cropImage = (
  base64Source: string,
  mimeType: string,
  cropBox: { x: number; y: number; width: number; height: number }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      const sourceX = Math.max(0, img.naturalWidth * cropBox.x);
      const sourceY = Math.max(0, img.naturalHeight * cropBox.y);
      const sourceWidth = Math.min(img.naturalWidth - sourceX, img.naturalWidth * cropBox.width);
      const sourceHeight = Math.min(img.naturalHeight - sourceY, img.naturalHeight * cropBox.height);
      
      if (sourceWidth <= 0 || sourceHeight <= 0) {
        return reject(new Error('Invalid crop dimensions result in zero or negative size.'));
      }

      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sourceWidth,
        sourceHeight
      );

      resolve(canvas.toDataURL(mimeType));
    };
    img.onerror = () => {
      reject(new Error('Failed to load image for cropping.'));
    };
    img.src = `data:${mimeType};base64,${base64Source}`;
  });
};


const AIGenerator: React.FC<{
  onQuestionGenerated: (data: Partial<Question>[]) => void;
  selectedSubjectId: string;
}> = ({ onQuestionGenerated, selectedSubjectId }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Üretiliyor...');
    const [isExtracting, setIsExtracting] = useState(false);
    const [error, setError] = useState('');
    
    const [selectedGrade, setSelectedGrade] = useState(5);
    const [selectedOgrenmeAlani, setSelectedOgrenmeAlani] = useState('');
    const [questionCount, setQuestionCount] = useState(1);
    const [imageData, setImageData] = useState<{ mimeType: string, data: string, previewUrl: string } | null>(null);
    const [shouldGenerateImage, setShouldGenerateImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const [validationModal, setValidationModal] = useState({
      isOpen: false,
      message: '',
      onConfirm: () => {},
      onCancel: () => {},
    });

    const isParagraphMode = selectedSubjectId === 'paragraph';

    const ogrenmeAlanlari = useMemo(() => curriculumData[selectedSubjectId]?.[selectedGrade] || [], [selectedGrade, selectedSubjectId]);
    
    const kazanımlar = useMemo(() => {
        if (!selectedOgrenmeAlani) return [];
        const ogrenmeAlani = ogrenmeAlanlari.find(oa => oa.name === selectedOgrenmeAlani);
        // FIX: Flatten kazanımlar from all altKonular
        return ogrenmeAlani?.altKonular.flatMap(ak => ak.kazanımlar) || [];
    }, [selectedOgrenmeAlani, ogrenmeAlanlari]);

    useEffect(() => {
        setSelectedOgrenmeAlani('');
    }, [selectedGrade, selectedSubjectId]);
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImageData({
                    // FIX: Provide a fallback MIME type to prevent errors with files that lack type information.
                    mimeType: file.type || 'image/jpeg',
                    data: base64String.split(',')[1], // Remove the "data:mime/type;base64," part
                    previewUrl: base64String
                });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const clearImage = () => {
        setImageData(null);
        if(fileInputRef.current) fileInputRef.current.value = '';
    }

    const getFormData = () => {
        if (!formRef.current) return null;
        const formData = new FormData(formRef.current);
        const grade = parseInt(formData.get('ai-grade') as string);
        const difficulty = formData.get('ai-difficulty') as Difficulty;
        const count = parseInt(formData.get('ai-count') as string, 10);
        const skill = formData.get('ai-skill') as string || 'auto';

        if (isParagraphMode) {
             if (!grade || !difficulty) {
                throw new Error("Lütfen tüm alanları (Sınıf, Zorluk vb.) eksiksiz doldurun.");
            }
            return {
                grade,
                difficulty,
                type: 'quiz' as QuestionType,
                count,
                kazanımObject: { id: `P.${grade}.1`, text: 'Paragraf okuduğunu anlama' },
                ogrenmeAlaniName: 'Paragraf Okuduğunu Anlama',
                skill
            };
        }

        const type = formData.get('ai-type') as QuestionType;
        const kazanımId = formData.get('ai-kazanım') as string;
        const ogrenmeAlaniName = formData.get('ai-ogrenme-alani') as string;

        const selectedOgrenmeAlaniData = curriculumData[selectedSubjectId]?.[grade]?.find(oa => oa.name === ogrenmeAlaniName);
        // FIX: Search for kazanım in all altKonular
        const kazanımObject = selectedOgrenmeAlaniData?.altKonular
            .flatMap(ak => ak.kazanımlar)
            ?.find(k => k.id === kazanımId);

        if (!grade || !difficulty || !type || !kazanımObject || !ogrenmeAlaniName) {
            throw new Error("Lütfen tüm alanları (Sınıf, Öğrenme Alanı, Kazanım vb.) eksiksiz doldurun.");
        }

        return { grade, difficulty, type, count, kazanımObject, ogrenmeAlaniName, skill };
    };


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const formData = getFormData();
            if (!formData) return;
            
            const { grade, difficulty, type, count, kazanımObject, ogrenmeAlaniName, skill } = formData;
            
            setLoadingMessage('Soru metinleri üretiliyor...');
            const generatedData = await generateQuestionWithAI(
                grade, 
                kazanımObject.id, 
                kazanımObject.text, 
                difficulty, 
                type, 
                count, 
                selectedSubjectId,
                skill,
                imageData ? { mimeType: imageData.mimeType, data: imageData.data } : undefined
            );

            const questionsWithImages = await Promise.all(
                generatedData.map(async (q, index) => {
                    const visualPrompt = (q as { visualPrompt?: string }).visualPrompt;
                    let imageUrl: string | null = null;
            
                    if (shouldGenerateImage && !imageData && visualPrompt) {
                        setLoadingMessage(`Bütünleşik Görsel ${index + 1}/${generatedData.length} Üretiliyor...`);
                        try {
                            if (index > 0) {
                                await new Promise(resolve => setTimeout(resolve, 2000));
                            }
                            imageUrl = await generateImageForQuestion(visualPrompt);
                        } catch (err) {
                            const errorMessage = (err as Error).message;
                            console.error(`Görsel ${index + 1} üretilemedi:`, err);
                            setError(`Görsel ${index + 1}/${generatedData.length} üretilirken bir hata oluştu. Hata: ${errorMessage}`);
                            if (errorMessage.includes('429') || errorMessage.includes('Kota Limiti Aşıldı')) {
                                throw new Error(errorMessage);
                            }
                        }
                    }
                    return { ...q, imageUrl: imageUrl || undefined };
                })
            );

            // --- Validation Step & Sanitization ---
            let compliantCount = 0;
            const validatedData = questionsWithImages.map(q => {
                // Sanitize quiz options to handle cases where the AI provides more than 4 options.
                if ((q as QuizQuestion).type === 'quiz' && (q as QuizQuestion).options?.length > 4) {
                    const quizQ = q as QuizQuestion;
                    const correctAnswer = quizQ.answer;
                    
                    // Get all other options (distractors).
                    const distractors = quizQ.options.filter(opt => opt !== correctAnswer);
                    
                    // Create the new options array with the correct answer and the first 3 distractors.
                    const newOptions = [correctAnswer, ...distractors.slice(0, 3)];

                    // Shuffle the new 4-option array to avoid the correct answer always being in the same position.
                    for (let i = newOptions.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [newOptions[i], newOptions[j]] = [newOptions[j], newOptions[i]];
                    }
                    
                    // Update the question object with the sanitized 4-option list.
                    (q as QuizQuestion).options = newOptions;
                }

                // Check if the AI returned the correct learning outcome ID.
                const aiKazanımId = (q as Partial<Question>).kazanımId;
                if (aiKazanımId && aiKazanımId === kazanımObject.id) {
                    compliantCount++;
                    return { ...q, isValidated: true };
                }
                return { ...q, isValidated: false };
            });

            const totalGenerated = validatedData.length;
            const nonCompliantCount = totalGenerated - compliantCount;

            const processAndAddQuestions = (dataToAdd: typeof validatedData) => {
                const questionsWithMetadata = dataToAdd.map(q => ({ 
                    ...q, 
                    grade, 
                    topic: ogrenmeAlaniName, 
                    difficulty, 
                    type, 
                    imageUrl: q.imageUrl || imageData?.previewUrl || undefined, 
                    kazanımId: kazanımObject.id, // Overwrite with the correct one to ensure consistency
                }));
                onQuestionGenerated(questionsWithMetadata);
                clearImage();
            };

            if (nonCompliantCount > 0) {
                setValidationModal({
                    isOpen: true,
                    message: `Yapay zeka tarafından üretilen ${totalGenerated} sorudan ${nonCompliantCount} tanesi, seçilen kazanım ile tam eşleşmiyor olabilir veya kazanım ID'sini eksik döndürdü. Bu soruları yine de eklemek istiyor musunuz? (Eşleşmeyen soruların kazanım ID'si otomatik olarak düzeltilecektir.)`,
                    onConfirm: () => {
                        processAndAddQuestions(validatedData);
                        setValidationModal({ ...validationModal, isOpen: false });
                    },
                    onCancel: () => {
                        setValidationModal({ ...validationModal, isOpen: false });
                    }
                });
            } else {
                processAndAddQuestions(validatedData);
            }

        } catch (err: any) {
            setError(err.message || 'Soru üretilirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('Üretiliyor...');
        }
    };
    
    const handleExtractQuestion = async () => {
        if (!imageData) {
            setError('Lütfen önce bir resim dosyası yükleyin.');
            return;
        }
        setIsExtracting(true);
        setError('');
        try {
            const formData = getFormData();
            if (!formData) return;
            const { grade, kazanımObject, ogrenmeAlaniName } = formData;

            const extractedQuestionsData = await extractQuestionFromImage({ mimeType: imageData.mimeType, data: imageData.data });
            
            if (!extractedQuestionsData || extractedQuestionsData.length === 0) {
                 throw new Error('Görselden herhangi bir soru çıkarılamadı. Lütfen görselin net olduğundan ve soruların standart formatta olduğundan emin olun.');
            }

            const newQuestions: Question[] = await Promise.all(
              extractedQuestionsData.map(async (extractedData, index) => {
                const { visualContext, ...restOfData } = extractedData;
                let questionImageUrl: string | undefined = undefined;

                if (visualContext) {
                    try {
                        questionImageUrl = await cropImage(imageData.data, imageData.mimeType, visualContext);
                    } catch (cropError) {
                        console.error(`Soru #${index + 1} için resim kırpılırken hata oluştu:`, cropError);
                        // Hata durumunda bile devam et, soru resimsiz eklenecek.
                    }
                }
                
                return {
                    id: Date.now() + index,
                    grade,
                    topic: ogrenmeAlaniName,
                    kazanımId: kazanımObject.id,
                    type: 'quiz',
                    imageUrl: questionImageUrl,
                    ...restOfData
                } as Question;
              })
            );
            
            onQuestionGenerated(newQuestions);
            clearImage();

        } catch (err: any) {
             setError(err.message || 'Görselden soru çıkarılırken bir hata oluştu. Lütfen görselin net olduğundan ve doğru cevabın belirgin bir şekilde işaretlendiğinden emin olun.');
        } finally {
            setIsExtracting(false);
        }
    }

    return (
        <div className="p-4 bg-slate-900/50 rounded-xl border border-indigo-500/50 mt-2 sm:mt-6">
            <h3 className="text-xl font-bold text-indigo-300 mb-3">✨ AI ile Soru Üret</h3>
            <p className="text-slate-400 mb-4">{isParagraphMode ? 'Yeni paragraf soruları üretin.' : 'Yeni soru üretin veya cevabı işaretlenmiş bir soru görselini yükleyerek sisteme otomatik aktarın.'}</p>
            <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select name="ai-grade" required value={selectedGrade} onChange={(e) => setSelectedGrade(parseInt(e.target.value))} className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full">
                        <option value="5">5. Sınıf</option>
                        <option value="6">6. Sınıf</option>
                        <option value="7">7. Sınıf</option>
                        <option value="8">8. Sınıf</option>
                    </select>
                    <select name="ai-difficulty" required defaultValue="orta" className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full">
                        <option value="kolay">Kolay</option><option value="orta">Orta</option><option value="zor">Zor</option>
                    </select>
                </div>
                
                {!isParagraphMode && (
                    <>
                        <select name="ai-ogrenme-alani" required value={selectedOgrenmeAlani} onChange={e => setSelectedOgrenmeAlani(e.target.value)} className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full">
                            <option value="">Öğrenme Alanı Seçin</option>
                            {ogrenmeAlanlari.map(oa => <option key={oa.name} value={oa.name}>{oa.name}</option>)}
                        </select>
                    
                        <select name="ai-kazanım" required disabled={!selectedOgrenmeAlani} className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full disabled:opacity-50 disabled:cursor-not-allowed">
                            <option value="">Kazanım Seçin</option>
                            {kazanımlar.map(k => <option key={k.id} value={k.id}>{k.id} - {k.text}</option>)}
                        </select>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <select name="ai-type" required defaultValue="quiz" className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full">
                                <option value="quiz">Çoktan Seçmeli</option><option value="fill-in">Boşluk Doldurma</option><option value="matching">Eşleştirme</option>
                            </select>
                            <select name="ai-count" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))} className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full">
                                <option value="1">1 Soru</option><option value="3">3 Soru</option><option value="5">5 Soru</option><option value="10">10 Soru</option>
                            </select>
                        </div>
                    </>
                )}

                {isParagraphMode && (
                    <>
                        <select name="ai-skill" defaultValue="auto" className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full">
                            <option value="auto">Ölçülecek Anlama Becerisi (AI Karar Versin)</option>
                            <option value="main-idea">Ana Fikir / Konu</option>
                            <option value="supporting-idea">Yardımcı Fikir</option>
                            <option value="inference">Metinden Çıkarım Yapma</option>
                            <option value="vocabulary">Sözcük Anlamı</option>
                            <option value="author-purpose">Yazarın Amacı / Tutumu</option>
                        </select>
                        <select name="ai-count" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))} className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full">
                            <option value="1">1 Soru</option>
                            <option value="3">3 Soru</option>
                            <option value="5">5 Soru</option>
                            <option value="10">10 Soru</option>
                        </select>
                    </>
                )}

                
                {!isParagraphMode && (
                    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 space-y-3">
                        <label className="block text-slate-300 font-semibold">Görsel Seçenekleri</label>
                        {imageData ? (
                            <div className="relative w-full sm:w-1/2 mx-auto">
                                <img src={imageData.previewUrl} alt="Yüklenen görsel" className="w-full max-h-48 object-contain rounded-lg border border-slate-600 bg-slate-900/50 p-1"/>
                                <button onClick={clearImage} title="Resmi Kaldır" className="absolute -top-2 -right-2 bg-red-600/80 hover:bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm transition-transform hover:scale-110">×</button>
                            </div>
                        ) : (
                             <Button type="button" onClick={() => fileInputRef.current?.click()} className="text-base px-4 py-2 w-full">
                                🖼️ Bilgisayardan Seç (Soru Aktarmak İçin)
                             </Button>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg, image/webp" className="hidden" />
                        
                        <div className="flex items-center justify-center p-2 rounded-md bg-indigo-900/30">
                            <input
                                type="checkbox"
                                id="generate-image-checkbox"
                                checked={shouldGenerateImage}
                                onChange={(e) => setShouldGenerateImage(e.target.checked)}
                                disabled={!!imageData}
                                className="w-5 h-5 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="generate-image-checkbox" className="ml-2 text-sm font-medium text-slate-200">
                                Bu soruya görsel de üretilsin (Beta)
                            </label>
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <Button type="submit" disabled={isLoading || isExtracting} className="w-full text-base py-2.5">
                        {isLoading ? loadingMessage : `🤖 ${questionCount} Soru Üret`}
                    </Button>
                    <Button type="button" onClick={handleExtractQuestion} disabled={isLoading || isExtracting || !imageData || isParagraphMode} variant="success" className="w-full text-base py-2.5">
                        {isExtracting ? 'Aktarılıyor...' : '📷 Görseldeki Soruları Aktar'}
                    </Button>
                </div>
                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </form>
            <Modal
                isOpen={validationModal.isOpen}
                title="Kazanım Uyum Uyarısı"
                message={validationModal.message}
                onConfirm={validationModal.onConfirm}
                onCancel={validationModal.onCancel}
            />
        </div>
    );
};

const ManualQuestionForm: React.FC<{ onAddQuestion: (q: Question) => void }> = ({ onAddQuestion }) => {
    const initialFormState = {
        grade: 5, topic: '', difficulty: 'orta' as Difficulty, type: 'quiz' as QuestionType, imageUrl: '',
        question: '', options: ['', '', '', ''], answer: '',
        sentence: '', distractors: ['', ''],
        pairs: [{ term: '', definition: '' }, { term: '', definition: '' }],
    };
    const [form, setForm] = useState(initialFormState);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: name === 'grade' ? parseInt(value) : value }));
    };
    
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...form.options];
        newOptions[index] = value;
        setForm(prev => ({ ...prev, options: newOptions }));
    };
    
    const handlePairChange = (index: number, field: keyof MatchingPair, value: string) => {
      const newPairs = [...form.pairs];
      newPairs[index] = { ...newPairs[index], [field]: value };
      setForm(prev => ({ ...prev, pairs: newPairs }));
    };

    const addPair = () => setForm(prev => ({ ...prev, pairs: [...prev.pairs, { term: '', definition: '' }]}));
    const removePair = (index: number) => setForm(prev => ({ ...prev, pairs: form.pairs.filter((_, i) => i !== index)}));

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setForm(prev => ({ ...prev, imageUrl: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset file input
        }
    };

    const handleSave = () => {
        setMessage('');
        try {
            if (!form.topic.trim()) throw new Error('Konu alanı boş bırakılamaz.');
            
            let newQuestion: Question;
            const base = { id: Date.now(), grade: form.grade, topic: form.topic, difficulty: form.difficulty, imageUrl: form.imageUrl || undefined };

            if (form.type === 'quiz') {
                const correctAnswer = form.options[0];
                if (!form.question.trim()) throw new Error('Soru metni boş bırakılamaz.');
                if (form.options.some(opt => !opt.trim())) throw new Error('Tüm seçenekler doldurulmalıdır.');
                if (!correctAnswer || !correctAnswer.trim()) throw new Error('Doğru cevap (ilk seçenek) boş bırakılamaz.');
                newQuestion = { ...base, type: 'quiz', question: form.question, options: form.options, answer: correctAnswer };
            } else if (form.type === 'fill-in') {
                if (!form.sentence.includes('___')) throw new Error('Cümle içinde boşluk için "___" kullanılmalıdır.');
                if (!form.answer.trim()) throw new Error('Doğru cevap boş bırakılamaz.');
                newQuestion = { ...base, type: 'fill-in', sentence: form.sentence, answer: form.answer, distractors: form.distractors.filter(d => d.trim()) };
            } else if (form.type === 'matching') {
                const validPairs = form.pairs.filter(p => p.term.trim() && p.definition.trim());
                if (validPairs.length < 2) throw new Error('En az 2 geçerli eşleştirme çifti girilmelidir.');
                newQuestion = { ...base, type: 'matching', question: form.question, pairs: validPairs };
            } else {
                throw new Error('Geçersiz soru tipi.');
            }

            onAddQuestion(newQuestion);
            setMessage('Soru başarıyla eklendi!');
            setForm(initialFormState); // Reset form
            clearImage();
            setTimeout(() => setMessage(''), 3000);

        } catch(error: any) {
            setMessage(error.message);
        }
    };

    const renderFormFields = () => {
        switch (form.type) {
            case 'quiz':
                return (
                    <div className="space-y-4">
                         <div>
                            <label className="block text-slate-400 mb-2">Soru Görseli (İsteğe Bağlı)</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input 
                                    type="text" 
                                    name="imageUrl" 
                                    value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl} 
                                    onChange={handleChange} 
                                    placeholder="Resim URL'si yapıştırın..." 
                                    className="flex-grow p-2 bg-slate-800 rounded-md border border-slate-600"
                                />
                                <Button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm px-4 py-2 w-full sm:w-auto">
                                    Yükle
                                </Button>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                             {form.imageUrl && (
                                <div className="w-full sm:w-1/3 relative mt-2">
                                    <img 
                                        src={form.imageUrl} 
                                        alt="Önizleme" 
                                        className="w-full max-h-48 object-contain rounded-lg border border-slate-600 bg-slate-900/50 p-1"
                                        onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display='none'; }}
                                        onLoad={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display='block'; }}
                                    />
                                    <button onClick={clearImage} title="Resmi Kaldır" className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm transition-transform hover:scale-110">×</button>
                                </div>
                            )}
                            <div className="flex-1 w-full">
                                <label className="block text-slate-400">Soru Metni</label>
                                <textarea name="question" value={form.question} onChange={handleChange} rows={form.imageUrl ? 6 : 3} className="mt-1 p-2 bg-slate-800 rounded-md border border-slate-600 w-full" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {form.options.map((opt, index) => (
                                <div key={index}>
                                    <label className="block text-slate-400">
                                        {index === 0 ? 'Doğru Cevap (A Şıkkı)' : `Seçenek ${String.fromCharCode(65 + index)}`}
                                    </label>
                                    <input type="text" value={opt} onChange={(e) => handleOptionChange(index, e.target.value)} className="mt-1 p-2 bg-slate-800 rounded-md border border-slate-600 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'fill-in':
                 return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-slate-400">Cümle (boşluk için '___' kullanın)</label>
                            <textarea name="sentence" value={form.sentence} onChange={handleChange} rows={3} className="mt-1 p-2 bg-slate-800 rounded-md border border-slate-600 w-full" />
                        </div>
                         <div>
                            <label className="block text-slate-400">Doğru Cevap</label>
                            <input type="text" name="answer" value={form.answer} onChange={handleChange} className="mt-1 p-2 bg-slate-800 rounded-md border border-slate-600 w-full" />
                        </div>
                        <div>
                            <label className="block text-slate-400">Çeldiriciler</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                                <input type="text" value={form.distractors[0]} onChange={e => setForm(f => ({...f, distractors: [e.target.value, f.distractors[1]]}))} className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full" />
                                <input type="text" value={form.distractors[1]} onChange={e => setForm(f => ({...f, distractors: [f.distractors[0], e.target.value]}))} className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full" />
                            </div>
                        </div>
                    </div>
                );
            case 'matching':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-slate-400">Eşleştirme Başlığı (İsteğe Bağlı)</label>
                            <input type="text" name="question" value={form.question} onChange={handleChange} className="mt-1 p-2 bg-slate-800 rounded-md border border-slate-600 w-full" />
                        </div>
                        <div className="space-y-3">
                             {form.pairs.map((pair, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <input type="text" value={pair.term} onChange={(e) => handlePairChange(index, 'term', e.target.value)} placeholder="Öğe" className="flex-1 p-2 bg-slate-800 rounded-md border border-slate-600"/>
                                    <span className="text-slate-400">↔</span>
                                    <input type="text" value={pair.definition} onChange={(e) => handlePairChange(index, 'definition', e.target.value)} placeholder="Tanım" className="flex-1 p-2 bg-slate-800 rounded-md border border-slate-600"/>
                                    <button onClick={() => removePair(index)} className="bg-red-600/80 hover:bg-red-500 text-white font-bold w-8 h-8 rounded-md transition-transform hover:scale-105" disabled={form.pairs.length <= 1}>×</button>
                                </div>
                            ))}
                        </div>
                        <Button onClick={addPair} className="text-sm px-4 py-2">Yeni Çift Ekle</Button>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-700">
                <h3 className="text-xl font-bold text-blue-300">📝 Tekli Soru Ekle</h3>
            </div>
             
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                   <select name="grade" value={form.grade} onChange={handleChange} className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full">
                       <option value="5">5. Sınıf</option><option value="6">6. Sınıf</option><option value="7">7. Sınıf</option><option value="8">8. Sınıf</option>
                   </select>
                   <input name="topic" value={form.topic} onChange={handleChange} required placeholder="Konu (örn: İpek Yolu)" className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full lg:col-span-2" />
                   <select name="difficulty" value={form.difficulty} onChange={handleChange} className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full">
                       <option value="kolay">Kolay</option><option value="orta">Orta</option><option value="zor">Zor</option>
                   </select>
               </div>
                <div>
                   <label className="block text-slate-400 mb-1">Soru Tipi</label>
                   <select name="type" value={form.type} onChange={handleChange} className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full">
                       <option value="quiz">Çoktan Seçmeli</option><option value="fill-in">Boşluk Doldurma</option><option value="matching">Eşleştirme</option>
                   </select>
                </div>
                
                <div className="pt-4 border-t border-slate-700">
                   {renderFormFields()}
                </div>
            </div>

            <div className="p-4 border-t border-slate-700 space-y-3 sticky bottom-0 bg-slate-800/80 backdrop-blur-sm">
                <Button onClick={handleSave} variant="success" className="w-full text-base py-2.5">✅ Soruyu Kaydet</Button>
                {message && <p className={`text-center p-2 rounded-md ${message.includes('başarıyla') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{message}</p>}
            </div>
        </div>
    )
};


// --- Soru Düzenleme Modalı ---
const QuestionEditModal: React.FC<{
  question: Question;
  onSave: (updatedQuestion: Question) => void;
  onCancel: () => void;
}> = ({ question, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Question>(() => JSON.parse(JSON.stringify(question)));

  useEffect(() => {
    setFormData(JSON.parse(JSON.stringify(question)));
  }, [question]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'grade' ? parseInt(value, 10) : value 
    }));
  };
  
  // Quiz Handlers
  const handleOptionChange = (index: number, value: string) => {
    if (formData.type === 'quiz') {
      const newOptions = [...formData.options];
      const oldOptionValue = newOptions[index];
      newOptions[index] = value;
      const newAnswer = formData.answer === oldOptionValue ? value : formData.answer;
      setFormData(prev => ({ ...prev, options: newOptions, answer: newAnswer } as QuizQuestion));
    }
  };

  // Fill-in Handlers
  const handleDistractorChange = (index: number, value: string) => {
    if (formData.type === 'fill-in') {
      const newDistractors = [...formData.distractors];
      newDistractors[index] = value;
      setFormData(prev => ({ ...prev, distractors: newDistractors } as FillInQuestion));
    }
  };

  // Matching Handlers
  const handlePairChange = (index: number, field: keyof MatchingPair, value: string) => {
    if (formData.type === 'matching') {
      const newPairs = [...formData.pairs];
      newPairs[index] = { ...newPairs[index], [field]: value };
      setFormData(prev => ({ ...prev, pairs: newPairs } as MatchingQuestion));
    }
  };

  const addPair = () => {
    if (formData.type === 'matching') {
      const newPairs = [...formData.pairs, { term: '', definition: '' }];
      setFormData(prev => ({ ...prev, pairs: newPairs } as MatchingQuestion));
    }
  };

  const removePair = (index: number) => {
    if (formData.type === 'matching') {
      const newPairs = formData.pairs.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, pairs: newPairs } as MatchingQuestion));
    }
  };

  const handleSave = () => onSave(formData);
  
  const renderFormFields = () => {
    switch(formData.type) {
      case 'quiz':
        return (
          <>
            <label className="block"><span className="text-slate-400">Soru Metni</span><textarea name="question" value={formData.question} onChange={handleChange} rows={3} className="mt-1 p-2 bg-slate-900 rounded-md border border-slate-600 w-full" /></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {formData.options.map((opt, index) => (
                    <label key={index} className="block"><span className="text-slate-400">Seçenek {index + 1}</span><input type="text" value={opt} onChange={(e) => handleOptionChange(index, e.target.value)} className="mt-1 p-2 bg-slate-900 rounded-md border border-slate-600 w-full" /></label>
                ))}
            </div>
            <label className="block"><span className="text-slate-400">Doğru Cevap</span><select name="answer" value={formData.answer} onChange={handleChange} className="mt-1 p-2 bg-slate-900 rounded-md border border-slate-600 w-full">{formData.options.map((opt, index) => (<option key={index} value={opt}>{opt}</option>))}</select></label>
          </>
        );
      case 'fill-in':
        return (
          <>
            <label className="block"><span className="text-slate-400">Cümle (boşluk için '___' kullanın)</span><textarea name="sentence" value={formData.sentence} onChange={handleChange} rows={3} className="mt-1 p-2 bg-slate-900 rounded-md border border-slate-600 w-full" /></label>
            <label className="block"><span className="text-slate-400">Doğru Cevap</span><input type="text" name="answer" value={formData.answer} onChange={handleChange} className="mt-1 p-2 bg-slate-900 rounded-md border border-slate-600 w-full" /></label>
            <div>
              <span className="text-slate-400 mb-1 block">Çeldiriciler</span>
              <div className="space-y-2">
                {formData.distractors.map((distractor, index) => (
                  <input key={index} type="text" value={distractor} onChange={(e) => handleDistractorChange(index, e.target.value)} className="p-2 bg-slate-900 rounded-md border border-slate-600 w-full" />
                ))}
              </div>
            </div>
          </>
        );
      case 'matching':
        return (
          <>
            <label className="block"><span className="text-slate-400">Eşleştirme Başlığı (İsteğe Bağlı)</span><input type="text" name="question" value={formData.question || ''} onChange={handleChange} className="mt-1 p-2 bg-slate-900 rounded-md border border-slate-600 w-full" /></label>
            <div>
              <span className="text-slate-400 mb-2 block">Eşleştirme Çiftleri</span>
              <div className="space-y-3">
                {formData.pairs.map((pair, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input type="text" value={pair.term} onChange={(e) => handlePairChange(index, 'term', e.target.value)} placeholder="Öğe" className="flex-1 p-2 bg-slate-900 rounded-md border border-slate-600"/>
                    <span className="text-slate-400">↔</span>
                    <input type="text" value={pair.definition} onChange={(e) => handlePairChange(index, 'definition', e.target.value)} placeholder="Tanım" className="flex-1 p-2 bg-slate-900 rounded-md border border-slate-600"/>
                    <button onClick={() => removePair(index)} className="bg-red-600/80 hover:bg-red-500 text-white font-bold w-8 h-8 rounded-md transition-transform hover:scale-105">×</button>
                  </div>
                ))}
              </div>
              <Button onClick={addPair} className="mt-4 text-sm px-4 py-2">Yeni Çift Ekle</Button>
            </div>
          </>
        );
      default:
        return <p>Bu soru tipi düzenlenemiyor.</p>;
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-slate-800/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl w-full max-w-2xl animate-slideIn">
        <h3 className="text-2xl font-bold mb-6">Soruyu Düzenle</h3>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <label className="block"><span className="text-slate-400">Konu</span><input type="text" name="topic" value={formData.topic} onChange={handleChange} className="mt-1 p-2 bg-slate-900 rounded-md border border-slate-600 w-full" /></label>
            <label className="block"><span className="text-slate-400">Resim URL'si (İsteğe Bağlı)</span><input type="text" name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} placeholder="https://..." className="mt-1 p-2 bg-slate-900 rounded-md border border-slate-600 w-full" /></label>
            
            {renderFormFields()}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                 <label className="block"><span className="text-slate-400">Sınıf</span><select name="grade" value={formData.grade} onChange={handleChange} className="mt-1 p-2 bg-slate-900 rounded-md border border-slate-600 w-full"><option value="5">5. Sınıf</option><option value="6">6. Sınıf</option><option value="7">7. Sınıf</option><option value="8">8. Sınıf</option></select></label>
                 <label className="block"><span className="text-slate-400">Zorluk</span><select name="difficulty" value={formData.difficulty} onChange={handleChange} className="mt-1 p-2 bg-slate-900 rounded-md border border-slate-600 w-full"><option value="kolay">Kolay</option><option value="orta">Orta</option><option value="zor">Zor</option></select></label>
            </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <Button onClick={onCancel} variant="secondary">İptal</Button>
          <Button onClick={handleSave} variant="success">Değişiklikleri Kaydet</Button>
        </div>
      </div>
    </div>
  );
};

const CodeExportModal: React.FC<{
  isOpen: boolean;
  code: string;
  onClose: () => void;
}> = ({ isOpen, code, onClose }) => {
  const [copyButtonText, setCopyButtonText] = useState('Kodu Kopyala');

  useEffect(() => {
    if (isOpen) {
        setCopyButtonText('Kodu Kopyala');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
        setCopyButtonText('✅ Kopyalandı!');
        setTimeout(() => setCopyButtonText('Kodu Kopyala'), 2000);
    }, () => {
        setCopyButtonText('Hata!');
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-slate-800/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl w-full max-w-3xl animate-slideIn">
        <h3 className="text-2xl font-bold mb-4 text-amber-300">Soruları Koda Göm</h3>
        <p className="text-slate-300 mb-4">
            Aşağıdaki kodu kopyalayıp, bir sonraki güncelleme isteğinizde bana ileterek bu soru setini uygulamanın varsayılanı yapabilirsiniz.
        </p>
        <p className="text-sm text-slate-400 mb-4">
          <b>Yapılacak işlem:</b> `App.tsx` dosyasındaki `const initialQuestions: Question[] = [...]` dizisinin içeriğini ( `[` ve `]` parantezleri arasını) aşağıdaki kodla değiştirin.
        </p>
        <pre className="bg-slate-900 p-4 rounded-lg text-sm overflow-auto max-h-60 font-mono border border-slate-700">
            <code>{code}</code>
        </pre>
        <div className="mt-6 flex justify-end gap-4">
          <Button onClick={onClose} variant="secondary">Kapat</Button>
          <Button onClick={handleCopy} variant="success">{copyButtonText}</Button>
        </div>
      </div>
    </div>
  );
};


// --- Main Panel Component ---
interface TeacherPanelProps {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  onSelectQuestion: (question: Question) => void;
  onResetSolvedQuestions: () => void;
  onClearAllData: () => void;
  selectedSubjectId: string;
}

export const TeacherPanel: React.FC<TeacherPanelProps> = ({ questions, setQuestions, onSelectQuestion, onResetSolvedQuestions, onClearAllData, selectedSubjectId }) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'add-single' | 'add-ai' | 'bulk'>('manage');
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState<{isOpen: boolean; onConfirm: () => void}>({isOpen: false, onConfirm: () => {}});
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [bulkMessage, setBulkMessage] = useState({ type: '', text: '' });
  const [generatedCode, setGeneratedCode] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // State for example JSON generator
  const [exampleGrade, setExampleGrade] = useState<number>(5);
  const [exampleOgrenmeAlani, setExampleOgrenmeAlani] = useState<string>('');
  const [exampleKazanımId, setExampleKazanımId] = useState<string>('');
  const [exampleType, setExampleType] = useState<QuestionType>('quiz');
  
  const exampleOgrenmeAlanlari = useMemo(() => curriculumData[selectedSubjectId]?.[exampleGrade] || [], [exampleGrade, selectedSubjectId]);
  const exampleKazanımlar = useMemo(() => {
    if (!exampleOgrenmeAlani) return [];
    const ogrenmeAlani = exampleOgrenmeAlanlari.find(oa => oa.name === exampleOgrenmeAlani);
    // FIX: Flatten kazanımlar from all altKonular
    return ogrenmeAlani?.altKonular.flatMap(ak => ak.kazanımlar) || [];
  }, [exampleOgrenmeAlani, exampleOgrenmeAlanlari]);

  // Reset dependent dropdowns on change
  useEffect(() => {
    const firstOgrenmeAlani = exampleOgrenmeAlanlari[0]?.name || '';
    setExampleOgrenmeAlani(firstOgrenmeAlani);
  }, [exampleGrade, exampleOgrenmeAlanlari, selectedSubjectId]);

  useEffect(() => {
    const firstKazanımId = exampleKazanımlar[0]?.id || '';
    setExampleKazanımId(firstKazanımId);
  }, [exampleOgrenmeAlani, exampleKazanımlar]);

  const subjectPrefixes: Record<string, string[]> = {
    'social-studies': ['SB.', 'İTA.'],
    'math': ['MAT.', 'M.'],
    'science': ['FEN.', 'F.'],
    'turkish': ['T.'],
    'english': ['E5.', 'E6.', 'E7.', 'E8.'],
    'paragraph': ['P.'],
  };

  const subjectSpecificQuestions = useMemo(() => {
    const prefixes = subjectPrefixes[selectedSubjectId] || [];
    if (prefixes.length === 0) {
      return questions.filter(q => !q.kazanımId); // Show questions without kazanımId if subject prefix is unknown
    }
    return questions.filter(q => 
        q.kazanımId && prefixes.some(prefix => q.kazanımId!.startsWith(prefix))
    );
  }, [questions, selectedSubjectId]);


  const getExampleJson = (grade: number, topic: string, kazanımId: string, type: QuestionType): string => {
    if (!topic || !kazanımId) return 'Lütfen tüm alanları seçin.';

    // FIX: Explicitly cast "orta" to Difficulty type to prevent type widening to string.
    const base = { grade, topic, kazanımId, difficulty: "orta" as Difficulty };
    let exampleData: Partial<Question> = {};

    switch (type) {
      case 'quiz':
        exampleData = { ...base, type: 'quiz', question: `Bu kazanım (${kazanımId}) ile ilgili örnek bir soru metni.`, options: ["Doğru Cevap", "Yanlış Cevap 1", "Yanlış Cevap 2", "Yanlış Cevap 3"], answer: "Doğru Cevap" };
        break;
      case 'fill-in':
        exampleData = { ...base, type: 'fill-in', sentence: `Bu kazanımla ilgili, içinde ___ olan bir cümle.`, answer: "doğru kelime", distractors: ["çeldirici 1", "çeldirici 2"] };
        break;
      case 'matching':
        exampleData = { ...base, type: 'matching', question: "Bu kazanıma uygun elemanları eşleştirin.", pairs: [{ term: "Kavram 1", definition: "Açıklama 1" }, { term: "Kavram 2", definition: "Açıklama 2" }, { term: "Kavram 3", definition: "Açıklama 3" }] };
        break;
    }
    return JSON.stringify([exampleData], null, 2);
  };

  const currentExampleJson = useMemo(() => {
    return getExampleJson(exampleGrade, exampleOgrenmeAlani, exampleKazanımId, exampleType);
  }, [exampleGrade, exampleOgrenmeAlani, exampleKazanımId, exampleType]);


  const questionSummary = useMemo(() => {
    const summary = {
        total: subjectSpecificQuestions.length,
        distinctTopics: new Set(subjectSpecificQuestions.map(q => q.topic)).size,
        byGrade: { 5: 0, 6: 0, 7: 0, 8: 0 } as Record<number, number>,
    };

    for (const q of subjectSpecificQuestions) {
        if (q.grade in summary.byGrade) {
            summary.byGrade[q.grade]++;
        }
    }
    return summary;
  }, [subjectSpecificQuestions]);
  
  const kazanımIdToTextMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const subjectId in curriculumData) {
      const subjectGrades = curriculumData[subjectId];
      for (const gradeKey in subjectGrades) {
          const gradeData = subjectGrades[parseInt(gradeKey)];
          for (const ogrenmeAlani of gradeData) {
              for (const altKonu of ogrenmeAlani.altKonular) {
                  for (const kazanım of altKonu.kazanımlar) {
                      map.set(kazanım.id, kazanım.text);
                  }
              }
          }
      }
    }
    return map;
  }, []);

  const groupedAndFilteredQuestions: Record<string, Record<string, Record<string, Question[]>>> = useMemo(() => {
    const filtered = subjectSpecificQuestions.filter(q => 
        q.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.type === 'quiz' && q.question.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const grouped: Record<string, Record<string, Record<string, Question[]>>> = {};

    for (const question of filtered) {
      const { grade, topic, kazanımId } = question;
      const gradeKey = String(grade);
      
      if (!grouped[gradeKey]) {
        grouped[gradeKey] = {};
      }
      if (!grouped[gradeKey][topic]) {
        grouped[gradeKey][topic] = {};
      }
      
      const kazanımKey = kazanımId || 'Diğer'; 
      
      if (!grouped[gradeKey][topic][kazanımKey]) {
        grouped[gradeKey][topic][kazanımKey] = [];
      }
      
      grouped[gradeKey][topic][kazanımKey].push(question);
    }

    return grouped;
  }, [subjectSpecificQuestions, searchTerm]);

  const addQuestion = (newQuestion: Question) => {
    setQuestions(prev => [...prev, newQuestion]);
  };

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    setQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
    setEditingQuestion(null);
  };
  
  const deleteQuestion = (id: number) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    setModal({isOpen: false, onConfirm: () => {}});
  };

  const handleAIQuestion = (data: Partial<Question>[]) => {
    const fullQuestions: Question[] = data.map((q, index) => ({
        id: Date.now() + index,
        ...q
    } as Question));
    setQuestions(prev => [...prev, ...fullQuestions]);
    setActiveTab('manage');
    alert(`${fullQuestions.length} adet soru listeye eklendi!`);
  };

  const handleBulkImport = () => {
    if (!jsonInput.trim()) {
      setBulkMessage({ type: 'error', text: 'Lütfen içe aktarmak için JSON verisi girin.' });
      return;
    }
    try {
      const newQuestionsRaw = JSON.parse(jsonInput);
      
      if (Array.isArray(newQuestionsRaw)) {
        const validatedQuestions = newQuestionsRaw.map((q: any, index: number) => {
          const errorPrefix = `Dizideki ${index + 1}. soruda hata:`;
          if (!q.grade || !q.topic || !q.difficulty || !q.type || !q.kazanımId) {
            throw new Error(`${errorPrefix} Temel alanlardan (grade, topic, kazanımId, difficulty, type) biri eksik.`);
          }
          
          switch(q.type) {
            case 'quiz':
              if (!q.question || !q.options || !q.answer) throw new Error(`${errorPrefix} Çoktan seçmeli soru için 'question', 'options' veya 'answer' alanı eksik.`);
              if (!Array.isArray(q.options) || q.options.length < 2) throw new Error(`${errorPrefix} 'options' bir dizi olmalı ve en az 2 seçenek içermelidir.`);
              break;
            case 'fill-in':
              if (!q.sentence || !q.answer || !q.distractors) throw new Error(`${errorPrefix} Boşluk doldurma sorusu için 'sentence', 'answer' veya 'distractors' alanı eksik.`);
              break;
            case 'matching':
              if (!q.pairs || !Array.isArray(q.pairs) || q.pairs.length < 2) throw new Error(`${errorPrefix} Eşleştirme sorusu için 'pairs' alanı eksik veya en az 2 çiftten oluşmuyor.`);
              break;
            default:
              throw new Error(`${errorPrefix} Geçersiz soru tipi: '${q.type}'. Sadece 'quiz', 'fill-in', 'matching' desteklenmektedir.`);
          }

          return { ...q, id: q.id || Date.now() + index };
        });
        
        setQuestions(prev => [...prev, ...validatedQuestions]);
        setBulkMessage({ type: 'success', text: `${validatedQuestions.length} soru başarıyla eklendi!` });
        setJsonInput('');
      } else {
        throw new Error('JSON verisi bir dizi (array) formatında olmalıdır.');
      }
    } catch (error: any) {
        let friendlyMessage = `Hata: ${error.message}`;
        if (error instanceof SyntaxError) {
            friendlyMessage = `JSON formatında bir hata var: ${error.message}. Bu hata genellikle tırnak işareti ("...") içindeki bir metne yeni satır karakteri gibi geçersiz karakterler kopyalandığında veya JSON formatında bir yazım hatası (örn: eksik virgül) olduğunda oluşur. Lütfen JSON verinizi bir metin düzenleyicide kontrol edin.`;
        }
      setBulkMessage({ type: 'error', text: friendlyMessage });
    }
  };
  
  const handleExportQuestions = () => {
      if (subjectSpecificQuestions.length === 0) {
          setBulkMessage({ type: 'error', text: 'Dışa aktarılacak soru bulunmuyor.' });
          return;
      }

      const jsonString = JSON.stringify(subjectSpecificQuestions, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `soru-bankasi-${selectedSubjectId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBulkMessage({ type: 'success', text: 'Bu derse ait tüm sorular başarıyla dışa aktarıldı!' });
  };
  
  const handleGenerateCode = () => {
    if (subjectSpecificQuestions.length === 0) {
        setBulkMessage({ type: 'error', text: 'Koda dönüştürülecek soru bulunmuyor.' });
        return;
    }
    const codeString = JSON.stringify(subjectSpecificQuestions, null, 2);
    const arrayContent = codeString.substring(codeString.indexOf('[') + 1, codeString.lastIndexOf(']'));
    setGeneratedCode(arrayContent);
    setShowCodeModal(true);
  };

  const typeLabels: Record<QuestionType, string> = { 'quiz': 'Çoktan Seçmeli', 'fill-in': 'Boşluk Doldurma', 'matching': 'Eşleştirme' };

  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-6 text-white">
        <h2 className="text-4xl font-bold text-center mb-6">👩‍🏫 Öğretmen Paneli</h2>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl flex-grow flex flex-col overflow-hidden">
            <div className="flex border-b border-slate-700 flex-shrink-0 flex-wrap">
                <TabButton active={activeTab === 'manage'} onClick={() => setActiveTab('manage')}>📊 Soru Yönetimi</TabButton>
                <TabButton active={activeTab === 'add-single'} onClick={() => setActiveTab('add-single')}>📝 Tekli Soru Ekle</TabButton>
                <TabButton active={activeTab === 'add-ai'} onClick={() => setActiveTab('add-ai')}>✨ AI ile Soru Ekle</TabButton>
                <TabButton active={activeTab === 'bulk'} onClick={() => setActiveTab('bulk')}>📦 Toplu İşlemler</TabButton>
            </div>
            
            <div className="flex-grow overflow-y-auto relative">
                {activeTab === 'manage' && (
                    <div className="p-4 sm:p-6 space-y-6">
                        <div className="flex flex-wrap gap-4">
                            <SummaryCard value={questionSummary.total} label="Toplam Soru" />
                            <SummaryCard value={questionSummary.distinctTopics} label="Farklı Konu" />
                            <SummaryCard value={questionSummary.byGrade[5]} label="5. Sınıf" />
                            <SummaryCard value={questionSummary.byGrade[6]} label="6. Sınıf" />
                            <SummaryCard value={questionSummary.byGrade[7]} label="7. Sınıf" />
                            <SummaryCard value={questionSummary.byGrade[8]} label="8. Sınıf" />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <input
                                type="text"
                                placeholder="Konu veya soru metninde ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-grow p-3 bg-slate-800 rounded-md border border-slate-600 w-full"
                            />
                            <div className="flex gap-2">
                                <Button onClick={() => setShowResetConfirm(true)} variant="warning" className="text-sm px-4 py-2 whitespace-nowrap">Çözülenleri Sıfırla</Button>
                                <Button onClick={() => setShowClearAllConfirm(true)} variant="secondary" className="text-sm px-4 py-2 whitespace-nowrap">Tüm Veriyi Sil</Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                        {Object.keys(groupedAndFilteredQuestions).length > 0 ? Object.entries(groupedAndFilteredQuestions).map(([grade, topics]) => (
                            <div key={grade}>
                                <h3 className="text-2xl font-bold text-cyan-300 mb-2">{grade}. Sınıf</h3>
                                {Object.entries(topics).map(([topic, kazanims]) => (
                                    <div key={topic} className="mb-4 pl-4 border-l-2 border-slate-700">
                                        <h4 className="text-xl font-semibold text-teal-300">{topic}</h4>
                                        {Object.entries(kazanims).map(([kazanımId, questionsInKazanım]) => (
                                            <div key={kazanımId} className="mt-2 pl-4">
                                                <p className="text-amber-300 font-bold">{kazanımId}</p>
                                                <p className="text-slate-400 text-sm mb-2">{kazanımIdToTextMap.get(kazanımId)}</p>
                                                <div className="space-y-2">
                                                {questionsInKazanım.map(q => (
                                                    <div key={q.id} className="bg-slate-900/70 p-3 rounded-lg flex justify-between items-start gap-2">
                                                        <div className="flex-grow">
                                                            <p className="font-semibold text-slate-200">{q.type === 'quiz' ? q.question : q.type === 'fill-in' ? q.sentence : q.question || 'Eşleştirme'}</p>
                                                            <div className="text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                                                <span>{typeLabels[q.type]}</span>
                                                                <span>{q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex-shrink-0 flex gap-2">
                                                            <Button onClick={() => onSelectQuestion(q)} className="text-xs px-3 py-1">Test Et</Button>
                                                            <Button onClick={() => setEditingQuestion(q)} variant="warning" className="text-xs px-3 py-1">Düzenle</Button>
                                                            <Button onClick={() => setModal({isOpen: true, onConfirm: () => deleteQuestion(q.id)})} variant="secondary" className="text-xs px-3 py-1">Sil</Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )) : <p className="text-slate-400 text-center py-8">Bu derse ait soru bulunamadı veya arama kriterleriyle eşleşmedi.</p>}
                        </div>
                    </div>
                )}
                {activeTab === 'add-single' && <ManualQuestionForm onAddQuestion={addQuestion} />}
                {activeTab === 'add-ai' && <AIGenerator onQuestionGenerated={handleAIQuestion} selectedSubjectId={selectedSubjectId}/>}
                {activeTab === 'bulk' && (
                    <div className="p-4 sm:p-6 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-xl font-bold text-green-300 mb-3">Toplu Soru İçe Aktar (JSON)</h3>
                                <p className="text-slate-400 mb-2">JSON formatındaki soru listenizi buraya yapıştırarak toplu olarak ekleyebilirsiniz.</p>
                                <textarea
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                    placeholder='[ { "grade": 5, "topic": "...", ... } ]'
                                    className="w-full h-48 p-2 bg-slate-900 rounded-md border border-slate-600 font-mono text-sm"
                                />
                                <Button onClick={handleBulkImport} variant="success" className="mt-2 w-full">İçe Aktar</Button>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-amber-300 mb-3">Dışa Aktar & Örnek JSON</h3>
                                 <div className="flex gap-4 mb-4">
                                    <Button onClick={handleExportQuestions} className="flex-1">Tüm Soruları Dışa Aktar</Button>
                                    <Button onClick={handleGenerateCode} variant="warning" className="flex-1">Koda Göm</Button>
                                </div>
                                <p className="text-slate-400 mb-2">Aşağıda seçtiğiniz kriterlere göre örnek bir JSON formatı görebilirsiniz.</p>
                                 <div className="grid grid-cols-2 gap-2 mb-2">
                                     <select value={exampleGrade} onChange={e => setExampleGrade(parseInt(e.target.value))} className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full">
                                         <option value="5">5. Sınıf</option><option value="6">6. Sınıf</option><option value="7">7. Sınıf</option><option value="8">8. Sınıf</option>
                                     </select>
                                      <select value={exampleType} onChange={e => setExampleType(e.target.value as QuestionType)} className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full">
                                        <option value="quiz">Çoktan Seçmeli</option><option value="fill-in">Boşluk Doldurma</option><option value="matching">Eşleştirme</option>
                                    </select>
                                    <select value={exampleOgrenmeAlani} onChange={e => setExampleOgrenmeAlani(e.target.value)} className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full col-span-2">
                                         <option value="">Öğrenme Alanı Seçin</option>
                                         {exampleOgrenmeAlanlari.map(oa => <option key={oa.name} value={oa.name}>{oa.name}</option>)}
                                     </select>
                                      <select value={exampleKazanımId} onChange={e => setExampleKazanımId(e.target.value)} disabled={!exampleOgrenmeAlani} className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full col-span-2 disabled:opacity-50">
                                         <option value="">Kazanım Seçin</option>
                                         {exampleKazanımlar.map(k => <option key={k.id} value={k.id}>{k.id} - {k.text}</option>)}
                                     </select>
                                 </div>
                                <pre className="bg-slate-900 p-3 rounded-lg text-xs overflow-auto h-48 font-mono border border-slate-700">
                                    <code>{currentExampleJson}</code>
                                </pre>
                            </div>
                        </div>

                         {bulkMessage.text && <p className={`text-center p-2 rounded-md ${bulkMessage.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{bulkMessage.text}</p>}
                    </div>
                )}
            </div>
        </div>

        <Modal 
            isOpen={modal.isOpen} 
            title="Soruyu Sil" 
            message="Bu soruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz." 
            onConfirm={modal.onConfirm} 
            onCancel={() => setModal({isOpen: false, onConfirm: () => {}})} 
        />
        <Modal 
            isOpen={showResetConfirm}
            title="Çözülenleri Sıfırla"
            message="Tüm öğrencilerin çözdüğü soruların kaydını sıfırlamak istediğinizden emin misiniz? Bu, tüm soruların tekrar çözülebilir olmasını sağlar."
            onConfirm={() => { onResetSolvedQuestions(); setShowResetConfirm(false); alert('Çözülen soru kayıtları sıfırlandı.'); }}
            onCancel={() => setShowResetConfirm(false)}
        />
        <Modal 
            isOpen={showClearAllConfirm}
            title="Tüm Veriyi Sil"
            message="UYARI: Bu işlem, eklediğiniz TÜM soruları, yüksek skorları ve çözülen soru kayıtlarını kalıcı olarak silecektir. Bu işlem geri alınamaz. Emin misiniz?"
            onConfirm={() => { onClearAllData(); setShowClearAllConfirm(false); alert('Tüm uygulama verileri silindi.'); }}
            onCancel={() => setShowClearAllConfirm(false)}
        />
        {editingQuestion && <QuestionEditModal question={editingQuestion} onSave={handleUpdateQuestion} onCancel={() => setEditingQuestion(null)} />}
        <CodeExportModal isOpen={showCodeModal} code={generatedCode} onClose={() => setShowCodeModal(false)} />
    </div>
  );
};