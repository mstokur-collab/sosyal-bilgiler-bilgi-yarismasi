import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { QuizQuestion, GameSettings } from '../types';
import { Modal } from './UI';

// --- Shared Styles ---
const kapismaSharedStyles = `
    .kapisma-bg {
        background: linear-gradient(90deg, #0a1e6e 0%, #000000 50%, #6e0a0a 100%);
        position: relative;
        overflow: hidden;
    }
    .kapisma-bg::before, .kapisma-bg::after {
        content: '';
        position: absolute;
        top: 0;
        width: 50%;
        height: 100%;
        background-image: radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        background-size: 20px 20px;
        opacity: 0.5;
        pointer-events: none; /* FIX: Allow clicks to pass through the background overlay */
    }
    .kapisma-bg::before { left: 0; }
    .kapisma-bg::after { right: 0; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
`;

// --- Custom Audio Hook for Kapisma ---
const useKapismaAudio = () => {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const shuffleIntervalRef = useRef<number | null>(null);

    const playSound = useCallback((type: 'click' | 'correct' | 'incorrect' | 'score' | 'shuffle_tick') => {
        if (!audioCtxRef.current) {
            try {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API not supported.");
                return;
            }
        }
        const audioCtx = audioCtxRef.current;
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        switch(type) {
            case 'click':
                gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
                break;
            case 'shuffle_tick':
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(Math.random() * 400 + 600, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
                break;
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
            case 'score':
                gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
                oscillator.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
                gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
                break;
        }
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
    }, []);

    const startShuffle = useCallback(() => {
        if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
        shuffleIntervalRef.current = window.setInterval(() => {
            playSound('shuffle_tick');
        }, 100);
    }, [playSound]);

    const stopShuffle = useCallback(() => {
        if (shuffleIntervalRef.current) {
            clearInterval(shuffleIntervalRef.current);
            shuffleIntervalRef.current = null;
        }
    }, []);

    return { 
        playClick: () => playSound('click'),
        playCorrect: () => playSound('correct'),
        playIncorrect: () => playSound('incorrect'),
        playScore: () => playSound('score'),
        startShuffle, 
        stopShuffle 
    };
};

// --- Custom Hook for Shuffling Animation ---
const useShufflingNumber = (isAnimating: boolean, maxValue: number, finalValue: number | null) => {
  const [displayValue, setDisplayValue] = useState<number | string>('?');
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isAnimating) {
      setDisplayValue('?');
      intervalRef.current = window.setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * maxValue) + 1);
      }, 70);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (finalValue !== null) {
        setDisplayValue(finalValue);
      } else {
        setDisplayValue('?');
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAnimating, maxValue, finalValue]);

  return displayValue;
};


// --- Helper Components ---

const AnimatedScore = ({
  isAnimating,
  startPos,
  targetPos,
  onAnimationEnd,
  text
}: {
  isAnimating: boolean;
  startPos: { x: number; y: number };
  targetPos: { x: number; y: number };
  onAnimationEnd: () => void;
  text: string;
}) => {
  if (!isAnimating) return null;

  const style = {
    '--start-x': `${startPos.x}px`,
    '--start-y': `${startPos.y}px`,
    '--target-x': `${targetPos.x}px`,
    '--target-y': `${targetPos.y}px`,
  } as React.CSSProperties;

  return (
    <>
      <style>{`
        @keyframes flyToScore {
          0% {
            transform: translate(var(--start-x), var(--start-y)) scale(1.5);
            opacity: 1;
          }
          100% {
            transform: translate(var(--target-x), var(--target-y)) scale(0.3);
            opacity: 0;
          }
        }
        .score-fly-animation {
          position: fixed;
          left: 0;
          top: 0;
          color: #f59e0b; /* amber-500 */
          font-size: 5rem;
          font-weight: 900;
          text-shadow: 0 0 15px rgba(0,0,0,0.7);
          pointer-events: none;
          z-index: 100;
          animation: flyToScore 1.2s cubic-bezier(0.5, 0, 0.9, 0.5) forwards;
        }
      `}</style>
      <div
        className="score-fly-animation"
        style={style}
        onAnimationEnd={onAnimationEnd}
      >
        {text}
      </div>
    </>
  );
};

// --- Game Screens ---

const KapismaVSScreen = ({
  isIntro,
  isMatching,
  playerA,
  playerB,
  teamACount,
  teamBCount,
  onStartMatch,
  onGoToQuestion,
  audio
}: {
  isIntro: boolean;
  isMatching?: boolean;
  playerA: number | null;
  playerB: number | null;
  teamACount?: number;
  teamBCount?: number;
  onStartMatch: () => void;
  onGoToQuestion: () => void;
  audio: ReturnType<typeof useKapismaAudio>;
}) => {
    const displayPlayerA = useShufflingNumber(isMatching || false, teamACount || 1, playerA);
    const displayPlayerB = useShufflingNumber(isMatching || false, teamBCount || 1, playerB);

    useEffect(() => {
        if(isMatching) {
            audio.startShuffle();
        } else {
            audio.stopShuffle();
        }
        return () => audio.stopShuffle();
    }, [isMatching, audio]);

    const handleStartClick = () => {
        audio.playClick();
        onStartMatch();
    };

    const handleGoToQuestionClick = () => {
        audio.playClick();
        onGoToQuestion();
    }

    return (
        <div className="w-full h-full flex flex-col justify-center items-center text-center p-4 sm:p-6 kapisma-bg">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
            <div className="relative z-10 flex flex-col items-center animate-fadeIn">
                <h2 className="text-4xl font-bold text-white tracking-widest">
                    <span className="text-yellow-400">⚡</span> EŞLEŞTİRME HAZIR! <span className="text-yellow-400">⚡</span>
                </h2>
                <p className="text-xl text-slate-300 mt-2">Kapışmaya hazır ol!</p>
                
                <div className="flex items-center justify-center my-12 w-full max-w-2xl">
                    <div className="flex flex-col items-center">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 bg-blue-600 rounded-full flex items-center justify-center text-6xl font-extrabold shadow-2xl border-4 border-blue-400">
                            {isIntro ? '?' : displayPlayerA}
                        </div>
                        <p className="mt-4 text-2xl font-semibold">Takım A</p>
                    </div>
                    <div className="text-8xl sm:text-9xl font-black text-slate-300 mx-8 sm:mx-16" style={{textShadow: '0 5px 20px rgba(0,0,0,0.5)'}}>VS</div>
                    <div className="flex flex-col items-center">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 bg-red-600 rounded-full flex items-center justify-center text-6xl font-extrabold shadow-2xl border-4 border-red-400">
                            {isIntro ? '?' : displayPlayerB}
                        </div>
                        <p className="mt-4 text-2xl font-semibold">Takım B</p>
                    </div>
                </div>

                {isIntro ? (
                    <button onClick={handleStartClick} className="px-10 py-4 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-lg transition-transform hover:scale-105">
                        ⚔️ EŞLEŞTİRMEYE BAŞLA!
                    </button>
                ) : isMatching ? (
                    <div className="px-10 py-4 text-xl font-bold text-white bg-gradient-to-r from-gray-600 to-slate-600 rounded-full shadow-lg animate-pulse">
                        Eşleştiriliyor...
                    </div>
                ) : (
                    <button onClick={handleGoToQuestionClick} className="px-10 py-4 text-xl font-bold text-slate-900 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full shadow-lg transition-transform hover:scale-105">
                        → SORUYA GEÇ!
                    </button>
                )}
            </div>
        </div>
    );
};

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

const KapismaQuestionScreen: React.FC<KapismaQuestionScreenProps> = ({
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
                    {/* Team A Answers */}
                    <div className="w-1/2 h-full bg-black/20 border-2 border-blue-400 rounded-2xl p-4">
                        <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
                            {question.options.map(opt => (
                                <button key={`a-${opt}`} onClick={(e) => onAnswer('a', opt, e)} disabled={!!selectedAnswer} className={getButtonClass('a', opt)}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Divider */}
                    <div className="w-2 h-4/5 bg-slate-600 rounded-full"></div>

                    {/* Team B Answers */}
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

// --- Main Game Component ---

export const KapismaGame: React.FC<{
  questions: QuizQuestion[];
  settings: GameSettings;
  onGameEnd: (score: number, finalGroupScores?: { grup1: number, grup2: number }) => void;
}> = ({ questions, settings, onGameEnd }) => {
    const [screen, setScreen] = useState<'intro' | 'vs' | 'question'>('intro');
    const [scores, setScores] = useState({ a: 0, b: 0 });
    const [questionIndex, setQuestionIndex] = useState(0);
    const [playerA, setPlayerA] = useState<number | null>(null);
    const [playerB, setPlayerB] = useState<number | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<{ team: 'a' | 'b'; option: string } | null>(null);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isMatching, setIsMatching] = useState(false);

    const audio = useKapismaAudio();

    // Animation state
    const [animation, setAnimation] = useState({
        active: false,
        startPos: { x: 0, y: 0 },
        targetPos: { x: 0, y: 0 },
    });
    const scoreARef = useRef<HTMLDivElement>(null);
    const scoreBRef = useRef<HTMLDivElement>(null);
    
    const teamACount = settings.teamACount || 1;
    const teamBCount = settings.teamBCount || 1;
    const currentQuestion = questions[questionIndex];

    const matchPlayers = useCallback(() => {
        const nextPlayerA = Math.floor(Math.random() * teamACount) + 1;
        const nextPlayerB = Math.floor(Math.random() * teamBCount) + 1;
        setPlayerA(nextPlayerA);
        setPlayerB(nextPlayerB);
    }, [teamACount, teamBCount]);
    
    const startRoundAnimation = () => {
        setIsMatching(true);
        setPlayerA(null);
        setPlayerB(null);
        setScreen('vs');
        
        setTimeout(() => {
            matchPlayers();
            setIsMatching(false);
        }, 3000); // 3 seconds animation
    };

    const handleStartMatch = () => {
        startRoundAnimation();
    };

    const handleGoToQuestion = () => {
        setSelectedAnswer(null);
        setScreen('question');
    };

    const handleAnswer = (team: 'a' | 'b', option: string, event: React.MouseEvent<HTMLButtonElement>) => {
        if (selectedAnswer) return;

        setSelectedAnswer({ team, option });

        const isCorrect = option === currentQuestion.answer;
        isCorrect ? audio.playCorrect() : audio.playIncorrect();

        const winningTeam = isCorrect ? team : (team === 'a' ? 'b' : 'a');
        
        const targetRef = winningTeam === 'a' ? scoreARef : scoreBRef;
        const targetRect = targetRef.current?.getBoundingClientRect();

        if (targetRect) {
            audio.playScore();
            setAnimation({
                active: true,
                startPos: { x: event.clientX, y: event.clientY },
                targetPos: { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 },
            });
        }
    };
    
    const onAnimationEnd = () => {
        const team = selectedAnswer!.team;
        const isCorrect = selectedAnswer!.option === currentQuestion.answer;
        const winningTeam = isCorrect ? team : (team === 'a' ? 'b' : 'a');
        
        const newScores = {
            a: scores.a + (winningTeam === 'a' ? 100 : 0),
            b: scores.b + (winningTeam === 'b' ? 100 : 0),
        };
        setScores(newScores);
        setAnimation(prev => ({ ...prev, active: false }));

        setTimeout(() => {
            if (questionIndex < questions.length - 1) {
                setQuestionIndex(prev => prev + 1);
                startRoundAnimation();
            } else {
                onGameEnd(0, { grup1: newScores.a, grup2: newScores.b });
            }
        }, 500);
    };
    
    const handleMainMenu = () => {
        setShowEndConfirm(true);
    }
    
    const confirmEndGame = () => {
        onGameEnd(0, { grup1: scores.a, grup2: scores.b });
    }
    
    const toggleFullScreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }, []);

    if (!currentQuestion) {
        return <div className="w-full h-full flex justify-center items-center">Sorular yüklenemedi.</div>;
    }

    return (
        <div className="w-full h-full font-sans">
            <style>{kapismaSharedStyles}</style>
            
            {screen === 'intro' && <KapismaVSScreen isIntro={true} playerA={null} playerB={null} onStartMatch={handleStartMatch} onGoToQuestion={() => {}} audio={audio} />}
            {screen === 'vs' && <KapismaVSScreen 
                isIntro={false}
                isMatching={isMatching}
                playerA={playerA}
                playerB={playerB}
                teamACount={teamACount}
                teamBCount={teamBCount}
                onStartMatch={() => {}} 
                onGoToQuestion={handleGoToQuestion}
                audio={audio}
            />}
            {screen === 'question' && <KapismaQuestionScreen 
                question={currentQuestion}
                scores={scores}
                playerA={playerA}
                playerB={playerB}
                questionIndex={questionIndex}
                totalQuestions={questions.length}
                onAnswer={handleAnswer}
                selectedAnswer={selectedAnswer}
                onMainMenu={handleMainMenu}
                onSettingsClick={() => setShowSettings(true)}
                onToggleFullscreen={toggleFullScreen}
                scoreRefA={scoreARef}
                scoreRefB={scoreBRef}
                audio={audio}
            />}

            <AnimatedScore 
                isAnimating={animation.active}
                startPos={animation.startPos}
                targetPos={animation.targetPos}
                onAnimationEnd={onAnimationEnd}
                text="+100"
            />
            <Modal
                isOpen={showEndConfirm}
                title="Oyundan Çık"
                message="Kapışmadan çıkmak ve mevcut skorlarla oyunu bitirmek istediğinizden emin misiniz?"
                onConfirm={confirmEndGame}
                onCancel={() => setShowEndConfirm(false)}
            />
            {showSettings && (
                 <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4 animate-fadeIn">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center w-full max-w-md relative">
                        <button onClick={() => { audio.playClick(); setShowSettings(false); }} className="absolute top-4 right-4 text-2xl text-slate-400 hover:text-white">&times;</button>
                        <h3 className="text-3xl font-bold mb-6">Ayarlar</h3>
                        <div className="space-y-4 text-left">
                            <label className="flex justify-between items-center text-xl p-3 bg-slate-800 rounded-lg">
                                <span>🎶 Müzik</span>
                                 <div className="relative inline-block w-12 h-6 bg-slate-700 rounded-full cursor-pointer">
                                    <input type="checkbox" className="absolute opacity-0 w-0 h-0 peer"/>
                                    <span className="absolute top-0 left-0 w-full h-full rounded-full transition-colors peer-checked:bg-purple-600"></span>
                                    <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
                                </div>
                            </label>
                             <label className="flex justify-between items-center text-xl p-3 bg-slate-800 rounded-lg">
                                <span>🔊 Ses Efektleri</span>
                                 <div className="relative inline-block w-12 h-6 bg-slate-700 rounded-full cursor-pointer">
                                    <input type="checkbox" className="absolute opacity-0 w-0 h-0 peer" defaultChecked/>
                                    <span className="absolute top-0 left-0 w-full h-full rounded-full transition-colors peer-checked:bg-purple-600"></span>
                                    <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
                                </div>
                            </label>
                        </div>
                        <button onClick={() => { audio.playClick(); setShowSettings(false); }} className="mt-8 px-10 py-3 text-xl font-bold text-white bg-gradient-to-r from-pink-600 to-rose-500 rounded-lg shadow-lg transition-transform hover:scale-105">
                            Kapat
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Also export KapismaSetupScreen from here
// User's files show it's in the same file. I will move it here for simplicity
// FIX: The component will create its own audio context, so the `audio` prop is removed.
interface KapismaSetupScreenProps {
  onStart: (config: { teamACount: number; teamBCount: number; questionCount: number }) => void;
  onBack: () => void;
}

// FIX: `audio` prop is removed and the `useKapismaAudio` hook is now used internally.
export const KapismaSetupScreen: React.FC<KapismaSetupScreenProps> = ({ onStart, onBack }) => {
  const audio = useKapismaAudio();
  const [teamACount, setTeamACount] = useState(5);
  const [teamBCount, setTeamBCount] = useState(5);
  const [questionCount, setQuestionCount] = useState(15);
  const [showSettings, setShowSettings] = useState(false);

  const handleStart = () => {
    audio.playClick();
    onStart({ teamACount, teamBCount, questionCount });
  };
  
    const toggleFullScreen = useCallback(() => {
        audio.playClick();
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }, [audio]);

  return (
    <>
        <style>{kapismaSharedStyles}</style>
        <div className="w-full h-full flex flex-col justify-center items-center text-center p-4 kapisma-bg">
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="relative z-10 flex flex-col items-center">
                <h2 className="text-5xl font-extrabold tracking-wider">💡 BİLGİ YARIŞMASI! ⚔️</h2>
                <p className="text-xl text-slate-300 mt-2">Destansı bir öğrenme macerasına hazır ol!</p>
                
                <div className="w-full max-w-4xl bg-slate-900/60 backdrop-blur-md border border-slate-700 rounded-2xl p-8 mt-10 shadow-2xl space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Team A */}
                        <div className="space-y-2">
                             <label className="text-xl font-semibold text-blue-300 flex items-center justify-center gap-2">
                                <span className="w-4 h-4 bg-blue-500 rounded-full"></span>
                                Takım A
                             </label>
                             <p className="text-sm text-slate-400">Takım Sayısı:</p>
                             <input 
                                 type="number" 
                                 min="1" 
                                 value={teamACount}
                                 onChange={(e) => setTeamACount(Math.max(1, parseInt(e.target.value)))}
                                 className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-center text-xl font-bold"
                             />
                        </div>
                         {/* Team B */}
                        <div className="space-y-2">
                            <label className="text-xl font-semibold text-red-400 flex items-center justify-center gap-2">
                                <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                                Takım B
                            </label>
                            <p className="text-sm text-slate-400">Takım Sayısı:</p>
                            <input 
                                 type="number" 
                                 min="1" 
                                 value={teamBCount}
                                 onChange={(e) => setTeamBCount(Math.max(1, parseInt(e.target.value)))}
                                 className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-center text-xl font-bold"
                             />
                        </div>
                    </div>
                     {/* Question Count */}
                    <div className="space-y-2">
                         <p className="text-sm text-slate-400">Soru Sayısı:</p>
                         <input 
                             type="number" 
                             min="5" 
                             step="5"
                             value={questionCount}
                             onChange={(e) => setQuestionCount(Math.max(5, parseInt(e.target.value)))}
                             className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-center text-xl font-bold"
                         />
                    </div>
                    {/* Start Button */}
                    <button onClick={handleStart} className="w-full py-4 text-2xl font-bold text-white bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 rounded-lg shadow-lg transition-transform hover:scale-105">
                       🚀 OYUNA BAŞLA!
                    </button>
                     {/* Bottom Buttons */}
                    <div className="flex justify-center items-center gap-4 pt-4">
                        <button onClick={() => { audio.playClick(); setShowSettings(true); }} className="px-6 py-2 bg-slate-700/80 rounded-lg font-semibold transition-colors hover:bg-slate-600">⚙️ Ayarlar</button>
                        <button onClick={() => { audio.playClick(); onBack(); }} className="px-6 py-2 bg-slate-700/80 rounded-lg font-semibold transition-colors hover:bg-slate-600">⬅️ Geri</button>
                        <button onClick={toggleFullScreen} className="px-6 py-2 bg-slate-700/80 rounded-lg font-semibold transition-colors hover:bg-slate-600">⛶ Tam Ekran</button>
                    </div>
                </div>
            </div>
            {/* Settings Modal */}
            {showSettings && (
                 <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4 animate-fadeIn">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center w-full max-w-md relative">
                        <button onClick={() => { audio.playClick(); setShowSettings(false); }} className="absolute top-4 right-4 text-2xl text-slate-400 hover:text-white">&times;</button>
                        <h3 className="text-3xl font-bold mb-6">Ayarlar</h3>
                        <div className="space-y-4 text-left">
                            <label className="flex justify-between items-center text-xl p-3 bg-slate-800 rounded-lg">
                                <span>🎶 Müzik</span>
                                 <div className="relative inline-block w-12 h-6 bg-slate-700 rounded-full cursor-pointer">
                                    <input type="checkbox" className="absolute opacity-0 w-0 h-0 peer"/>
                                    <span className="absolute top-0 left-0 w-full h-full rounded-full transition-colors peer-checked:bg-purple-600"></span>
                                    <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
                                </div>
                            </label>
                             <label className="flex justify-between items-center text-xl p-3 bg-slate-800 rounded-lg">
                                <span>🔊 Ses Efektleri</span>
                                 <div className="relative inline-block w-12 h-6 bg-slate-700 rounded-full cursor-pointer">
                                    <input type="checkbox" className="absolute opacity-0 w-0 h-0 peer" defaultChecked/>
                                    <span className="absolute top-0 left-0 w-full h-full rounded-full transition-colors peer-checked:bg-purple-600"></span>
                                    <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
                                </div>
                            </label>
                        </div>
                        <button onClick={() => { audio.playClick(); setShowSettings(false); }} className="mt-8 px-10 py-3 text-xl font-bold text-white bg-gradient-to-r from-pink-600 to-rose-500 rounded-lg shadow-lg transition-transform hover:scale-105">
                            Kapat
                        </button>
                    </div>
                </div>
            )}
        </div>
    </>
  );
};
