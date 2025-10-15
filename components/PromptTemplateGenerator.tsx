import React, { useState, useMemo, useEffect } from 'react';
import { Button } from './UI';
import { getCurriculumData } from '../services/curriculumService';
import { generatePromptTemplateForKazanım } from '../services/geminiService';
import type { OgrenmeAlani } from '../data/curriculum';

export const PromptTemplateGenerator: React.FC<{ selectedSubjectId: string }> = ({ selectedSubjectId }) => {
  const [grade, setGrade] = useState<number>(8);
  const [ogrenmeAlani, setOgrenmeAlani] = useState<string>('');
  const [kazanımId, setKazanımId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedTemplate, setGeneratedTemplate] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Kodu Kopyala');
  
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

  useEffect(() => {
    const firstOgrenmeAlani = ogrenmeAlanlari[0]?.name || '';
    setOgrenmeAlani(firstOgrenmeAlani);
  }, [grade, ogrenmeAlanlari, selectedSubjectId]);

  useEffect(() => {
    const firstKazanımId = kazanımlar[0]?.id || '';
    setKazanımId(firstKazanımId);
  }, [ogrenmeAlani, kazanımlar]);

  const handleGenerate = async () => {
    if (!kazanımId) {
      setError('Lütfen bir kazanım seçin.');
      return;
    }
    setIsLoading(true);
    setError('');
    setGeneratedTemplate('');
    try {
      const selectedKazanım = kazanımlar.find(k => k.id === kazanımId);
      if (!selectedKazanım) throw new Error('Seçilen kazanım bulunamadı.');
      
      const template = await generatePromptTemplateForKazanım(selectedKazanım.id, selectedKazanım.text);
      setGeneratedTemplate(template);
    } catch (err: any) {
      setError(err.message || 'Şablon üretilirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedTemplate) return;
    navigator.clipboard.writeText(generatedTemplate).then(() => {
        setCopyButtonText('✅ Kopyalandı!');
        setTimeout(() => setCopyButtonText('Kodu Kopyala'), 2000);
    }, () => {
        setCopyButtonText('Hata!');
    });
  };
  
  if (isCurriculumLoading) {
    return <div className="p-6 text-center">Müfredat verisi yükleniyor...</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-amber-300 mb-3">AI Destekli Prompt Şablonu Üreticisi</h3>
        <p className="text-slate-400 mb-4">
          Belirli bir kazanım için, yapay zekanın yüksek kaliteli ve görsel odaklı sorular üretmesini sağlayacak "usta" bir prompt şablonu oluşturun.
        </p>
      </div>
      <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-amber-500/30">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select value={grade} onChange={e => setGrade(parseInt(e.target.value))} className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full">
            <option value="5">5. Sınıf</option>
            <option value="6">6. Sınıf</option>
            <option value="7">7. Sınıf</option>
            <option value="8">8. Sınıf</option>
          </select>
          <select value={ogrenmeAlani} onChange={e => setOgrenmeAlani(e.target.value)} className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full col-span-1 sm:col-span-2">
            <option value="">Öğrenme Alanı Seçin</option>
            {ogrenmeAlanlari.map(oa => <option key={oa.name} value={oa.name}>{oa.name}</option>)}
          </select>
        </div>
        <select value={kazanımId} onChange={e => setKazanımId(e.target.value)} disabled={!ogrenmeAlani} className="p-2 bg-slate-800 rounded-md border border-slate-600 w-full disabled:opacity-50">
          <option value="">Kazanım Seçin</option>
          {kazanımlar.map(k => <option key={k.id} value={k.id}>{k.id} - {k.text}</option>)}
        </select>
        <Button onClick={handleGenerate} disabled={isLoading || !kazanımId} className="w-full">
          {isLoading ? 'Şablon Üretiliyor...' : '✨ AI ile Şablon Üret'}
        </Button>
      </div>
      
      {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
      
      {generatedTemplate && (
        <div className="space-y-4 animate-fadeIn">
            <h4 className="text-lg font-semibold text-green-300">Üretilen Şablon:</h4>
            <p className="text-sm text-slate-400">
                Aşağıdaki kodu kopyalayıp `data/promptTemplates.ts` dosyasındaki `promptTemplates` nesnesinin içine yeni bir eleman olarak yapıştırın.
            </p>
            <pre className="bg-slate-900 p-4 rounded-lg text-sm overflow-auto max-h-80 font-mono border border-slate-700">
                <code>{generatedTemplate}</code>
            </pre>
            <Button onClick={handleCopy} variant="success" className="w-full">{copyButtonText}</Button>
        </div>
      )}
    </div>
  );
};
