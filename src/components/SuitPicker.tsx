import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Suit } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS, SUITS } from '../constants';

interface SuitPickerProps {
  onSelect: (suit: Suit) => void;
}

const SuitPicker: React.FC<SuitPickerProps> = ({ onSelect }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4"
      >
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-6 text-center">
          Pick a Suit
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {SUITS.map((suit) => (
            <button
              key={suit}
              onClick={() => onSelect(suit)}
              className={`
                flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100
                hover:border-indigo-500 hover:bg-indigo-50 transition-all group
              `}
            >
              <span className={`text-5xl mb-2 ${SUIT_COLORS[suit]} group-hover:scale-110 transition-transform`}>
                {SUIT_SYMBOLS[suit]}
              </span>
              <span className="text-slate-600 font-medium capitalize">
                {suit}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SuitPicker;
