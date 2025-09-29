
import React from 'react';

interface ScreenProps {
  id: string;
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Screen: React.FC<ScreenProps> = ({ id, isActive, children, className = '' }) => {
  if (!isActive) return null;
  return (
    <div id={id} className={`w-full h-full flex flex-col justify-center items-center text-center p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'text-white border border-white/20 rounded-2xl px-8 py-4 text-xl sm:text-2xl font-semibold shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none';
  
  const variantClasses = {
    primary: 'bg-indigo-600/90 hover:bg-indigo-500/90 shadow-indigo-500/40',
    secondary: 'bg-rose-500/80 hover:bg-rose-400/90 shadow-rose-500/30',
    success: 'bg-emerald-500/80 hover:bg-emerald-400/90 shadow-emerald-500/30',
    warning: 'bg-yellow-500/90 hover:bg-yellow-400/90 shadow-yellow-500/40 text-slate-900 font-bold',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl text-center w-full max-w-md animate-slideIn">
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <p className="text-slate-200 mb-6">{message}</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={onCancel} variant="secondary" className="px-6 py-2 text-lg">Hayır</Button>
          <Button onClick={onConfirm} variant="primary" className="px-6 py-2 text-lg">Evet</Button>
        </div>
      </div>
    </div>
  );
};

export const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="absolute top-6 left-6 bg-amber-400/80 hover:bg-amber-300/90 text-slate-900 font-bold px-4 py-2 rounded-xl backdrop-blur-md transition-transform hover:scale-105 shadow-lg z-10">
      ← Geri
    </button>
);

export const DeveloperSignature: React.FC = () => (
    <div className="absolute bottom-4 right-6 text-right">
        <h3 className="text-indigo-300 text-sm">Program Geliştiricisi</h3>
        <p className="text-cyan-300 font-bold text-lg tracking-wide">MUSTAFA OKUR</p>
    </div>
);