import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import type { ScreenId, Question, HighScore, GameSettings, QuestionType, CompetitionMode, QuizMode, DocumentLibraryItem, Exam, QuizQuestion } from './types';
import type { OgrenmeAlani } from './data/curriculum';
import { Screen, Button, BackButton, DeveloperSignature, LoadingSpinner } from './components/UI';
import { getCurriculumData } from './services/curriculumService';

// Lazy load components for code splitting
const GameScreen = lazy(() => import('./components/QuizComponents'));
const TeacherPanel = lazy(() => import('./components/TeacherPanel'));
const KapismaSetupScreen = lazy(() => import('./components/KapismaSetupScreen'));
const KapismaGame = lazy(() => import('./components/KapismaGame'));


// --- Subject Data ---
interface Subject {
  id: string;
  name: string;
  icon: string;
}

const availableSubjects: Subject[] = [
    { id: 'social-studies', name: 'Sosyal Bilgiler', icon: '🏛️' },
    { id: 'math', name: 'Matematik', icon: '🧮' },
    { id: 'science', name: 'Fen Bilimleri', icon: '🧪' },
    { id: 'turkish', name: 'Türkçe', icon: '🇹🇷' },
    { id: 'english', name: 'İngilizce', icon: '🇬🇧' },
    { id: 'paragraph', name: 'Paragraf Soru Bankası', icon: '📖' },
];

const initialQuestions: Question[] = [];

function usePersistentState<T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            let dataToStore: any = state;

            if (key === 'quizQuestions' && Array.isArray(state)) {
                dataToStore = state.map(q => {
                    const { imageUrl, ...rest } = q as Question & { imageUrl?: string };
                    return rest;
                });
            }
            
            if (key === 'documentLibrary' && Array.isArray(state)) {
                dataToStore = state.map(doc => {
                    const { content, ...rest } = doc as DocumentLibraryItem;
                    return {
                        ...rest,
                        content: { mimeType: content.mimeType, data: '' }, 
                    };
                });
            }

            localStorage.setItem(key, JSON.stringify(dataToStore));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
            if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
                alert(`Tarayıcı depolama alanı dolu! Uygulamanın tekrar düzgün çalışması için "Öğretmen Paneli > Araçlar" menüsündeki "Tüm Verileri Sil" seçeneğini kullanmanız gerekebilir. Hata: '${key}' anahtarı kaydedilemedi.`);
            }
        }
    }, [key, state]);

    return [state, setState];
}

export default function App() {
    const [screen, setScreen] = useState<ScreenId>('subject-select');
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [playerName, setPlayerName] = useState('');
    const [groupNames, setGroupNames] = useState({ grup1: 'Grup 1', grup2: 'Grup 2' });
    const [gameSettings, setGameSettings] = useState<GameSettings>({});
    const [questions, setQuestions] = usePersistentState<Question[]>('quizQuestions', initialQuestions);
    const [highScores, setHighScores] = usePersistentState<HighScore[]>('quizHighScores', []);
    const [lastGameResult, setLastGameResult] = useState<{score: number; finalGroupScores?: {grup1: number, grup2: number}; quizMode?: QuizMode | 'kapisma'}>({score: 0});
    const [questionsForGame, setQuestionsForGame] = useState<Question[]>([]);
    const [solvedQuestionIds, setSolvedQuestionIds] = usePersistentState<number[]>('solvedQuestionIds', []);
    const [documentLibrary, setDocumentLibrary] = usePersistentState<DocumentLibraryItem[]>('documentLibrary', []);
    const [generatedExams, setGeneratedExams] = usePersistentState<Exam[]>('generatedExams', []);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [curriculum, setCurriculum] = useState<Record<string, Record<number, OgrenmeAlani[]>> | null>(null);
    
    useEffect(() => {
        document.body.className = 'theme-dark';
        getCurriculumData().then(data => setCurriculum(data));
    }, []);

    useEffect(() => {
        const isGameScreen = screen === 'game' || screen === 'kapisma-game';
        if (isGameScreen) {
            document.documentElement.classList.add('game-on');
        } else {
            document.documentElement.classList.remove('game-on');
        }

        return () => {
            document.documentElement.classList.remove('game-on');
        };
    }, [screen]);

    const handleQuestionAnswered = useCallback((questionId: number) => {
        setSolvedQuestionIds(prev => {
            if (prev.includes(questionId)) {
                return prev;
            }
            return [...prev, questionId];
        });
    }, [setSolvedQuestionIds]);

    const resetSolvedQuestions = useCallback(() => {
        setSolvedQuestionIds([]);
    }, [setSolvedQuestionIds]);
    
    const handleClearAllData = useCallback(() => {
        localStorage.removeItem('quizQuestions');
        localStorage.removeItem('quizHighScores');
        localStorage.removeItem('solvedQuestionIds');
        localStorage.removeItem('generatedExams');
        localStorage.removeItem('documentLibrary');

        setQuestions(initialQuestions);
        setHighScores([]);
        setSolvedQuestionIds([]);
        setGeneratedExams([]);
        setDocumentLibrary([]);
    }, [setQuestions, setHighScores, setSolvedQuestionIds, setGeneratedExams, setDocumentLibrary]);

    const handleGameEnd = useCallback((score: number, finalGroupScores?: { grup1: number, grup2: number }) => {
        const quizMode = gameSettings.gameMode === 'kapisma' ? 'kapisma' : gameSettings.quizMode;
        const finalScore = finalGroupScores ? Math.max(finalGroupScores.grup1, finalGroupScores.grup2) : score;
        setLastGameResult({ score: finalScore, finalGroupScores, quizMode });

        if (finalScore > 0 && gameSettings.gameMode !== 'kapisma') {
             let entryName = playerName;
            if (gameSettings.competitionMode === 'grup' && finalGroupScores) {
                if (finalGroupScores.grup1 > finalGroupScores.grup2) {
                    entryName = groupNames.grup1;
                } else if (finalGroupScores.grup2 > finalGroupScores.grup1) {
                    entryName = groupNames.grup2;
                } else {
                    entryName = `${groupNames.grup1} & ${groupNames.grup2} (Berabere)`;
                }
            }

            const newHighScore: HighScore = {
                name: entryName,
                score: finalScore,
                date: new Date().toLocaleDateString('tr-TR'),
                settings: gameSettings,
            };
            setHighScores(prev => [...prev, newHighScore].sort((a, b) => b.score - a.score).slice(0, 10));
        }
        setScreen('end');
    }, [playerName, gameSettings, setHighScores, groupNames]);
    
    const resetGame = () => {
      setPlayerName('');
      setGroupNames({ grup1: 'Grup 1', grup2: 'Grup 2' });
      setGameSettings({});
      setQuestionsForGame([]);
      setLastGameResult({ score: 0 });
      setScreen('subject-select');
      setSelectedSubject(null);
    }

    const startGame = () => {
        if (gameSettings.competitionMode === 'grup') {
            setGroupNames(prev => ({
                grup1: prev.grup1.trim() || 'Grup 1',
                grup2: prev.grup2.trim() || 'Grup 2',
            }));
        }
        
        const availableQuestions = questions.filter(q => !solvedQuestionIds.includes(q.id));

        const filtered = availableQuestions.filter(q =>
            q.grade == gameSettings.grade &&
            q.topic == gameSettings.topic &&
            q.kazanımId == gameSettings.kazanımId &&
            q.type == gameSettings.gameMode &&
            q.difficulty == gameSettings.difficulty
        );
        setQuestionsForGame(filtered);
        setScreen('game');
    };

    const handleStartKapisma = (kapismaConfig: { teamACount: number; teamBCount: number; questionCount: number }) => {
        const { questionCount } = kapismaConfig;
    
        const availableQuestions = questions.filter(q =>
            !solvedQuestionIds.includes(q.id) &&
            q.type === 'quiz' &&
            q.grade === gameSettings.grade &&
            q.topic === gameSettings.topic &&
            q.kazanımId === gameSettings.kazanımId
        );
    
        if (availableQuestions.length === 0) {
            alert("Bu kazanım için soru bankasında uygun çoktan seçmeli soru bulunamadı. Lütfen öğretmen panelinden soru üretin veya farklı bir kazanım seçin.");
            return;
        }
    
        const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
        const gameQuestions = shuffled.slice(0, questionCount);
    
        if (gameQuestions.length < questionCount) {
            alert(`Uyarı: Soru bankasında sadece ${gameQuestions.length} adet uygun soru bulundu. Oyun bu sayıda soru ile başlayacak.`);
        }
    
        setQuestionsForGame(gameQuestions);
        setGameSettings(s => ({ ...s, ...kapismaConfig }));
        setScreen('kapisma-game');
    };

    const handleSelectQuestion = (question: Question) => {
        setGameSettings({
            grade: question.grade,
            topic: question.topic,
            kazanımId: question.kazanımId,
            competitionMode: 'bireysel',
            difficulty: question.difficulty,
            gameMode: question.type,
            quizMode: 'klasik',
        });
        setQuestionsForGame([question]);
        setPlayerName('Öğretmen');
        setScreen('game');
    };
    
    const renderScreen = () => {
        if (isLoading) {
            return (
                <Screen id="loading-screen" isActive={true}>
                    <div className="text-2xl animate-pulse">{loadingMessage || 'Yükleniyor...'}</div>
                </Screen>
            )
        }
        
        switch (screen) {
            case 'subject-select':
                 return (
                    <Screen id="subject-select" isActive={true}>
                        <h1 className="text-4xl sm:text-5xl font-extrabold mb-10">Ders Seçin</h1>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full max-w-4xl">
                            {availableSubjects.map((subject) => (
                                <button
                                    key={subject.id}
                                    onClick={() => {
                                        setSelectedSubject(subject);
                                        setScreen('start');
                                    }}
                                    className="flex flex-col items-center p-6 text-center bg-green-400 border border-green-600 rounded-2xl transition-all duration-300 hover:bg-green-500 hover:border-green-700 hover:scale-105 cursor-pointer"
                                >
                                    <div className="text-5xl sm:text-6xl mb-4">{subject.icon}</div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{subject.name}</h3>
                                </button>
                            ))}
                        </div>
                        <DeveloperSignature />
                    </Screen>
                );
            case 'start':
                return (
                    <Screen id="start-screen" isActive={true}>
                        <BackButton onClick={() => setScreen('subject-select')} />
                        <h1 className="text-4xl sm:text-6xl font-extrabold mb-8 text-shadow-lg">{selectedSubject?.icon} {selectedSubject?.name} Bilgi Yarışması</h1>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
                            <Button onClick={() => setScreen('grade-select')}>🎮 Oyuna Başla</Button>
                            <Button variant="secondary" onClick={() => setScreen('teacher-panel')}>👩‍🏫 Öğretmen Paneli</Button>
                        </div>
                        <Button variant="success" className="mt-6 w-full max-w-md" onClick={() => setScreen('high-scores')}>🏆 Yüksek Skorlar</Button>
                        <DeveloperSignature />
                    </Screen>
                );
            case 'grade-select':
                 return (
                    <Screen id="grade-select" isActive={true}>
                        <BackButton onClick={() => setScreen('start')} />
                        <h2 className="text-3xl sm:text-4xl font-bold mb-10 text-center">📚 Sınıfınızı Seçin</h2>
                        <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-8 animate-fadeIn">
                            <Button 
                                onClick={() => { setGameSettings({ grade: 5 }); setScreen('learning-area-select'); }}
                                className="absolute top-0 left-0 w-32 h-32 sm:w-36 sm:h-36 rounded-full !p-0 flex items-center justify-center text-xl sm:text-2xl"
                                variant="success"
                            >
                                5. Sınıf
                            </Button>
                            <Button 
                                onClick={() => { setGameSettings({ grade: 6 }); setScreen('learning-area-select'); }}
                                className="absolute top-0 right-0 w-32 h-32 sm:w-36 sm:h-36 rounded-full !p-0 flex items-center justify-center text-xl sm:text-2xl"
                                variant="success"
                            >
                                6. Sınıf
                            </Button>
                            <Button 
                                onClick={() => { setGameSettings({ grade: 7 }); setScreen('learning-area-select'); }}
                                className="absolute bottom-0 left-0 w-32 h-32 sm:w-36 sm:h-36 rounded-full !p-0 flex items-center justify-center text-xl sm:text-2xl"
                                variant="success"
                            >
                                7. Sınıf
                            </Button>
                            <Button 
                                onClick={() => { setGameSettings({ grade: 8 }); setScreen('learning-area-select'); }}
                                className="absolute bottom-0 right-0 w-32 h-32 sm:w-36 sm:h-36 rounded-full !p-0 flex items-center justify-center text-xl sm:text-2xl"
                                variant="success"
                            >
                                8. Sınıf
                            </Button>
                        </div>
                    </Screen>
                );
            case 'learning-area-select':
                if (!curriculum) return <Screen id="loading" isActive={true}>Müfredat yükleniyor...</Screen>;
                const availableLearningAreas = curriculum[selectedSubject!.id]?.[gameSettings.grade!] || [];
                return (
                    <Screen id="learning-area-select" isActive={true}>
                        <BackButton onClick={() => setScreen('grade-select')} />
                        <h2 className="text-3xl sm:text-4xl font-bold mb-8">📖 Öğrenme Alanı Seçin</h2>
                        <div className="w-full max-w-2xl max-h-[70vh] overflow-y-auto space-y-3 p-1">
                            {availableLearningAreas.length > 0 ? availableLearningAreas.map(area => (
                                <button
                                    key={area.name}
                                    className="w-full text-left p-5 bg-slate-800/40 border border-slate-700 rounded-xl hover:bg-slate-700/60 hover:border-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xl font-semibold text-slate-100"
                                    onClick={() => { setGameSettings(s => ({ ...s, topic: area.name })); setScreen('kazanim-select'); }}
                                >
                                    {area.name}
                                </button>
                            )) : <p className="text-slate-400">Bu sınıf için öğrenme alanı bulunamadı.</p>}
                        </div>
                    </Screen>
                );
            case 'kazanim-select':
                if (!curriculum) return <Screen id="loading" isActive={true}>Müfredat yükleniyor...</Screen>;
                const learningAreas = curriculum[selectedSubject!.id]?.[gameSettings.grade!] || [];
                const selectedArea = learningAreas.find(oa => oa.name === gameSettings.topic);
                const availableKazanims = selectedArea?.altKonular.flatMap(ak => ak.kazanımlar) || [];
                return (
                    <Screen id="kazanim-select" isActive={true}>
                        <BackButton onClick={() => setScreen('learning-area-select')} />
                        <h2 className="text-3xl font-bold mb-6">🎯 Kazanım Seçin</h2>
                        <div className="w-full max-w-4xl max-h-[70vh] overflow-y-auto space-y-3 p-1">
                            {availableKazanims.length > 0 ? availableKazanims.map(kazanim => (
                                <button 
                                    key={kazanim.id} 
                                    className="w-full text-left p-4 bg-slate-800/40 border border-slate-700 rounded-xl hover:bg-slate-700/60 hover:border-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    onClick={() => { setGameSettings(s => ({ ...s, kazanımId: kazanim.id })); setScreen('game-mode'); }}
                                >
                                    <span className="font-bold text-amber-300">{kazanim.id}:</span>
                                    <span className="ml-2 text-slate-200">{kazanim.text}</span>
                                </button>
                            )) : <p className="text-slate-400">Bu öğrenme alanı için kazanım bulunamadı.</p>}
                        </div>
                    </Screen>
                );
            case 'game-mode':
                const availableQuestionsForKazanım = questions.filter(q => 
                    q.grade === gameSettings.grade && 
                    q.topic === gameSettings.topic && 
                    q.kazanımId === gameSettings.kazanımId &&
                    !solvedQuestionIds.includes(q.id)
                );

                const availableTypes: Record<string, boolean> = { quiz: false, 'fill-in': false, matching: false, kapisma: false };
                availableQuestionsForKazanım.forEach(q => {
                    if (q.type in availableTypes) availableTypes[q.type] = true;
                });

                const availableKapismaQuestionsCount = availableQuestionsForKazanım.filter(q => q.type === 'quiz').length;
                availableTypes.kapisma = availableKapismaQuestionsCount > 0;
                
                const GameModeCard: React.FC<{
                    icon: string;
                    title: string;
                    description: string;
                    onClick: () => void;
                    disabled: boolean;
                }> = ({ icon, title, description, onClick, disabled }) => {
                    const baseClasses = "flex flex-col items-center p-6 text-center bg-slate-800/40 border border-slate-700 rounded-2xl transition-all duration-300";
                    const enabledClasses = "hover:bg-slate-700/60 hover:border-indigo-400 hover:scale-105 cursor-pointer";
                    const disabledClasses = "opacity-50 cursor-not-allowed";
                    
                    return (
                        <button
                            onClick={onClick}
                            disabled={disabled}
                            className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses}`}
                        >
                            <div className="text-5xl mb-4">{icon}</div>
                            <h3 className="text-2xl font-bold text-white">{title}</h3>
                            <p className="text-slate-300 mt-2 text-sm flex-grow">{description}</p>
                        </button>
                    );
                };

                return (
                     <Screen id="game-mode" isActive={true}>
                        <BackButton onClick={() => setScreen('kazanim-select')} />
                        <h2 className="text-3xl sm:text-4xl font-bold mb-8">🎯 Oyun Türünü Seçin</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
                            <GameModeCard
                                icon="✅"
                                title="Çoktan Seçmeli"
                                description="Verilen soruya karşı sunulan seçeneklerden doğru olanı bulun."
                                onClick={() => { setGameSettings(s => ({ ...s, gameMode: 'quiz'})); setScreen('difficulty-select');}}
                                disabled={!availableTypes.quiz}
                            />
                            <GameModeCard
                                icon="📝"
                                title="Boşluk Doldurma"
                                description="Cümledeki boşluğa en uygun ifadeyi seçenekler arasından seçin."
                                onClick={() => { setGameSettings(s => ({ ...s, gameMode: 'fill-in'})); setScreen('difficulty-select');}}
                                disabled={!availableTypes['fill-in']}
                            />
                            <GameModeCard
                                icon="🔗"
                                title="Eşleştirme"
                                description="İlgili kavramları ve açıklamalarını doğru şekilde bir araya getirin."
                                onClick={() => { setGameSettings(s => ({ ...s, gameMode: 'matching'})); setScreen('difficulty-select');}}
                                disabled={!availableTypes.matching}
                            />
                             <GameModeCard
                                icon="⚡"
                                title="Kapışma"
                                description={`İki takım aynı anda aynı soruya karşı! Hızlı ve doğru olan kazanır. (Bankada ${availableKapismaQuestionsCount} soru var)`}
                                onClick={() => { setGameSettings(s => ({ ...s, gameMode: 'kapisma'})); setScreen('kapisma-setup');}}
                                disabled={!availableTypes.kapisma}
                            />
                        </div>
                    </Screen>
                );
             case 'difficulty-select':
                const DifficultyCard: React.FC<{
                    icon: string;
                    title: string;
                    description: string;
                    variant: 'green' | 'yellow' | 'red';
                    onClick: () => void;
                }> = ({ icon, title, description, variant, onClick }) => {
                    const variantClasses = {
                        green: 'border-green-500/80 hover:border-green-400',
                        yellow: 'border-yellow-500/80 hover:border-yellow-400',
                        red: 'border-red-500/80 hover:border-red-400',
                    };
                    return (
                        <button
                            onClick={onClick}
                            className={`flex flex-col items-center p-6 text-center bg-slate-800/40 border-2 rounded-2xl transition-all duration-300 hover:bg-slate-700/60 hover:scale-105 cursor-pointer ${variantClasses[variant]}`}
                        >
                            <div className="text-5xl mb-4">{icon}</div>
                            <h3 className="text-2xl font-bold text-white">{title}</h3>
                            <p className="text-slate-300 mt-2 text-sm flex-grow">{description}</p>
                        </button>
                    );
                };

                return (
                     <Screen id="difficulty-select" isActive={true}>
                        <BackButton onClick={() => setScreen('game-mode')} />
                        <h2 className="text-3xl sm:text-4xl font-bold mb-8">⚡ Zorluk Seviyesini Seçin</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                            <DifficultyCard
                                icon="😊"
                                title="Kolay"
                                description="Rahat bir başlangıç için daha fazla zaman ve temel düzeyde sorular."
                                variant="green"
                                onClick={() => { setGameSettings(s => ({ ...s, difficulty: 'kolay' })); setScreen('competition-mode'); }}
                            />
                            <DifficultyCard
                                icon="🤔"
                                title="Orta"
                                description="Dengeli bir meydan okuma. Standart zaman ve orta zorlukta sorular."
                                variant="yellow"
                                onClick={() => { setGameSettings(s => ({ ...s, difficulty: 'orta' })); setScreen('competition-mode'); }}
                            />
                            <DifficultyCard
                                icon="😤"
                                title="Zor"
                                description="Bilginizi test edin! Kısıtlı zaman ve ileri düzey sorular sizi bekliyor."
                                variant="red"
                                onClick={() => { setGameSettings(s => ({ ...s, difficulty: 'zor' })); setScreen('competition-mode'); }}
                            />
                        </div>
                    </Screen>
                );
            case 'competition-mode':
                const CompetitionModeCard: React.FC<{
                    icon: string;
                    title: string;
                    description: string;
                    onClick: () => void;
                }> = ({ icon, title, description, onClick }) => (
                    <button
                        onClick={onClick}
                        className="flex flex-col items-center p-8 text-center bg-slate-800/40 border border-slate-700 rounded-2xl transition-all duration-300 hover:bg-slate-700/60 hover:border-indigo-400 hover:scale-105 cursor-pointer w-full"
                    >
                        <div className="text-6xl mb-4">{icon}</div>
                        <h3 className="text-3xl font-bold text-white">{title}</h3>
                        <p className="text-slate-300 mt-2 flex-grow">{description}</p>
                    </button>
                );

                return (
                     <Screen id="competition-mode" isActive={true}>
                        <BackButton onClick={() => setScreen('difficulty-select')} />
                        <h2 className="text-3xl sm:text-4xl font-bold mb-8">🏆 Yarışma Türünü Seçin</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl">
                             <CompetitionModeCard
                                icon="🙋‍♂️"
                                title="Bireysel Yarışma"
                                description="Kendi bilginizi test edin ve en yüksek skoru hedefleyin."
                                onClick={() => { setGameSettings(s => ({ ...s, competitionMode: 'bireysel' })); setScreen('quiz-mode'); }}
                            />
                            <CompetitionModeCard
                                icon="👥"
                                title="Grup Yarışması"
                                description="Arkadaşlarınızla takım olun ve rekabetin tadını çıkarın."
                                onClick={() => { setGameSettings(s => ({ ...s, competitionMode: 'grup' })); setScreen('quiz-mode'); }}
                            />
                        </div>
                    </Screen>
                );
            case 'quiz-mode':
                const QuizModeCard: React.FC<{
                    icon: string;
                    title: string;
                    description: string;
                    variant: 'blue' | 'purple' | 'orange';
                    onClick: () => void;
                }> = ({ icon, title, description, variant, onClick }) => {
                    const variantClasses = {
                        blue: 'border-sky-500/80 hover:border-sky-400',
                        purple: 'border-violet-500/80 hover:border-violet-400',
                        orange: 'border-orange-500/80 hover:border-orange-400',
                    };
                    return (
                        <button
                            onClick={onClick}
                            className={`flex flex-col items-center p-6 text-center bg-slate-800/40 border-2 rounded-2xl transition-all duration-300 hover:bg-slate-700/60 hover:scale-105 cursor-pointer ${variantClasses[variant]}`}
                        >
                            <div className="text-5xl mb-4">{icon}</div>
                            <h3 className="text-2xl font-bold text-white">{title}</h3>
                            <p className="text-slate-300 mt-2 text-sm flex-grow">{description}</p>
                        </button>
                    );
                };
                 return (
                     <Screen id="quiz-mode-select" isActive={true}>
                        <BackButton onClick={() => setScreen('competition-mode')} />
                        <h2 className="text-3xl sm:text-4xl font-bold mb-8">🎲 Oyun Modunu Seçin</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                            <QuizModeCard
                                icon="📚"
                                title="Klasik"
                                description="Belirlenen sayıda soruyu cevaplayın. Her soru için ayrı süreniz var."
                                variant="blue"
                                onClick={() => { setGameSettings(s => ({ ...s, quizMode: 'klasik' })); setScreen('player-name'); }}
                            />
                            <QuizModeCard
                                icon="⏱️"
                                title="Zamana Karşı"
                                description="120 saniyede en fazla doğruyu yapmaya çalışın. Hız ve bilgi bir arada!"
                                variant="purple"
                                onClick={() => { setGameSettings(s => ({ ...s, quizMode: 'zamana-karsi' })); setScreen('player-name'); }}
                            />
                            <QuizModeCard
                                icon="❤️‍🔥"
                                title="Hayatta Kalma"
                                description="Tek yanlış cevap oyunun sonu! En uzun doğru serisini yakalayın."
                                variant="orange"
                                onClick={() => { setGameSettings(s => ({ ...s, quizMode: 'hayatta-kalma' })); setScreen('player-name'); }}
                            />
                        </div>
                    </Screen>
                );
             case 'player-name':
                const isGroupMode = gameSettings.competitionMode === 'grup';
                return (
                    <Screen id="player-name-screen" isActive={true}>
                        <BackButton onClick={() => setScreen('quiz-mode')} />
                        <h2 className="text-3xl font-bold mb-6">{isGroupMode ? '👥 Grup İsimlerini Girin' : '👤 Oyuncu Adınızı Girin'}</h2>
                        <form onSubmit={(e) => { e.preventDefault(); startGame(); }} className="flex flex-col items-center gap-6 w-full max-w-sm">
                            {isGroupMode ? (
                                <>
                                    <input
                                        type="text"
                                        value={groupNames.grup1}
                                        onChange={(e) => setGroupNames(prev => ({...prev, grup1: e.target.value}))}
                                        placeholder="Grup 1 Adı..."
                                        maxLength={20}
                                        className="w-full text-center p-4 text-xl bg-white/10 rounded-xl border border-white/20 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    <input
                                        type="text"
                                        value={groupNames.grup2}
                                        onChange={(e) => setGroupNames(prev => ({...prev, grup2: e.target.value}))}
                                        placeholder="Grup 2 Adı..."
                                        maxLength={20}
                                        className="w-full text-center p-4 text-xl bg-white/10 rounded-xl border border-white/20 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </>
                            ) : (
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    placeholder="Adınızı yazın..."
                                    maxLength={20}
                                    className="w-full text-center p-4 text-xl bg-white/10 rounded-xl border border-white/20 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            )}
                            <Button 
                                type="submit" 
                                className="w-full"
                                disabled={isGroupMode ? false : !playerName.trim()}
                            >
                                Oyunu Başlat →
                            </Button>
                        </form>
                    </Screen>
                );
            case 'game':
                return questionsForGame.length > 0 ? (
                    <Screen id="game-screen" isActive={true} className="justify-between">
                        <GameScreen 
                            questions={questionsForGame} 
                            settings={gameSettings} 
                            onGameEnd={handleGameEnd} 
                            groupNames={groupNames}
                            onQuestionAnswered={handleQuestionAnswered}
                            subjectId={selectedSubject!.id}
                        />
                    </Screen>
                ) : (
                     <Screen id="no-questions" isActive={true}>
                        <h2 className="text-2xl mb-4">Soru Bulunamadı</h2>
                        <p className="mb-6">Seçtiğiniz kriterlere uygun, daha önce çözülmemiş soru bulunamadı.</p>
                        <Button onClick={() => setScreen('game-mode')}>Geri Dön</Button>
                    </Screen>
                );
            case 'kapisma-setup':
                return (
                    <KapismaSetupScreen 
                        onStart={handleStartKapisma} 
                        onBack={() => setScreen('game-mode')}
                    />
                );
            case 'kapisma-game':
                return (
                    <KapismaGame 
                        questions={questionsForGame as QuizQuestion[]}
                        settings={gameSettings}
                        onGameEnd={handleGameEnd}
                    />
                );
            case 'end':
                const { score, finalGroupScores, quizMode } = lastGameResult;
                const isSurvival = quizMode === 'hayatta-kalma';
                const isKapisma = quizMode === 'kapisma';
                const scoreLabel = isSurvival ? 'Başarı Serin' : 'Toplam Skorun';
                
                return (
                    <Screen id="end-screen" isActive={true}>
                        <h2 className="text-5xl font-bold mb-4">🎉 Oyun Bitti!</h2>
                        <div className="text-2xl mb-8 leading-relaxed">
                            {finalGroupScores ? (
                                <>
                                    <p>Takım A: {finalGroupScores.grup1} Puan</p>
                                    <p>Takım B: {finalGroupScores.grup2} Puan</p>
                                    <p className="mt-4 font-bold text-yellow-300">
                                      {finalGroupScores.grup1 > finalGroupScores.grup2 ? `🏆 Kazanan: Takım A!` : finalGroupScores.grup2 > finalGroupScores.grup1 ? `🏆 Kazanan: Takım B!` : "🤝 Berabere!"}
                                    </p>
                                </>
                            ) : (
                                <p>🎯 {scoreLabel}: {score}</p>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button onClick={resetGame}>🏠 Ana Menü</Button>
                            {!isKapisma && <Button variant="secondary" onClick={() => setScreen('high-scores')}>🏆 Yüksek Skorlar</Button>}
                        </div>
                    </Screen>
                );
            case 'high-scores':
                return (
                    <Screen id="high-scores-screen" isActive={true}>
                        <BackButton onClick={() => lastGameResult.score > 0 ? setScreen('end') : setScreen('start')} />
                        <h2 className="text-4xl font-bold mb-6">🏆 Yüksek Skorlar</h2>
                        <div className="w-full max-w-2xl space-y-3">
                            {highScores.length > 0 ? highScores.map((hs, index) => (
                                <div key={index} className="bg-yellow-300/10 backdrop-blur-md border border-yellow-300/30 rounded-lg p-4 flex justify-between items-center text-left">
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl font-bold w-8">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}</span>
                                        <div>
                                            <p className="font-bold text-lg">{hs.name}</p>
                                            <p className="text-sm text-slate-300">{hs.settings.topic} ({hs.settings.quizMode})</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-xl">{hs.score}</p>
                                </div>
                            )) : <p>Henüz kayıtlı skor yok.</p>}
                        </div>
                         {highScores.length > 0 && <Button variant="warning" className="mt-6 text-base px-6 py-2" onClick={() => setHighScores([])}>🗑️ Skorları Temizle</Button>}
                    </Screen>
                );
            case 'teacher-panel':
                if (!selectedSubject) {
                    return (
                        <Screen id="error-screen" isActive={true}>
                            <p className="text-xl mb-4">Öğretmen paneline erişmek için lütfen önce bir ders seçin.</p>
                            <Button onClick={() => setScreen('subject-select')}>Ana Menüye Dön</Button>
                        </Screen>
                    );
                }
                return (
                    <Screen id="teacher-panel-screen" isActive={true} className="p-0 sm:p-0">
                         <TeacherPanel 
                            questions={questions} 
                            setQuestions={setQuestions} 
                            onSelectQuestion={handleSelectQuestion}
                            onResetSolvedQuestions={resetSolvedQuestions}
                            onClearAllData={handleClearAllData}
                            selectedSubjectId={selectedSubject.id}
                            documentLibrary={documentLibrary}
                            setDocumentLibrary={setDocumentLibrary}
                            generatedExams={generatedExams}
                            setGeneratedExams={setGeneratedExams}
                            onBack={() => setScreen('start')}
                         />
                    </Screen>
                );
            default:
                return <div>Bilinmeyen Ekran</div>;
        }
    };
    
    return (
        <main className="h-screen w-screen font-sans overflow-hidden">
            <div className="relative w-full h-full p-2 sm:p-4 main-container-padded">
                <div className="w-full h-full bg-slate-900/30 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden main-container-rounded">
                    <Suspense fallback={<LoadingSpinner />}>
                        {renderScreen()}
                    </Suspense>
                </div>
            </div>
        </main>
    );
}