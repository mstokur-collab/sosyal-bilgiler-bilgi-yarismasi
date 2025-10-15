import React from 'react';
import type { QuizQuestion } from '../../types';
import { useKapismaAudio } from './KapismaUI';

interface KapismaQuestionScreenProps {
  question: QuizQuestion;
  scores: { a: number; b: number };
  playerA: number | null;
  playerB: number | null;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (team: 'a' | 'b', option: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  selectedAnswer: { team: 'a' | 'b'; option: string } | null;
  onMainMenu: () => void;
  onSettingsClick: () => void;
  onToggleFullscreen: () => void;
  scoreRefA: React.RefObject<HTMLDivElement>;
  scoreRefB: React.RefObject<HTMLDivElement>;
  audio: ReturnType<typeof useKapismaAudio>;
}

export const KapismaQuestionScreen: React.FC<KapismaQuestionScreenProps> = ({
  question,
  scores,
  playerA,
  playerB,
  questionIndex,
  totalQuestions,
  onAnswer,
  selectedAnswer,
  onMainMenu,
  onSettingsClick,
  onToggleFullscreen,
  scoreRefA,
  scoreRefB,
  audio,
}) => {

    const getButtonClass = (team: 'a' | 'b', option: string) => {
        const base = `w-full h-full rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center text-center p-2 text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 break-words`;

        if (!selectedAnswer) {
            return `${base} bg-yellow-400 hover:bg-yellow-300 transform hover:-translate-y-1 cursor-pointer`;
        }

        const isCorrect = option === question.answer;
        const wasSelected = selectedAnswer.option === option && selectedAnswer.team === team;

        if (wasSelected) {
            return isCorrect ? `${base} bg-green-500` : `${base} bg-red-600 text-white`;
        }

        return `${base} bg-yellow-400 opacity-40 cursor-not-allowed`;
    };

    return (
        <div className="w-full h-full flex flex-col p-4 gap-4 kapisma-bg">
            <header className="flex-shrink-0 flex justify-between items-center text-white px-2">
                <div className="flex-1"></div>
                <div className="text-center flex-shrink-0">
                    <p className="text-xl font-semibold">Soru {questionIndex + 1} / {totalQuestions}</p>
                    <p className="text-lg text-slate-300">A{playerA} vs B{playerB}</p>
                </div>
                <div className="flex-1 flex justify-end items-center gap-2">
                    <button onClick={() => { audio.playClick(); onMainMenu(); }} className="px-4 py-2 bg-purple-600 rounded-lg text-sm font-semibold transition-transform hover:scale-105">Ana Menü</button>
                    <button onClick={() => { audio.playClick(); onSettingsClick(); }} className="w-9 h-9 bg-slate-700/50 rounded-lg flex items-center justify-center transition-transform hover:scale-105">⚙️</button>
                    <button onClick={() => { audio.playClick(); onToggleFullscreen(); }} className="w-9 h-9 bg-slate-700/50 rounded-lg flex items-center justify-center transition-transform hover:scale-105">⛶</button>
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center gap-6">
                 <div className="w-full flex justify-between items-start px-4">
                    <div className="bg-blue-900/50 border-2 border-blue-500 rounded-xl p-4 text-center shadow-lg w-48">
                        <p className="font-semibold text-lg">Takım A - Öğrenci {playerA}</p>
                        <div ref={scoreRefA} className="text-4xl font-extrabold mt-1">{scores.a}</div>
                    </div>
                     <div className="bg-red-900/50 border-2 border-red-500 rounded-xl p-4 text-center shadow-lg w-48">
                        <p className="font-semibold text-lg">Takım B - Öğrenci {playerB}</p>
                        <div ref={scoreRefB} className="text-4xl font-extrabold mt-1">{scores.b}</div>
                    </div>
                </div>

                <div className="w-full max-w-4xl bg-slate-900/70 border border-slate-600 rounded-2xl p-6 text-2xl font-semibold text-center shadow-2xl">
                    {question.question}
                </div>

                <div className="w-full flex-grow flex items-center justify-center gap-4 px-4 pb-4">
                    <div className="w-1/2 h-full bg-black/20 border-2 border-blue-400 rounded-2xl p-4">
                        <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
                            {question.options.map(opt => (
                                <button key={`a-${opt}`} onClick={(e) => onAnswer('a', opt, e)} disabled={!!selectedAnswer} className={getButtonClass('a', opt)}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="w-2 h-4/5 bg-slate-600 rounded-full"></div>

                     <div className="w-1/2 h-full bg-black/20 border-2 border-red-400 rounded-2xl p-4">
                        <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
                            {question.options.map(opt => (
                                <button key={`b-${opt}`} onClick={(e) => onAnswer('b', opt, e)} disabled={!!selectedAnswer} className={getButtonClass('b', opt)}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
