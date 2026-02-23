import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, Trophy, AlertCircle, Info } from 'lucide-react';
import { Card as CardType, GameState, Suit, GameStatus } from './types';
import { createDeck, shuffle, isValidMove, SUIT_SYMBOLS, SUIT_COLORS } from './constants';
import Card from './components/Card';
import SuitPicker from './components/SuitPicker';

const INITIAL_HAND_SIZE = 8;

export default function App() {
  const [state, setState] = useState<GameState>({
    deck: [],
    playerHand: [],
    aiHand: [],
    discardPile: [],
    currentSuit: 'hearts',
    currentPlayer: 'player',
    status: 'waiting',
    winner: null,
    lastAction: 'Welcome to Coco Crazy 8s!',
  });

  const initGame = useCallback(() => {
    const fullDeck = shuffle(createDeck());
    const playerHand = fullDeck.splice(0, INITIAL_HAND_SIZE);
    const aiHand = fullDeck.splice(0, INITIAL_HAND_SIZE);
    const firstDiscard = fullDeck.pop()!;
    
    // If first card is an 8, reshuffle or just pick another? Let's just pick another for simplicity if it's an 8
    let discardPile = [firstDiscard];
    let deck = fullDeck;
    
    setState({
      deck,
      playerHand,
      aiHand,
      discardPile,
      currentSuit: firstDiscard.suit,
      currentPlayer: 'player',
      status: 'playing',
      winner: null,
      lastAction: 'Game started! Your turn.',
    });
  }, []);

  const checkWinner = (newState: GameState) => {
    if (newState.playerHand.length === 0) {
      return { ...newState, status: 'game_over' as GameStatus, winner: 'player' as const, lastAction: 'You won!' };
    }
    if (newState.aiHand.length === 0) {
      return { ...newState, status: 'game_over' as GameStatus, winner: 'ai' as const, lastAction: 'AI won!' };
    }
    return newState;
  };

  const nextTurn = (newState: GameState): GameState => {
    const nextPlayer: 'player' | 'ai' = newState.currentPlayer === 'player' ? 'ai' : 'player';
    return { ...newState, currentPlayer: nextPlayer };
  };

  const checkTie = (state: GameState): GameState => {
    const topCard = state.discardPile[state.discardPile.length - 1];
    const playerHasMove = state.playerHand.some(c => isValidMove(c, topCard, state.currentSuit));
    const aiHasMove = state.aiHand.some(c => isValidMove(c, topCard, state.currentSuit));

    if (state.deck.length === 0 && !playerHasMove && !aiHasMove) {
      return { ...state, status: 'game_over', winner: 'tie', lastAction: "It's a tie! No more moves possible." };
    }
    return state;
  };

  const playCard = (card: CardType) => {
    if (state.status !== 'playing' || state.currentPlayer !== 'player') return;

    const topCard = state.discardPile[state.discardPile.length - 1];
    if (!isValidMove(card, topCard, state.currentSuit)) return;

    const newPlayerHand = state.playerHand.filter(c => c.id !== card.id);
    const newDiscardPile = [...state.discardPile, card];
    
    let newState: GameState = {
      ...state,
      playerHand: newPlayerHand,
      discardPile: newDiscardPile,
      currentSuit: card.suit,
      lastAction: `You played ${card.rank} of ${card.suit}`,
    };

    if (card.rank === '8') {
      setState({ ...newState, status: 'suit_picking' });
    } else {
      newState = checkWinner(newState);
      if (newState.status !== 'game_over') {
        newState = nextTurn(newState);
      }
      setState(newState);
    }
  };

  const handleSuitSelect = (suit: Suit) => {
    let newState: GameState = {
      ...state,
      currentSuit: suit,
      status: 'playing',
      lastAction: `Suit changed to ${suit}. AI's turn.`,
    };
    newState = checkWinner(newState);
    if (newState.status !== 'game_over') {
      newState = nextTurn(newState);
    }
    setState(newState);
  };

  const drawCard = () => {
    if (state.status !== 'playing' || state.currentPlayer !== 'player') return;

    if (state.deck.length === 0) {
      let newState = nextTurn({ ...state, lastAction: 'Deck empty! Turn skipped.' });
      newState = checkTie(newState);
      setState(newState);
      return;
    }

    const newDeck = [...state.deck];
    const drawnCard = newDeck.pop()!;
    const newPlayerHand = [...state.playerHand, drawnCard];

    setState({
      ...state,
      deck: newDeck,
      playerHand: newPlayerHand,
      lastAction: 'You drew a card.',
    });
  };

  // AI Logic
  useEffect(() => {
    if (state.status === 'playing' && state.currentPlayer === 'ai') {
      const timer = setTimeout(() => {
        const topCard = state.discardPile[state.discardPile.length - 1];
        const playableCard = state.aiHand.find(c => isValidMove(c, topCard, state.currentSuit));

        if (playableCard) {
          const newAiHand = state.aiHand.filter(c => c.id !== playableCard.id);
          const newDiscardPile = [...state.discardPile, playableCard];
          
          let newState: GameState = {
            ...state,
            aiHand: newAiHand,
            discardPile: newDiscardPile,
            currentSuit: playableCard.suit,
            lastAction: `AI played ${playableCard.rank} of ${playableCard.suit}`,
          };

          if (playableCard.rank === '8') {
            // AI picks a suit (most frequent suit in hand)
            const suits = newState.aiHand.map(c => c.suit);
            const mostFrequentSuit = suits.length > 0 
              ? suits.sort((a,b) => suits.filter(v => v===a).length - suits.filter(v => v===b).length).pop()!
              : 'hearts';
            newState.currentSuit = mostFrequentSuit;
            newState.lastAction = `AI played an 8 and picked ${mostFrequentSuit}`;
          }

          newState = checkWinner(newState);
          if (newState.status !== 'game_over') {
            newState = nextTurn(newState);
          }
          setState(newState);
        } else {
          // Draw
          if (state.deck.length > 0) {
            const newDeck = [...state.deck];
            const drawnCard = newDeck.pop()!;
            const newAiHand = [...state.aiHand, drawnCard];
            setState({
              ...state,
              deck: newDeck,
              aiHand: newAiHand,
              lastAction: 'AI drew a card.',
              // Keep it as AI's turn so it can check again and play if possible
            });
          } else {
            let newState = nextTurn({ ...state, lastAction: 'AI skipped (deck empty).' });
            newState = checkTie(newState);
            setState(newState);
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.status, state.currentPlayer, state.aiHand.length, state.deck.length]);

  const topDiscard = state.discardPile[state.discardPile.length - 1];

  return (
    <div className="h-screen w-full flex flex-col font-sans relative overflow-hidden">
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-black/20 backdrop-blur-md border-b border-white/10 z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
             <span className="text-emerald-900 font-display font-bold text-xl">8</span>
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight">Coco Crazy 8s</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-sm font-medium text-emerald-200 bg-emerald-800/50 px-3 py-1 rounded-full border border-emerald-700">
            {state.lastAction}
          </div>
          <button 
            onClick={initGame}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Restart Game"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </header>

      {/* Game Board */}
      <main className="flex-1 relative flex flex-col justify-between p-4 sm:p-8">
        
        {/* AI Hand */}
        <div className="flex justify-center h-32 sm:h-40">
          <div className="relative flex -space-x-12 sm:-space-x-16">
            {state.aiHand.map((card, idx) => (
              <Card 
                key={card.id} 
                card={card} 
                isFaceUp={false} 
                index={idx}
                className="transform hover:translate-y-2 transition-transform"
              />
            ))}
            {state.aiHand.length === 0 && state.status === 'playing' && (
              <div className="text-white/50 italic flex items-center">Thinking...</div>
            )}
          </div>
        </div>

        {/* Center Area: Deck & Discard */}
        <div className="flex justify-center items-center gap-8 sm:gap-16 my-4">
          {/* Deck */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-yellow-400/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div 
              onClick={drawCard}
              className={`
                relative w-20 h-28 sm:w-24 sm:h-36 rounded-lg border-2 border-indigo-400 bg-indigo-700 
                flex items-center justify-center cursor-pointer card-shadow
                active:scale-95 transition-all
                ${state.deck.length === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}
              `}
            >
              <div className="text-white font-display font-bold text-center">
                <div className="text-2xl">{state.deck.length}</div>
                <div className="text-[10px] uppercase tracking-widest opacity-60">Cards</div>
              </div>
            </div>
            {state.deck.length > 0 && (
               <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Draw</div>
            )}
          </div>

          {/* Discard Pile */}
          <div className="relative">
            <AnimatePresence mode="popLayout">
              {topDiscard && (
                <Card 
                  key={topDiscard.id} 
                  card={topDiscard} 
                  className="card-shadow"
                />
              )}
            </AnimatePresence>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
              <span className={`text-lg ${SUIT_COLORS[state.currentSuit]}`}>
                {SUIT_SYMBOLS[state.currentSuit]}
              </span>
              <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Current Suit</span>
            </div>
          </div>
        </div>

        {/* Player Hand */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex justify-center h-32 sm:h-40">
            <div className="relative flex -space-x-10 sm:-space-x-12">
              {state.playerHand.map((card, idx) => (
                <Card 
                  key={card.id} 
                  card={card} 
                  index={idx}
                  isPlayable={state.currentPlayer === 'player' && state.status === 'playing' && isValidMove(card, topDiscard, state.currentSuit)}
                  onClick={() => playCard(card)}
                />
              ))}
            </div>
          </div>
          
          {/* Turn Indicator */}
          <div className="flex items-center gap-3 bg-black/30 px-6 py-2 rounded-full border border-white/10 backdrop-blur-sm">
            <div className={`w-3 h-3 rounded-full ${state.currentPlayer === 'player' ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></div>
            <span className="text-sm font-bold uppercase tracking-widest">
              {state.currentPlayer === 'player' ? 'Your Turn' : "AI's Turn"}
            </span>
          </div>
        </div>
      </main>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {state.status === 'waiting' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/90 backdrop-blur-md"
          >
            <div className="text-center p-8 max-w-md">
              <div className="w-24 h-24 bg-yellow-400 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-8 rotate-12">
                 <span className="text-emerald-900 font-display font-bold text-6xl">8</span>
              </div>
              <h1 className="text-5xl font-display font-bold mb-4 tracking-tighter">Coco Crazy 8s</h1>
              <p className="text-emerald-200 mb-8 leading-relaxed">
                Match the suit or rank. Use 8s as wild cards. Be the first to clear your hand!
              </p>
              <button 
                onClick={initGame}
                className="bg-white text-emerald-900 px-10 py-4 rounded-2xl font-bold text-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                Play Now
              </button>
            </div>
          </motion.div>
        )}

        {state.status === 'suit_picking' && (
          <SuitPicker onSelect={handleSuitSelect} />
        )}

        {state.status === 'game_over' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-sm mx-4"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${state.winner === 'player' ? 'bg-yellow-400' : 'bg-slate-200'}`}>
                {state.winner === 'player' ? <Trophy className="text-emerald-900" size={40} /> : <AlertCircle className="text-slate-600" size={40} />}
              </div>
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">
                {state.winner === 'player' ? 'Victory!' : state.winner === 'ai' ? 'Defeat!' : 'TIE'}
              </h2>
              <p className="text-slate-500 mb-8">
                {state.winner === 'player' 
                  ? 'You cleared all your cards first.' 
                  : state.winner === 'ai' 
                    ? 'The AI was faster this time.' 
                    : 'No one can move and the deck is empty.'}
              </p>
              <button 
                onClick={initGame}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg"
              >
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Action Banner */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-2 bg-black/40 backdrop-blur-md text-center text-[10px] font-medium text-emerald-200 uppercase tracking-widest border-t border-white/5">
        {state.lastAction}
      </div>
    </div>
  );
}
