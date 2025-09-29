// FIX: Updated the QuizComponents file to fix potential bugs, improve UI consistency, and align with the latest implementation. This includes fixes for layout, font scaling, and state management in hooks.
import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import type { Question, GameSettings, QuizQuestion, FillInQuestion, MatchingQuestion, MatchingPair } from '../types';
import { Button, Modal } from './UI';

// --- Helper Functions & Constants ---

const QUESTION_TIME_DEFAULT = 30;
const QUESTION_TIME_MATCHING = 45;

// FIX: Added missing 'AnswerState' interface definition.
interface AnswerState {
  selected: any;
  isCorrect: boolean;
  shuffledOptions?: string[];
}

// --- Redesigned Matching View Component ---

const MatchingView: React.FC<{
  question: MatchingQuestion;
  onAnswer: (isCorrect: boolean, selected: Record<string, string>) => void;
  answerState?: AnswerState;
  playSound: (type: 'correct' | 'incorrect' | 'tick') => void;
}> = ({ question, onAnswer, answerState, playSound }) => {
    const [leftItems, setLeftItems] = useState<string[]>([]);
    const [rightItems, setRightItems] = useState<string[]>([]);
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [matches, setMatches] = useState<Record<string, string>>({});
    const [incorrectShake, setIncorrectShake] = useState<string | null>(null);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const isAnswered = !!answerState;

    const correctPairsMap = useMemo(() => new Map(question.pairs.map(p => [p.term, p.definition])), [question.pairs]);
    const definitionToTermMap = useMemo(() => new Map(question.pairs.map(p => [p.definition, p.term])), [question.pairs]);

    // Assign stable colors to each correct pair
    const pairColors = useMemo(() => {
        const colors = [
            { border: 'border-sky-400', bg: 'bg-sky-500/80' },
            { border: 'border-emerald-400', bg: 'bg-emerald-500/80' },
            { border: 'border-amber-400', bg: 'bg-amber-500/80' },
            { border: 'border-rose-400', bg: 'bg-rose-500/80' },
            { border: 'border-violet-400', bg: 'bg-violet-500/80' },
        ];
        const map = new Map<string, typeof colors[0]>();
        question.pairs.forEach((pair, index) => map.set(pair.term, colors[index % colors.length]));
        return map;
    }, [question.pairs]);

    useEffect(() => {
        setLeftItems(question.pairs.map(p => p.term).sort(() => Math.random() - 0.5));
        setRightItems(question.pairs.map(p => p.definition).sort(() => Math.random() - 0.5));
        setMatches(answerState ? answerState.selected : {});
        setSelectedLeft(null);
    }, [question, answerState]);

    useLayoutEffect(() => {
        if (!containerRef.current) return;
        // FIX: Cast querySelectorAll result to specify that `span` is an HTML element, giving it a `style` property.
        const spans = containerRef.current.querySelectorAll<HTMLSpanElement>('button > span');
        spans.forEach(span => {
            const button = span.parentElement;
            if(!button) return;

            const maxFontSize = 16;
            const minFontSize = 8;
            let currentSize = maxFontSize;
            
            span.style.fontSize = `${currentSize}px`;
            span.style.whiteSpace = 'nowrap';
            const checkOverflow = () => span.scrollWidth > button.clientWidth || span.scrollHeight > button.clientHeight;

            if (checkOverflow()) {
                span.style.whiteSpace = 'normal';
            }

            while (checkOverflow() && currentSize > minFontSize) {
                currentSize -= 0.5;
                span.style.fontSize = `${currentSize}px`;
            }
        });
    }, [leftItems, rightItems, question, containerRef]);


    useEffect(() => {
        if (!isAnswered && Object.keys(matches).length === question.pairs.length) {
            const isAllCorrect = question.pairs.every(p => matches[p.term] === p.definition);
            onAnswer(isAllCorrect, matches);
        }
    }, [matches, question.pairs, onAnswer, isAnswered]);

    const handleLeftClick = (term: string) => {
        if (isAnswered || matches[term]) return;
        setSelectedLeft(term === selectedLeft ? null : term);
    };

    const handleRightClick = (definition: string) => {
        if (isAnswered || !selectedLeft || Object.values(matches).includes(definition)) return;

        if (correctPairsMap.get(selectedLeft) === definition) {
            setMatches(prev => ({ ...prev, [selectedLeft]: definition }));
            playSound('correct');
        } else {
            playSound('incorrect');
            setIncorrectShake(definition);
            setTimeout(() => setIncorrectShake(null), 500);
        }
        setSelectedLeft(null);
    };

    const getItemClass = (item: string, side: 'left' | 'right') => {
        const isSelected = selectedLeft === item;
        const termForMatchCheck = side === 'left' ? item : definitionToTermMap.get(item);
        const isMatched = !!termForMatchCheck && !!matches[termForMatchCheck];
        
        const shakeClass = incorrectShake === item ? 'animate-shake' : '';
        const baseClass = 'w-full h-full transition-all duration-300 rounded-lg flex items-center justify-center text-center backdrop-blur-sm border-2';

        if (isAnswered) {
            const term = side === 'left' ? item : definitionToTermMap.get(item)!;
            const userMatch = answerState.selected[term];
            const correctMatch = correctPairsMap.get(term);
            
            if (userMatch === correctMatch) return `${baseClass} bg-green-500/50 border-green-400`;
            return `${baseClass} bg-red-500/50 border-red-400 opacity-70`;
        }
        
        if (isMatched) {
            const term = side === 'left' ? item : definitionToTermMap.get(item)!;
            const color = pairColors.get(term);
            return `${baseClass} ${color?.bg} ${color?.border}`;
        }

        if (isSelected) {
            return `${baseClass} bg-green-400/90 border-green-300 scale-105 ring-2 ring-green-200`;
        }
        
        return `${baseClass} bg-black/20 hover:bg-black/40 border-slate-600 ${shakeClass}`;
    };

    return (
        <div className="flex flex-col h-full w-full items-center">
             <div className="question-text-container py-2 flex-shrink-0">
                <div className="question-text text-lg sm:text-xl">{question.question || "Aşağıdaki ifadeleri doğru şekilde eşleştirin."}</div>
            </div>
            
            <div 
                ref={containerRef} 
                className="flex-grow w-full flex p-2 gap-2 bg-slate-900/30 border border-slate-700 rounded-lg -mx-6"
                style={{width: 'calc(100% + 48px)'}}
            >
                <div className="flex-1 grid gap-2" style={{ gridTemplateRows: `repeat(${question.pairs.length}, 1fr)`}}>
                    {leftItems.map(term => (
                        <button key={term} onClick={() => handleLeftClick(term)} disabled={isAnswered} className={getItemClass(term, 'left')}>
                            <span className="p-1">{term}</span>
                        </button>
                    ))}
                </div>
                <div className="flex-1 grid gap-2" style={{ gridTemplateRows: `repeat(${question.pairs.length}, 1fr)`}}>
                    {rightItems.map(definition => (
                        <button key={definition} onClick={() => handleRightClick(definition)} disabled={isAnswered || !selectedLeft || Object.values(matches).includes(definition)} className={getItemClass(definition, 'right')}>
                            <span className="p-1">{definition}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            <style>{`
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-6px); }
                    75% { transform: translateX(6px); }
                }
            `}</style>
        </div>
    );
};


// --- Main Game Screen ---

interface GameScreenProps {
  questions: Question[];
  settings: GameSettings;
  onGameEnd: (score: number, finalGroupScores?: { grup1: number, grup2: number }) => void;
  groupNames?: { grup1: string, grup2: string };
}

export const GameScreen: React.FC<GameScreenProps> = ({ questions, settings, onGameEnd, groupNames }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [groupScores, setGroupScores] = useState({ grup1: 0, grup2: 0 });
    const [activeGroup, setActiveGroup] = useState<'grup1' | 'grup2'>('grup1');
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_DEFAULT);
    const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [jokers, setJokers] = useState({ fiftyFifty: true, addTime: true, skip: true });
    const [jokerEffects, setJokerEffects] = useState<Record<number, { disabledOptions: string[] }>>({});
    const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

    const questionTextRef = useRef<HTMLDivElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    const isGroupMode = settings.competitionMode === 'grup';
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswerState = answers[currentQuestionIndex];
    const isAnswered = !!currentAnswerState;

    const { grup1: grup1Name = 'Grup 1', grup2: grup2Name = 'Grup 2' } = groupNames || {};

    const optionsToShow = useMemo(() => {
        if (currentAnswerState?.shuffledOptions) return currentAnswerState.shuffledOptions;
        
        if (currentQuestion?.type === 'quiz') {
            const quizQuestion = currentQuestion as QuizQuestion;
            return [...quizQuestion.options].sort(() => Math.random() - 0.5);
        }
        if (currentQuestion?.type === 'fill-in') {
            const fillInQuestion = currentQuestion as FillInQuestion;
            return [fillInQuestion.answer, ...fillInQuestion.distractors].sort(() => Math.random() - 0.5);
        }
    
        return [];
    }, [currentQuestion, currentAnswerState]);

    const playSound = useCallback((type: 'correct' | 'incorrect' | 'tick') => {
        if (!audioCtxRef.current) {
            try { audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); } 
            catch (e) { console.error("Web Audio API not supported."); return; }
        }
        const audioCtx = audioCtxRef.current;
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        switch(type) {
            case 'correct':
                gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
                oscillator.frequency.linearRampToValueAtTime(659.25, audioCtx.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
                break;
            case 'incorrect':
                gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(164.81, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
                break;
            case 'tick':
                gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
                break;
        }
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
    }, []);

    const handleAnswer = useCallback((isCorrect: boolean, selected: any, shuffledOptions?: string[]) => {
        const alreadyAnswered = answers[currentQuestionIndex];
        if (alreadyAnswered) return;

        if (currentQuestion.type !== 'matching') {
            playSound(isCorrect ? 'correct' : 'incorrect');
        }

        if (isCorrect) {
            const points = 10 + Math.floor(timeLeft / 2);
            if (isGroupMode) {
                setGroupScores(prev => ({ ...prev, [activeGroup]: prev[activeGroup] + points }));
            } else {
                setScore(prev => prev + points);
            }
        }
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: { selected, isCorrect, shuffledOptions } }));
        if (isGroupMode) setActiveGroup(prev => (prev === 'grup1' ? 'grup2' : 'grup1'));
        
    }, [answers, currentQuestionIndex, currentQuestion.type, timeLeft, isGroupMode, activeGroup, playSound]);


    // Timer Effect
    useEffect(() => {
        if (isAnswered) return;
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
            if (timeLeft <= 10) playSound('tick');
            return () => clearTimeout(timer);
        } else {
            handleAnswer(false, { timedOut: true }, optionsToShow);
        }
    }, [timeLeft, isAnswered, playSound, handleAnswer, optionsToShow]);

    // Question Change Effect
    useEffect(() => {
        const time = currentQuestion.type === 'matching' ? QUESTION_TIME_MATCHING : QUESTION_TIME_DEFAULT;
        setTimeLeft(time);
    }, [currentQuestionIndex, currentQuestion.type]);

    useLayoutEffect(() => {
        const textEl = questionTextRef.current;
        if (!textEl || currentQuestion?.type !== 'quiz') return;
        
        const container = textEl.parentElement;
        if (!container) return;
        
        const words = (currentQuestion as QuizQuestion).question.trim().split(/\s+/).length;
        const maxSize = 22;
        const minSize = 14;
        let size = Math.max(minSize, maxSize - Math.max(0, words - 30) * 0.15);
        textEl.style.fontSize = `${size}px`;

        while (textEl.scrollHeight > container.clientHeight && size > minSize) {
            size -= 0.5;
            textEl.style.fontSize = `${size}px`;
        }
    }, [currentQuestion]);
    
    const handlePrev = () => { if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1); };
    const handleNext = () => { if (currentQuestionIndex < questions.length - 1) setCurrentQuestionIndex(prev => prev + 1); };

    const useFiftyFifty = () => {
        if (!jokers.fiftyFifty || currentQuestion.type !== 'quiz' || isAnswered) return;
        setJokers(prev => ({ ...prev, fiftyFifty: false }));
        
        const incorrectOptions = optionsToShow.filter(opt => opt !== (currentQuestion as QuizQuestion).answer);
        const disabledOptions = incorrectOptions.sort(() => 0.5 - Math.random()).slice(0, 2);

        setJokerEffects(prev => ({
            ...prev,
            [currentQuestionIndex]: {
                disabledOptions: disabledOptions
            }
        }));
    };

    const useAddTime = () => {
        if (!jokers.addTime || isAnswered) return;
        setTimeLeft(prev => prev + 15);
        setJokers(prev => ({ ...prev, addTime: false }));
    };
    
    const useSkip = () => {
        if (!jokers.skip || isAnswered) return;
        handleAnswer(false, { skipped: true });
        setJokers(prev => ({ ...prev, skip: false }));
    }

    const renderQuestionContent = () => {
        if (!currentQuestion) return <div className="question-text">Sorular yükleniyor...</div>;

        switch (currentQuestion.type) {
            case 'quiz': {
                const quizQuestion = currentQuestion;
                const disabledByJokerOptions = jokerEffects[currentQuestionIndex]?.disabledOptions || [];
                
                const selectAnswer = (option: string) => {
                    if (isAnswered) return;
                    handleAnswer(option === quizQuestion.answer, option, optionsToShow);
                };
                
                const getOptionClass = (option: string) => {
                    if (!isAnswered) {
                        return disabledByJokerOptions.includes(option) ? 'hidden-by-joker' : '';
                    }
                    if (option === quizQuestion.answer) return 'correct';
                    if (option === currentAnswerState.selected) return 'incorrect';
                    return 'opacity-50';
                };

                return (
                    <>
                        {quizQuestion.imageUrl && (
                            <img 
                                src={quizQuestion.imageUrl} 
                                alt="Soru görseli (büyütmek için tıklayın)" 
                                className="max-h-52 w-auto mx-auto rounded-lg mb-4 object-contain cursor-pointer transition-transform hover:scale-105"
                                onClick={() => setLightboxImageUrl(quizQuestion.imageUrl)}
                            />
                        )}
                        <div className="question-text-container">
                            <div ref={questionTextRef} className="question-text">{quizQuestion.question}</div>
                        </div>
                        <div className="answer-options">
                            {optionsToShow.map((option) => (
                                <button key={option} onClick={() => selectAnswer(option)} disabled={isAnswered || disabledByJokerOptions.includes(option)} className={`option ${getOptionClass(option)}`}>
                                    {option}
                                </button>
                            ))}
                        </div>
                    </>
                );
            }
            case 'matching':
                return <MatchingView key={currentQuestion.id} question={currentQuestion} onAnswer={handleAnswer} answerState={currentAnswerState} playSound={playSound} />;
            
            case 'fill-in': {
                const fillInQuestion = currentQuestion as FillInQuestion;
                const [part1, part2] = useMemo(() => fillInQuestion.sentence.split('___'), [fillInQuestion.sentence]);

                const selectAnswer = (option: string) => {
                    if (isAnswered) return;
                    handleAnswer(option === fillInQuestion.answer, option, optionsToShow);
                };

                const getOptionClass = (option: string) => {
                    if (!isAnswered) return '';
                    if (option === fillInQuestion.answer) return 'correct';
                    if (option === currentAnswerState.selected) return 'incorrect';
                    return 'opacity-50';
                };

                return (
                    <>
                        <div className="question-text-container">
                             <div 
                                ref={questionTextRef} 
                                className="question-text text-2xl sm:text-3xl leading-relaxed text-center p-4 flex flex-wrap items-center justify-center"
                             >
                                <span>{part1}</span>
                                <span 
                                    className={`inline-block font-bold text-2xl sm:text-4xl mx-2 px-3 py-1 rounded-lg transition-colors duration-500 ${isAnswered ? (currentAnswerState.isCorrect ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-300') : 'bg-slate-700/80 text-slate-300'}`}
                                    style={{ minWidth: '150px' }}
                                >
                                    {isAnswered ? currentAnswerState.selected : '...'}
                                </span>
                                <span>{part2}</span>
                            </div>
                        </div>
                        <div className="answer-options grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                            {optionsToShow.map((option) => (
                                <button 
                                    key={option} 
                                    onClick={() => selectAnswer(option)} 
                                    disabled={isAnswered} 
                                    className={`option justify-center ${getOptionClass(option)}`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </>
                );
            }

            default:
                return <div className="p-4 text-center text-lg text-amber-300">Bilinmeyen soru tipi. Lütfen Çoktan Seçmeli modunu deneyin.</div>;
        }
    };

    return (
        <div className="quiz-container">
            <div className="top-nav">
                <button className="nav-btn" onClick={handlePrev} disabled={currentQuestionIndex === 0}>Önceki</button>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
                </div>
                <button className="nav-btn" onClick={handleNext} disabled={currentQuestionIndex >= questions.length - 1 || !isAnswered}>Sonraki</button>
            </div>

            <div className="hud">
                <div className="timer">{`00:${String(timeLeft).padStart(2, '0')}`}</div>
                <div className="jokers">
                    {currentQuestion?.type === 'quiz' && (
                         <button className="joker-btn" onClick={useFiftyFifty} disabled={!jokers.fiftyFifty || isAnswered}>50:50</button>
                    )}
                    <button className="joker-btn" onClick={useSkip} disabled={!jokers.skip || isAnswered}>Atla</button>
                    <button className="joker-btn" onClick={useAddTime} disabled={!jokers.addTime || isAnswered}>+15sn</button>
                </div>
                {isGroupMode ? (
                    <div className="group-scores">
                        <span>{grup1Name}: {groupScores.grup1}</span> | <span>{grup2Name}: {groupScores.grup2}</span>
                    </div>
                ) : (
                    <div className="score">Skor: <span>{score}</span></div>
                )}
            </div>

            <div className="question-card">
                {renderQuestionContent()}
            </div>

            <div className="footer">
                <button className="finish-btn" onClick={() => setShowEndConfirm(true)}>🏁 Yarışmayı Bitir</button>
            </div>
            
            {lightboxImageUrl && (
                <div 
                    className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 cursor-pointer animate-fadeIn" 
                    onClick={() => setLightboxImageUrl(null)}
                >
                    <img 
                        src={lightboxImageUrl} 
                        alt="Soru görseli - büyütülmüş" 
                        className="max-w-full max-h-full object-contain cursor-default rounded-lg shadow-2xl" 
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}

            <Modal 
                isOpen={showEndConfirm}
                title="Yarışmayı Bitir"
                message="Yarışmayı bitirmek istediğinizden emin misiniz?"
                onConfirm={() => onGameEnd(score, isGroupMode ? groupScores : undefined)}
                onCancel={() => setShowEndConfirm(false)}
            />
        </div>
    );
};
