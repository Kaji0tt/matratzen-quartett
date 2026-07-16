import { motion } from 'framer-motion'
import { MapPin, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn, getRarityLabel } from '@/lib/utils'
import type { Card, Rarity } from '@/types'

interface CardDisplayProps {
  card: Card
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  showStats?: boolean
  className?: string
  isFaceDown?: boolean
}

const sizeClasses = {
  sm: 'w-28 h-40',
  md: 'w-40 h-56',
  lg: 'w-56 h-80',
}

const rarityClass: Record<Rarity, string> = {
  common: 'card-common',
  uncommon: 'card-uncommon',
  rare: 'card-rare',
  epic: 'card-epic',
  legendary: 'card-legendary',
}

const rarityGlow: Record<Rarity, string> = {
  common: '',
  uncommon: 'shadow-green-500/20',
  rare: 'shadow-blue-500/30',
  epic: 'shadow-purple-500/40',
  legendary: 'shadow-amber-500/50',
}

export function CardDisplay({
  card,
  size = 'md',
  onClick,
  showStats = false,
  className,
  isFaceDown = false,
}: CardDisplayProps) {
  return (
    <motion.div
      whileHover={onClick ? { scale: 1.05, y: -4 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        'relative rounded-xl overflow-hidden cursor-pointer select-none',
        sizeClasses[size],
        rarityClass[card.rarity],
        rarityGlow[card.rarity],
        'shadow-xl transition-shadow duration-300',
        onClick && 'hover:shadow-2xl',
        className
      )}
    >
      {isFaceDown ? (
        <CardBack />
      ) : (
        <CardFront card={card} size={size} showStats={showStats} />
      )}
    </motion.div>
  )
}

function CardBack() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-black flex items-center justify-center">
      <div className="text-6xl opacity-30">🛏️</div>
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)',
        }}
      />
    </div>
  )
}

interface CardFrontProps {
  card: Card
  size: 'sm' | 'md' | 'lg'
  showStats: boolean
}

function CardFront({ card, size, showStats }: CardFrontProps) {
  const isSmall = size === 'sm'
  const isLarge = size === 'lg'

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-slate-800/80 to-slate-900/95">
      {/* Image */}
      <div className="flex-1 relative overflow-hidden">
        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800">
            <span className={cn('opacity-40', isLarge ? 'text-6xl' : 'text-4xl')}>🛏️</span>
          </div>
        )}

        {/* Rarity shimmer overlay for legendary */}
        {card.rarity === 'legendary' && (
          <div className="absolute inset-0 bg-legendary-gradient opacity-10 animate-shimmer bg-[length:200%_100%]" />
        )}
        {card.rarity === 'epic' && (
          <div className="absolute inset-0 bg-epic-gradient opacity-10" />
        )}

        {/* Rarity badge */}
        {!isSmall && (
          <div className="absolute top-1.5 right-1.5">
            <Badge variant={card.rarity as Rarity}>{getRarityLabel(card.rarity)}</Badge>
          </div>
        )}

        {/* Particle effects for legendary */}
        {card.rarity === 'legendary' && <LegendaryParticles />}
      </div>

      {/* Card info */}
      <div className={cn('p-1.5', isLarge && 'p-2.5')}>
        <p className={cn('font-bold text-white truncate', isSmall ? 'text-xs' : isLarge ? 'text-sm' : 'text-xs')}>
          {card.name}
        </p>
        {!isSmall && (
          <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="text-xs truncate">{card.city}</span>
          </div>
        )}

        {showStats && isLarge && (
          <div className="mt-2 grid grid-cols-2 gap-1">
            {Object.entries({
              '📅': card.stats.alter,
              '🩹': card.stats.flecken,
              '☀️': card.stats.witterung,
              '👃': card.stats.geruch,
              '🦠': card.stats.kontaminierung,
            }).map(([emoji, val]) => (
              <div key={emoji} className="flex items-center gap-1">
                <span className="text-xs">{emoji}</span>
                <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${val}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-6 text-right">{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Edition info */}
        {card.edition_number && !isSmall && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-xs text-amber-400">
              #{card.edition_number}/{card.total_editions}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function LegendaryParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-amber-400"
          initial={{
            x: `${Math.random() * 100}%`,
            y: '100%',
            opacity: 0,
          }}
          animate={{
            y: '-10%',
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}
