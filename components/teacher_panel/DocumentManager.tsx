import React, { useState, useRef } from 'react';
import type { DocumentLibraryItem, QuizQuestion } from '../../types';
import { extractQuestionFromImage, extractTopicsFromPDF } from '../../services/geminiService';
import { Button } from '../UI';

declare const mammoth: any;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });

export const DocumentManager: React.FC<{
    documentLibrary: DocumentLibraryItem[];
    setDocumentLibrary: React.Dispatch<React.SetStateAction<DocumentLibraryItem[]>>;
    setQuestions: React.Dispatch<React.SetStateAction<any[]>>;
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
