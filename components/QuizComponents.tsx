import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import type { Question, GameSettings, QuizQuestion, FillInQuestion, MatchingQuestion, MatchingPair } from '../types';
import { Button, Modal } from './UI';

// --- Helper Functions & Constants ---

const QUESTION_TIME_QUIZ = 40;
const QUESTION_TIME_FILL_IN = 35;
const QUESTION_TIME_MATCHING = 40;
const QUESTION_TIME_PARAGRAPH = 70; // Paragraf soruları için yeni zaman sabiti
const MASTER_TIME_DEFAULT = 120; // 2 minutes for timed challenge

// FIX: Added missing 'AnswerState' interface definition.
interface AnswerState {
  selected: any;
  isCorrect: boolean;
  shuffledOptions?: string[];
}

// --- Dynamic Font Sizing Hook ---
const useFitText = (text: string) => {
    const textRef = useRef<HTMLDivElement>(null);

    const fitTextCallback = useCallback(() => {
        const el = textRef.current;
        if (!el || !el.parentElement) return;
        const container = el.parentElement;

        // To avoid a flash of oversized text, we work on a hidden element
        el.style.visibility = 'hidden';

        // Set a reasonable upper bound for smart boards and a minimum for readability
        const maxFontSize = 100;
        const minFontSize = 14;
        let currentSize = maxFontSize;

        el.style.fontSize = `${currentSize}px`;

        // Check for both vertical and horizontal overflow
        const isOverflowing = () => el.scrollHeight > container.clientHeight || el.scrollWidth > container.clientWidth;

        // Iteratively decrease font size until it fits within the container
        while (isOverflowing() && currentSize > minFontSize) {
            currentSize -= 1;
            el.style.fontSize = `${currentSize}px`;
        }
        
        // Make the correctly sized text visible again
        el.style.visibility = 'visible';
    }, []); // This callback has no dependencies as it only operates on DOM refs

    useLayoutEffect(() => {
        // Run the fitting logic when the component mounts/text changes
        fitTextCallback();

        // Also run it on window resize to handle responsive changes
        window.addEventListener('resize', fitTextCallback);
        
        // Cleanup function to remove the event listener
        return () => {
            window.removeEventListener('resize', fitTextCallback);
        };
    }, [text, fitTextCallback]); // Rerun the effect if the text content changes

    return textRef;
};

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
        <>
            <div className="question-text-container">
                 <div className="question-text">{question.question || "Aşağıdaki ifadeleri doğru şekilde eşleştirin."}</div>
            </div>
            <div 
                ref={containerRef} 
                className="flex-grow w-full flex p-2 gap-2"
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
        </>
    );
};


// --- Main Game Screen ---

interface GameScreenProps {
  questions: Question[];
  settings: GameSettings;
  onGameEnd: (score: number, finalGroupScores?: { grup1: number, grup2: number }) => void;
  onQuestionAnswered: (questionId: number) => void;
  groupNames?: { grup1: string, grup2: string };
  subjectId: string;
}

export const GameScreen: React.FC<GameScreenProps> = ({ questions, settings, onGameEnd, onQuestionAnswered, groupNames, subjectId }) => {
    const { quizMode = 'klasik' } = settings;
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

    // Mode-specific state
    const [score, setScore] = useState(0);
    const [groupScores, setGroupScores] = useState({ grup1: 0, grup2: 0 });
    const [streak, setStreak] = useState(0);
    const [masterTimeLeft, setMasterTimeLeft] = useState(MASTER_TIME_DEFAULT);
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_QUIZ);

    // Common state
    const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [jokers, setJokers] = useState({ fiftyFifty: true, addTime: true, skip: true });
    const [jokerEffects, setJokerEffects] = useState<Record<number, { disabledOptions: string[] }>>({});
    const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
    const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const isGroupMode = settings.competitionMode === 'grup';
    const activeGroup = useMemo(() => {
        if (!isGroupMode) return 'grup1'; // Not used in individual mode
        const totalAnswers = Object.keys(answers).length;
        return totalAnswers % 2 === 0 ? 'grup1' : 'grup2';
    }, [isGroupMode, answers]);
    
    useEffect(() => {
      const loadVoices = () => {
        voicesRef.current = window.speechSynthesis.getVoices();
      };
      
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      };
    }, []);

    useEffect(() => {
        // Shuffle questions for all modes except classic for variety
        if (quizMode !== 'klasik') {
            setShuffledQuestions([...questions].sort(() => Math.random() - 0.5));
        } else {
            setShuffledQuestions(questions);
        }
        setCurrentQuestionIndex(0);
        setAnswers({});
        setScore(0);
        setStreak(0);
        setMasterTimeLeft(MASTER_TIME_DEFAULT);
    }, [questions, quizMode]);

    const totalQuestions = useMemo(() => shuffledQuestions.length, [shuffledQuestions]);
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const currentAnswerState = answers[currentQuestionIndex];
    const isAnswered = !!currentAnswerState;

    // FIX: All hooks are moved to the top-level to prevent conditional rendering errors.
    const isParagraphQuestion = useMemo(() => {
        if (currentQuestion?.type !== 'quiz') return false;
        return subjectId === 'paragraph' && (currentQuestion as QuizQuestion).question.includes('\n\n');
    }, [currentQuestion, subjectId]);

    const { paragraph, questionText } = useMemo(() => {
        if (!currentQuestion) return { paragraph: null, questionText: '' };

        if (currentQuestion.type === 'quiz') {
            const quizQuestion = currentQuestion as QuizQuestion;
            if (isParagraphQuestion) {
                const parts = quizQuestion.question.split('\n\n');
                return {
                    paragraph: parts.slice(0, -1).join('\n\n'),
                    questionText: parts.slice(-1)[0]
                };
            }
            return { paragraph: null, questionText: quizQuestion.question };
        }
        
        if (currentQuestion.type === 'fill-in') {
            return { paragraph: null, questionText: (currentQuestion as FillInQuestion).sentence };
        }

        return { paragraph: null, questionText: '' };
    }, [currentQuestion, isParagraphQuestion]);

    // This hook is now called unconditionally. For paragraph questions which don't need
    // text fitting, we pass an empty string to satisfy the rules of hooks.
    const questionTextRef = useFitText(isParagraphQuestion ? '' : (questionText || ''));

    const { grup1: grup1Name = 'Grup 1', grup2: grup2Name = 'Grup 2' } = groupNames || {};
    
    const finishGame = useCallback(() => {
        window.speechSynthesis.cancel();
        let finalScore = 0;
        if (quizMode === 'zamana-karsi') {
            // FIX: Explicitly type 'a' as AnswerState to resolve 'isCorrect does not exist on unknown' error.
            finalScore = Object.values(answers).filter((a: AnswerState) => a.isCorrect).length * 10;
        } else if (quizMode === 'hayatta-kalma') {
            finalScore = streak;
        } else if (isGroupMode) {
            finalScore = Math.max(groupScores.grup1, groupScores.grup2);
        } else {
            finalScore = score;
        }
        onGameEnd(finalScore, isGroupMode ? groupScores : undefined);
    }, [quizMode, streak, score, groupScores, isGroupMode, onGameEnd, answers]);

    const goToNextQuestion = useCallback(() => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            if (quizMode !== 'zamana-karsi') {
                finishGame();
            }
        }
    }, [currentQuestionIndex, totalQuestions, finishGame, quizMode]);

    const optionsToShow = useMemo(() => {
        if (currentAnswerState?.shuffledOptions) return currentAnswerState.shuffledOptions;
        if (!currentQuestion) return [];
        
        if (currentQuestion.type === 'quiz') {
            return [...currentQuestion.options].sort(() => Math.random() - 0.5);
        }
        if (currentQuestion.type === 'fill-in') {
            return [currentQuestion.answer, ...currentQuestion.distractors].sort(() => Math.random() - 0.5);
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
        // In timed mode, allow changing answer. In others, only answer once.
        if (isAnswered && quizMode !== 'zamana-karsi') return;

        if (!isAnswered) {
            onQuestionAnswered(currentQuestion.id);
        }

        playSound(isCorrect ? 'correct' : 'incorrect');
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: { selected, isCorrect, shuffledOptions } }));

        if (quizMode === 'hayatta-kalma') {
            if (isCorrect) {
                // Only update streak if it's the first time answering this question correctly
                if (!isAnswered) setStreak(prev => prev + 1);
            } else {
                setTimeout(finishGame, 1000); // Game over
            }
        } else if (quizMode === 'zamana-karsi') {
            // Score is calculated at the end. Just record the answer.
        } else { // Klasik mod
            if (!isAnswered) { // Only award points once
                if (isCorrect) {
                    const points = 10 + Math.floor(timeLeft / 2);
                    if (isGroupMode) {
                        setGroupScores(prev => ({ ...prev, [activeGroup]: prev[activeGroup] + points }));
                    } else {
                        setScore(prev => prev + points);
                    }
                }
            }
        }
    }, [answers, currentQuestionIndex, quizMode, timeLeft, isGroupMode, activeGroup, playSound, finishGame, isAnswered, onQuestionAnswered, currentQuestion]);

    const speakQuestionFlow = useCallback(() => {
        if (!isSpeechEnabled || !currentQuestion) return;

        window.speechSynthesis.cancel();

        const partsToRead: string[] = [];

        switch (currentQuestion.type) {
            case 'quiz': {
                const quizQ = currentQuestion as QuizQuestion;
                partsToRead.push(questionText || quizQ.question);
                optionsToShow.forEach(option => {
                    partsToRead.push(option);
                });
                break;
            }
            case 'fill-in': {
                const fillInQ = currentQuestion as FillInQuestion;
                const sentenceParts = fillInQ.sentence.split('___');
                partsToRead.push(sentenceParts[0]);
                partsToRead.push("boşluk");
                if (sentenceParts[1]) partsToRead.push(sentenceParts[1]);
                partsToRead.push("Seçenekler şunlar:");
                optionsToShow.forEach(option => partsToRead.push(option));
                break;
            }
            case 'matching': {
                const matchingQ = currentQuestion as MatchingQuestion;
                partsToRead.push(matchingQ.question || "Aşağıdaki ifadeleri doğru şekilde eşleştirin.");
                break;
            }
        }

        if (partsToRead.length === 0) return;

        let partIndex = 0;
        const speakNextPart = () => {
            if (!isSpeechEnabled || partIndex >= partsToRead.length) return;
            
            const textToSpeak = partsToRead[partIndex];
            partIndex++;
            
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            
            // Smarter voice selection logic
            const turkishVoices = voicesRef.current.filter(voice => voice.lang === 'tr-TR');
            
            // Prioritize known high-quality voices
            const findVoice = (keyword: string) => 
                turkishVoices.find(v => v.name.toLowerCase().includes(keyword));

            const yeldaVoice = findVoice('yelda'); // Apple
            const googleVoice = findVoice('google'); // Google/Android
            const aylinVoice = findVoice('aylin'); // Microsoft
            
            // Select the best available voice in order of priority
            utterance.voice = aylinVoice || yeldaVoice || googleVoice || turkishVoices[0] || null;
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            
            utterance.onend = () => {
                setTimeout(speakNextPart, 350);
            };
            
            window.speechSynthesis.speak(utterance);
        };

        speakNextPart();

    }, [isSpeechEnabled, currentQuestion, optionsToShow, questionText]);

    const toggleSpeech = useCallback(() => {
        setIsSpeechEnabled(prev => {
            const isNowEnabled = !prev;
            if (!isNowEnabled) {
                window.speechSynthesis.cancel();
            }
            return isNowEnabled;
        });
    }, []);


    // Timers Effect
    useEffect(() => {
        if (quizMode === 'zamana-karsi') {
            if (masterTimeLeft > 0 && totalQuestions > 0) {
                const timer = setTimeout(() => setMasterTimeLeft(prev => prev - 1), 1000);
                if (masterTimeLeft <= 10) playSound('tick');
                return () => clearTimeout(timer);
            } else if (totalQuestions > 0) {
                finishGame();
            }
        } else { // Klasik and Hayatta Kalma
            if (isAnswered || totalQuestions === 0) return;
            if (timeLeft > 0) {
                const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
                if (timeLeft <= 10) playSound('tick');
                return () => clearTimeout(timer);
            } else {
                handleAnswer(false, { timedOut: true }, optionsToShow);
            }
        }
    }, [timeLeft, masterTimeLeft, isAnswered, playSound, handleAnswer, quizMode, finishGame, totalQuestions, optionsToShow]);

    // Question Change Effect
    useEffect(() => {
        if (quizMode === 'klasik' || quizMode === 'hayatta-kalma') {
            let time;

            if (subjectId === 'paragraph' && currentQuestion?.type === 'quiz') {
                time = QUESTION_TIME_PARAGRAPH;
            } else {
                switch(currentQuestion?.type) {
                    case 'quiz':
                        time = QUESTION_TIME_QUIZ;
                        break;
                    case 'fill-in':
                        time = QUESTION_TIME_FILL_IN;
                        break;
                    case 'matching':
                        time = QUESTION_TIME_MATCHING;
                        break;
                    default:
                        time = QUESTION_TIME_QUIZ; // Default to quiz time
                }
            }
            
            if (quizMode === 'hayatta-kalma') {
                time = Math.max(10, time - streak); // Gets harder as you go
            }
            setTimeLeft(time);
        }
    }, [currentQuestionIndex, currentQuestion?.type, quizMode, streak, subjectId]);
    
    useEffect(() => {
        if (isSpeechEnabled) {
            const timerId = setTimeout(() => speakQuestionFlow(), 600);
            return () => clearTimeout(timerId);
        } else {
            window.speechSynthesis.cancel();
        }
    }, [currentQuestionIndex, isSpeechEnabled, speakQuestionFlow]);

    const handlePrev = () => { if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1); };
    
    const useFiftyFifty = () => {
        if (!jokers.fiftyFifty || currentQuestion.type !== 'quiz' || (isAnswered && quizMode !== 'zamana-karsi')) return;
        setJokers(prev => ({ ...prev, fiftyFifty: false }));
        
        const incorrectOptions = optionsToShow.filter(opt => opt !== (currentQuestion as QuizQuestion).answer);
        const disabledOptions = incorrectOptions.sort(() => 0.5 - Math.random()).slice(0, 2);

        setJokerEffects(prev => ({ ...prev, [currentQuestionIndex]: { disabledOptions }}));
    };

    const useAddTime = () => {
        if (!jokers.addTime || (isAnswered && quizMode !== 'zamana-karsi')) return;
        if (quizMode === 'zamana-karsi') {
            setMasterTimeLeft(prev => prev + 15);
        } else {
            setTimeLeft(prev => prev + 15);
        }
        setJokers(prev => ({ ...prev, addTime: false }));
    };
    
    const useSkip = () => {
        if (!jokers.skip || (isAnswered && quizMode === 'hayatta-kalma')) return;
        setJokers(prev => ({ ...prev, skip: false }));

        if (quizMode === 'hayatta-kalma') {
            handleAnswer(false, { skipped: true });
        } else { // Klasik and Zamana Karsi
            goToNextQuestion();
        }
    }

    const renderQuestionContent = () => {
        if (!currentQuestion) return null;

        switch (currentQuestion.type) {
            case 'quiz': {
                const quizQuestion = currentQuestion;
                const disabledByJokerOptions = jokerEffects[currentQuestionIndex]?.disabledOptions || [];
                
                const selectAnswer = (option: string) => {
                    if (isAnswered && quizMode !== 'zamana-karsi') return;
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
                                src={`data:image/png;base64,${quizQuestion.imageUrl}`} 
                                alt="Soru görseli (büyütmek için tıklayın)" 
                                className="max-h-52 w-auto mx-auto rounded-lg mb-2 object-contain cursor-pointer transition-transform hover:scale-105"
                                onClick={() => setLightboxImageUrl(quizQuestion.imageUrl)}
                            />
                        )}
                        {isParagraphQuestion ? (
                            <div className="question-text-container paragraph-mode">
                                <p className="paragraph-text">{paragraph}</p>
                                <p className="question-text-for-paragraph">{questionText}</p>
                            </div>
                        ) : (
                            <div className="question-text-container">
                                <div ref={questionTextRef} className="question-text">{questionText}</div>
                            </div>
                        )}
                        <div className="answer-options">
                            {optionsToShow.map((option) => (
                                <button key={option} onClick={() => selectAnswer(option)} disabled={(isAnswered && quizMode !== 'zamana-karsi') || disabledByJokerOptions.includes(option)} className={`option ${getOptionClass(option)}`}>
                                    {option}
                                </button>
                            ))}
                        </div>
                        {isAnswered && quizQuestion.explanation && (
                            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg animate-fadeIn">
                                <h4 className="flex items-center gap-2 font-bold text-lg text-green-200 mb-2">
                                    <span>💡</span>
                                    <span>Doğru Cevabın Açıklaması</span>
                                </h4>
                                <p className="text-slate-200">{quizQuestion.explanation}</p>
                            </div>
                        )}
                    </>
                );
            }
            case 'matching':
                const onMatchingAnswer = (isCorrect: boolean, selected: any) => {
                     handleAnswer(isCorrect, selected);
                }
                return <MatchingView key={currentQuestion.id} question={currentQuestion} onAnswer={onMatchingAnswer} answerState={currentAnswerState} playSound={playSound} />;
            
            case 'fill-in': {
                const fillInQuestion = currentQuestion as FillInQuestion;

                const selectAnswer = (option: string) => {
                    if (isAnswered && quizMode !== 'zamana-karsi') return;
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
                            <div ref={questionTextRef} className="question-text">
                                <div className="leading-relaxed text-center flex flex-wrap items-center justify-center">
                                    <span>{fillInQuestion.sentence.split('___')[0]}</span>
                                    <span 
                                        className={`inline-block font-bold mx-2 px-3 py-1 rounded-lg transition-colors duration-500 ${isAnswered ? (currentAnswerState.isCorrect ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-300') : 'bg-slate-700/80 text-slate-300'}`}
                                        style={{ minWidth: '150px' }}
                                    >
                                        {isAnswered
                                            ? (typeof currentAnswerState.selected === 'string'
                                                ? currentAnswerState.selected
                                                : 'Süre Doldu')
                                            : '...'}
                                    </span>
                                    <span>{fillInQuestion.sentence.split('___')[1]}</span>
                                </div>
                            </div>
                        </div>
                        <div className="answer-options grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                            {optionsToShow.map((option) => (
                                <button 
                                    key={option} 
                                    onClick={() => selectAnswer(option)} 
                                    disabled={isAnswered && quizMode !== 'zamana-karsi'} 
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
    
    const formatTime = (seconds: number) => {
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        return `${mins}:${secs}`;
    }

    const prevDisabled = currentQuestionIndex === 0 || quizMode === 'hayatta-kalma';
    const nextDisabled = useMemo(() => {
        if (currentQuestionIndex >= totalQuestions - 1) return true;
        if (quizMode === 'hayatta-kalma') {
            return !isAnswered || !currentAnswerState.isCorrect;
        }
        if (quizMode === 'klasik') {
            return !isAnswered;
        }
        return false; // Free navigation for timed mode
    }, [currentQuestionIndex, totalQuestions, quizMode, isAnswered, currentAnswerState]);

    const jokerDisabled = isAnswered && quizMode !== 'zamana-karsi';

    return (
        <div className="quiz-container">
            <div className="top-nav">
                <button className="nav-btn" onClick={handlePrev} disabled={prevDisabled}>Önceki</button>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${((currentQuestionIndex + 1) / (totalQuestions || 1)) * 100}%` }}></div>
                </div>
                <button className="nav-btn" onClick={goToNextQuestion} disabled={nextDisabled}>Sonraki</button>
            </div>

            <div className="hud">
                 {quizMode === 'zamana-karsi' ? (
                     <div className="timer">{formatTime(masterTimeLeft)}</div>
                 ) : (
                     <div className="timer">{formatTime(timeLeft)}</div>
                 )}
                <div className="jokers">
                    {currentQuestion?.type === 'quiz' && (
                         <button className="joker-btn" onClick={useFiftyFifty} disabled={!jokers.fiftyFifty || jokerDisabled}>50:50</button>
                    )}
                    <button className="joker-btn" onClick={useSkip} disabled={!jokers.skip || (quizMode === 'hayatta-kalma' && isAnswered)}>Atla</button>
                    <button className="joker-btn" onClick={useAddTime} disabled={!jokers.addTime || jokerDisabled}>+15sn</button>
                    <button 
                        onClick={toggleSpeech}
                        className={`joker-btn text-lg ${isSpeechEnabled ? 'bg-green-500/60 border-green-400' : ''}`}
                        aria-label={isSpeechEnabled ? "Sesli okumayı kapat" : "Sesli okumayı aç"}
                        title={isSpeechEnabled ? "Sesli okumayı kapat" : "Sesli okumayı aç"}
                    >
                        🔊
                    </button>
                </div>
                {quizMode === 'hayatta-kalma' ? (
                     <div className="score">Seri: <span>{streak}</span></div>
                ) : isGroupMode ? (
                    <div className="group-scores">
                        <span>{grup1Name}: {groupScores.grup1}</span> | <span>{grup2Name}: {groupScores.grup2}</span>
                    </div>
                ) : (
                    <div className="score">Skor: <span>{quizMode === 'zamana-karsi' ? 
// FIX: Explicitly type 'a' as AnswerState to resolve 'isCorrect does not exist on unknown' error.
                    (Object.values(answers).filter((a: AnswerState) => a.isCorrect).length * 10) : score}</span></div>
                )}
            </div>
            
            <div key={currentQuestionIndex} className="question-card animate-question-transition">
                {renderQuestionContent()}
                <div className="footer">
                   <button className="finish-btn" onClick={() => setShowEndConfirm(true)}>🏁 Yarışmayı Bitir</button>
                </div>
            </div>
            
            {lightboxImageUrl && (
                <div 
                    className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 cursor-pointer animate-fadeIn" 
                    onClick={() => setLightboxImageUrl(null)}
                >
                    <img 
                        src={`data:image/png;base64,${lightboxImageUrl}`} 
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
                onConfirm={finishGame}
                onCancel={() => setShowEndConfirm(false)}
            />
        </div>
    );
};