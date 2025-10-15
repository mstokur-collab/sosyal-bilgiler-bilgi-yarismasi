import React, { useState, useMemo } from 'react';
import type { Question, GameSettings } from '../../types';
import { Button } from '../UI';

export const QuestionLibrary: React.FC<{
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
