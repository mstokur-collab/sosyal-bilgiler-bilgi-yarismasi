import React, { useState, useCallback } from 'react';
import { useKapismaAudio, kapismaSharedStyles } from './kapisma_helpers/KapismaUI';

interface KapismaSetupScreenProps {
  onStart: (config: { teamACount: number; teamBCount: number; questionCount: number }) => void;
  onBack: () => void;
}

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
                    <button onClick={handleStart} className="w-full py-4 text-2xl font-bold text-white bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 rounded-lg shadow-lg transition-transform hover:scale-105">
                       🚀 OYUNA BAŞLA!
                    </button>
                    <div className="flex justify-center items-center gap-4 pt-4">
                        <button onClick={() => { audio.playClick(); setShowSettings(true); }} className="px-6 py-2 bg-slate-700/80 rounded-lg font-semibold transition-colors hover:bg-slate-600">⚙️ Ayarlar</button>
                        <button onClick={() => { audio.playClick(); onBack(); }} className="px-6 py-2 bg-slate-700/80 rounded-lg font-semibold transition-colors hover:bg-slate-600">⬅️ Geri</button>
                        <button onClick={toggleFullScreen} className="px-6 py-2 bg-slate-700/80 rounded-lg font-semibold transition-colors hover:bg-slate-600">⛶ Tam Ekran</button>
                    </div>
                </div>
            </div>
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
