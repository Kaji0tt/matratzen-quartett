import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Package, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardDisplay } from '@/components/cards/CardDisplay'
import { cn, getRarityColor } from '@/lib/utils'
import type { Card, BoosterPack } from '@/types'

interface BoosterOpeningProps {
  booster: BoosterPack
  onOpen: () => Promise<Card[]>
  onComplete: () => void
}

type Phase = 'idle' | 'opening' | 'revealing' | 'done'

export function BoosterOpening({ booster, onOpen, onComplete }: BoosterOpeningProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [cards, setCards] = useState<Card[]>([])
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const handleOpenPack = async () => {
    setIsLoading(true)
    try {
      const newCards = await onOpen()
      setCards(newCards)
      setPhase('opening')
      setTimeout(() => setPhase('revealing'), 1500)
    } catch (err) {
      console.error('Failed to open booster:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevealCard = (index: number) => {
    setRevealedCards((prev) => new Set([...prev, index]))
  }

  const handleRevealAll = () => {
    setRevealedCards(new Set(cards.map((_, i) => i)))
  }

  const allRevealed = revealedCards.size === cards.length && cards.length > 0

  return (
    <div className="flex flex-col items-center min-h-[60vh] justify-center px-4">
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="text-8xl"
            >
              📦
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white">{booster.name}</h2>
              <p className="text-muted-foreground mt-1">{booster.description}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {booster.card_count} Karten · {booster.price_coins} Münzen
              </p>
            </div>
            <Button
              variant="gaming"
              size="xl"
              onClick={handleOpenPack}
              disabled={isLoading}
              className="gap-2"
            >
              <Package className="w-5 h-5" />
              {isLoading ? 'Öffne...' : 'Pack öffnen!'}
            </Button>
          </motion.div>
        )}

        {phase === 'opening' && (
          <motion.div
            key="opening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1.5, 0.1],
                rotate: [0, 10, -10, 0],
                opacity: [1, 1, 1, 0],
              }}
              transition={{ duration: 1.4, ease: 'easeInOut' }}
              className="text-9xl"
            >
              📦
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              <Sparkles className="w-12 h-12 text-amber-400" />
            </motion.div>
          </motion.div>
        )}

        {(phase === 'revealing' || phase === 'done') && (
          <motion.div
            key="revealing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6 w-full max-w-2xl"
          >
            <h2 className="text-xl font-bold text-white">Deine Karten!</h2>

            {/* Cards grid */}
            <div className="flex flex-wrap justify-center gap-3">
              {cards.map((card, index) => (
                <FlippableCard
                  key={card.id}
                  card={card}
                  index={index}
                  isRevealed={revealedCards.has(index)}
                  onReveal={() => handleRevealCard(index)}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap justify-center">
              {!allRevealed && (
                <Button variant="outline" onClick={handleRevealAll}>
                  Alle aufdecken
                </Button>
              )}
              {allRevealed && (
                <Button variant="gaming" onClick={onComplete} className="gap-2">
                  Weiter <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface FlippableCardProps {
  card: Card
  index: number
  isRevealed: boolean
  onReveal: () => void
}

function FlippableCard({ card, index, isRevealed, onReveal }: FlippableCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15 }}
      className="card-flip-container w-40 h-56"
      onClick={!isRevealed ? onReveal : undefined}
    >
      <div className={cn('card-inner', isRevealed && 'flipped')}>
        {/* Back face (visible first) */}
        <div className="card-face">
          <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-xl flex items-center justify-center cursor-pointer hover:brightness-110 transition-all border border-slate-700">
            <div className="text-5xl opacity-40">🛏️</div>
            {!isRevealed && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl"
                whileHover={{ opacity: 1 }}
                initial={{ opacity: 0 }}
              >
                <span className="text-sm text-white font-medium">Aufdecken</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Front face (revealed) */}
        <div className="card-face card-back">
          <RevealedCard card={card} />
        </div>
      </div>
    </motion.div>
  )
}

function RevealedCard({ card }: { card: Card }) {
  return (
    <div className="relative w-full h-full">
      <CardDisplay card={card} size="md" showStats={false} />

      {/* Reveal flash effect */}
      <motion.div
        className="absolute inset-0 bg-white rounded-xl"
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      />

      {/* Rarity-specific reveal effects */}
      {(card.rarity === 'epic' || card.rarity === 'legendary') && (
        <RevealParticles rarity={card.rarity} />
      )}

      {/* Rarity label popup */}
      <motion.div
        initial={{ opacity: 0, scale: 0, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap"
      >
        {card.rarity !== 'common' && (
          <span
            className={cn(
              'text-xs font-bold px-2 py-0.5 rounded-full bg-black/60',
              getRarityColor(card.rarity)
            )}
          >
            {card.rarity === 'legendary' && '⭐ '}
            {card.rarity === 'epic' && '💜 '}
            {card.rarity === 'rare' && '💎 '}
            {card.rarity === 'uncommon' && '✨ '}
            {card.rarity.toUpperCase()}
          </span>
        )}
      </motion.div>
    </div>
  )
}

function RevealParticles({ rarity }: { rarity: 'epic' | 'legendary' }) {
  const color = rarity === 'legendary' ? '#f59e0b' : '#a855f7'
  const count = rarity === 'legendary' ? 20 : 12

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: color,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [1, 1, 0],
            y: [0, -60 - Math.random() * 40],
            x: [0, (Math.random() - 0.5) * 60],
          }}
          transition={{
            duration: 1 + Math.random() * 0.5,
            delay: Math.random() * 0.3,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}
