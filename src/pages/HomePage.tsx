import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Package, BookOpen, Trophy, ArrowLeftRight, Camera, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth-store'

const features = [
  {
    icon: Camera,
    title: 'Fotografiere',
    description: 'Entdecke Matratzen auf der Straße und fotografiere sie für einzigartige Karten.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: Package,
    title: 'Sammle',
    description: 'Öffne Booster-Packs und sammle alle Karten von common bis legendary.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    icon: ArrowLeftRight,
    title: 'Handle',
    description: 'Tausche Karten mit anderen Spielern und vervollständige deine Sammlung.',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  {
    icon: Trophy,
    title: 'Kämpfe',
    description: 'Tritt gegen andere Spieler an und klettere in der Elo-Rangliste.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
]

export function HomePage() {
  const { profile } = useAuthStore()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 md:py-20"
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="text-7xl md:text-9xl mb-6"
        >
          🛏️
        </motion.div>

        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Matratzen
          </span>{' '}
          <span className="text-white">Quartett</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Das einzig wahre Matratzen-Sammelkarten-Spiel. Fotografiere, sammle, handle
          und kämpfe mit gefundenen Straßenmatratzen. Werde zum Matres Master!
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          {profile ? (
            <>
              <Link to="/boosters">
                <Button variant="gaming" size="xl" className="gap-2">
                  <Sparkles className="w-5 h-5" />
                  Booster öffnen
                </Button>
              </Link>
              <Link to="/collection">
                <Button variant="outline" size="xl" className="gap-2">
                  <BookOpen className="w-5 h-5" />
                  Meine Sammlung
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="gaming" size="xl" className="gap-2">
                  <Sparkles className="w-5 h-5" />
                  Jetzt starten
                </Button>
              </Link>
              <Link to="/leaderboard">
                <Button variant="outline" size="xl" className="gap-2">
                  <Trophy className="w-5 h-5" />
                  Rangliste
                </Button>
              </Link>
            </>
          )}
        </div>
      </motion.div>

      {/* Stats banner */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {[
            { label: 'Level', value: profile.level, icon: '⭐' },
            { label: 'Karten', value: profile.cards_collected, icon: '🃏' },
            { label: 'Elo', value: profile.elo_rating, icon: '🏆' },
            { label: 'Münzen', value: profile.coins, icon: '🪙' },
          ].map(({ label, value, icon }) => (
            <Card key={label} className="border-border/50 bg-card/50">
              <CardContent className="flex items-center gap-3 p-4">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {features.map(({ icon: Icon, title, description, color, bg }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
          >
            <Card className={`border ${bg} h-full`}>
              <CardContent className="p-6">
                <Icon className={cn('w-8 h-8 mb-3', color)} />
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Rarity showcase */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Seltenheitsstufen</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { label: 'Gewöhnlich', color: 'text-slate-400', border: 'border-slate-400/30', bg: 'bg-slate-800' },
            { label: 'Ungewöhnlich', color: 'text-green-400', border: 'border-green-500/50', bg: 'bg-green-900/30' },
            { label: 'Selten', color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-900/30' },
            { label: 'Episch', color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-900/30' },
            { label: 'Legendär', color: 'text-amber-400', border: 'border-amber-400/70', bg: 'bg-amber-900/30' },
          ].map(({ label, color, border, bg }) => (
            <div
              key={label}
              className={`px-4 py-2 rounded-full border ${border} ${bg} ${color} font-medium text-sm`}
            >
              {label}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}
