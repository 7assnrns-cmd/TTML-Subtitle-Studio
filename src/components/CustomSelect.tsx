import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Circle, CheckCircle2 } from 'lucide-react';

interface Option {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  label?: string;
  className?: string;
  placeholder?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  label,
  className = '',
  placeholder = 'Select...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom,
            left: rect.left,
            width: rect.width,
          });
        }
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value);

  const dropdown = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 8, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 8, scale: 0.95, filter: 'blur(10px)' }}
          transition={{ 
            type: "spring",
            stiffness: 380,
            damping: 28,
            mass: 0.8
          }}
          style={{
            position: 'fixed',
            top: dropdownPosition.top + 8,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 999999,
            pointerEvents: 'auto',
          }}
          className="bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden max-h-72 overflow-y-auto"
        >
          <div className="p-1.5 space-y-0.5">
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {option.icon && (
                      <span className={`transition-colors ${isSelected ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                        {option.icon}
                      </span>
                    )}
                    <span className={`text-[13px] ${isSelected ? 'font-bold tracking-tight' : 'font-medium'}`}>
                      {option.label}
                    </span>
                  </div>
                  
                  {/* Radio Indicator */}
                  <div className="relative flex items-center justify-center">
                    {isSelected ? (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-cyan-400"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <Circle className="w-4 h-4 text-slate-700 group-hover:text-slate-600 transition-colors" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`relative w-full ${className}`}>
      {label && <span className="text-slate-400 text-[11px] block font-bold uppercase tracking-widest mb-1.5 ml-1">{label}</span>}
      <motion.button
        ref={buttonRef}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-slate-950/60 backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 rounded-xl px-4 py-2.5 text-[13px] text-slate-200 focus:outline-none cursor-pointer transition-all shadow-sm ${isOpen ? 'ring-2 ring-cyan-500/20 border-cyan-500/40' : ''}`}
      >
        <div className="flex items-center gap-3 truncate">
          {selectedOption?.icon && <span className="text-cyan-400 shrink-0">{selectedOption.icon}</span>}
          <span className="font-bold truncate">{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
      </motion.button>
      {ReactDOM.createPortal(dropdown, document.body)}
    </div>
  );
};
