import React from 'react';
import { motion } from 'motion/react';
import { Card as CardType, Suit } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../constants';

interface CardProps {
  card: CardType;
  isFaceUp?: boolean;
  onClick?: () => void;
  isPlayable?: boolean;
  className?: string;
  index?: number;
}

const Card: React.FC<CardProps> = ({ 
  card, 
  isFaceUp = true, 
  onClick, 
  isPlayable = false,
  className = "",
  index = 0
}) => {
  const { suit, rank } = card;

  return (
    <motion.div
      layoutId={card.id}
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={isPlayable ? { y: -20, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`
        relative w-20 h-28 sm:w-24 sm:h-36 rounded-lg border-2 
        ${isFaceUp ? 'bg-white border-slate-200' : 'bg-indigo-700 border-indigo-400'}
        ${isPlayable ? 'cursor-pointer ring-4 ring-yellow-400 ring-opacity-50' : 'cursor-default'}
        flex flex-col items-center justify-between p-2 select-none card-shadow
        ${className}
      `}
      style={{
        zIndex: index,
      }}
    >
      {isFaceUp ? (
        <>
          <div className={`self-start font-bold text-lg sm:text-xl leading-none ${SUIT_COLORS[suit]}`}>
            <div>{rank}</div>
            <div className="text-sm sm:text-base">{SUIT_SYMBOLS[suit]}</div>
          </div>
          
          <div className={`text-3xl sm:text-4xl ${SUIT_COLORS[suit]}`}>
            {SUIT_SYMBOLS[suit]}
          </div>
          
          <div className={`self-end font-bold text-lg sm:text-xl leading-none rotate-180 ${SUIT_COLORS[suit]}`}>
            <div>{rank}</div>
            <div className="text-sm sm:text-base">{SUIT_SYMBOLS[suit]}</div>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-300 rounded-full flex items-center justify-center opacity-20">
             <span className="text-white font-display font-bold text-xs">COCO</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Card;
