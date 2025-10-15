import React, { useState } from 'react';
import { Button, Modal } from '../UI';
import { PromptTemplateGenerator } from '../PromptTemplateGenerator';

export const Tools: React.FC<{ onResetSolvedQuestions: () => void; onClearAllData: () => void; selectedSubjectId: string; }> = ({ onResetSolvedQuestions, onClearAllData, selectedSubjectId }) => {
    const [showClearSolvedModal, setShowClearSolvedModal] = useState(false);
    const [showClearAllModal, setShowClearAllModal] = useState(false);

    return (
        <>
            <div className="p-4 sm:p-6 space-y-6">
                <PromptTemplateGenerator selectedSubjectId={selectedSubjectId} />

                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-yellow-300 border-t border-slate-700 pt-6">Veri Yönetimi</h3>
                    <p className="text-slate-400">
                        Uygulama verilerini yönetin. Bu işlemler geri alınamaz.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button onClick={() => setShowClearSolvedModal(true)} variant="warning">
                            Çözülmüş Soruları Sıfırla
                        </Button>
                        <Button onClick={() => setShowClearAllModal(true)} variant="secondary">
                            Tüm Verileri Sil
                        </Button>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={showClearSolvedModal}
                title="Çözülmüş Soruları Sıfırla"
                message="Daha önce çözdüğünüz tüm soruların 'çözüldü' işaretini kaldırmak istediğinizden emin misiniz? Bu, aynı sorularla tekrar oynamanıza olanak tanır."
                onConfirm={() => { onResetSolvedQuestions(); setShowClearSolvedModal(false); }}
                onCancel={() => setShowClearSolvedModal(false)}
            />
            <Modal
                isOpen={showClearAllModal}
                title="Tüm Verileri Sil"
                message="DİKKAT! Bu işlem, ürettiğiniz tüm soruları, yüksek skorları ve çözülmüş soru kayıtlarını kalıcı olarak silecektir. Emin misiniz?"
                onConfirm={() => { onClearAllData(); setShowClearAllModal(false); }}
                onCancel={() => setShowClearAllModal(false)}
            />
        </>
    );
};
