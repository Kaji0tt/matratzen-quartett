import { useEffect, useMemo, useState } from 'react'
import { Coins, RotateCcw, Swords } from 'lucide-react'
import { CardDisplay } from '@/components/cards/CardDisplay'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDemoDayKey, useDemoGameStore, type DemoMatchMode, type DemoMatchResult } from '@/store/demo-game-store'
import type { Card as GameCard, CardStats } from '@/types'

const statLabels: Record<keyof CardStats, string> = {
  alter: 'Alter',
  flecken: 'Flecken',
  witterung: 'Witterung',
  geruch: 'Geruch',
  kontaminierung: 'Kontaminierung',
}

interface MatchState {
  id: string
  mode: DemoMatchMode
  playerCards: GameCard[]
  opponentCards: GameCard[]
  round: number
  result: DemoMatchResult | null
  message: string
}

function chooseOpponentCard(cards: GameCard[]): GameCard {
  return cards[Math.floor(Math.random() * cards.length)]
}

export function TrainingPage() {
  const [mode, setMode] = useState<DemoMatchMode>('quick')
  const [match, setMatch] = useState<MatchState | null>(null)
  const [rewardNotice, setRewardNotice] = useState('')
  const coins = useDemoGameStore((state) => state.coins)
  const cards = useDemoGameStore((state) => state.cards)
  const lastDailyReward = useDemoGameStore((state) => state.lastDailyReward)
  const claimDailyReward = useDemoGameStore((state) => state.claimDailyReward)
  const startMatch = useDemoGameStore((state) => state.startMatch)
  const finishMatch = useDemoGameStore((state) => state.finishMatch)
  const cancelMatch = useDemoGameStore((state) => state.cancelMatch)
  const recoverAbandonedMatches = useDemoGameStore((state) => state.recoverAbandonedMatches)
  useEffect(() => {
    recoverAbandonedMatches()
  }, [recoverAbandonedMatches])

  const sortedCards = useMemo(() => [...cards].sort((a, b) => a.name.localeCompare(b.name)), [cards])

  const beginMatch = () => {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
    if (!startMatch(id, mode)) return
    setMatch({
      id,
      mode,
      playerCards: [...sortedCards],
      opponentCards: [...sortedCards].reverse().map((card) => ({
        ...card,
        id: `opponent-${card.id}`,
        photographer_id: 'simulated-opponent',
        photographer_username: 'Trainingsgegner (simuliert)',
      })),
      round: 1,
      result: null,
      message: 'Wähle eine deiner Karten und anschließend einen Wert. Der höhere Wert gewinnt die Runde; bei Gleichstand bleiben beide Karten liegen.',
    })
  }

  const playRound = (playerCard: GameCard, stat: keyof CardStats) => {
    if (!match || match.result) return
    const opponentCard = chooseOpponentCard(match.opponentCards)
    const playerWins = playerCard.stats[stat] > opponentCard.stats[stat]
    const draws = playerCard.stats[stat] === opponentCard.stats[stat]
    const playerCards = match.playerCards.filter((card) => card.id !== playerCard.id)
    const opponentCards = match.opponentCards.filter((card) => card.id !== opponentCard.id)
    if (playerWins) playerCards.push(playerCard, opponentCard)
    else if (!draws) opponentCards.push(opponentCard, playerCard)

    let result: DemoMatchResult | null = null
    if (playerCards.length === 0) result = 'loss'
    else if (opponentCards.length === 0) result = 'win'
    else if (match.round >= 20) {
      result = playerCards.length === opponentCards.length
        ? 'draw'
        : playerCards.length > opponentCards.length ? 'win' : 'loss'
    }

    const message = draws
      ? `Gleichstand bei ${statLabels[stat]} (${playerCard.stats[stat]}). Beide Karten bleiben liegen.`
      : playerWins
        ? `Du gewinnst mit ${statLabels[stat]}: ${playerCard.stats[stat]} zu ${opponentCard.stats[stat]}. Du erhältst die gegnerische Karte.`
        : `Der Trainingsgegner gewinnt mit ${statLabels[stat]}: ${opponentCard.stats[stat]} zu ${playerCard.stats[stat]}.`

    if (result) finishMatch(match.id, result)
    setMatch({
      ...match,
      playerCards: draws ? match.playerCards : playerCards,
      opponentCards: draws ? match.opponentCards : opponentCards,
      round: match.round + 1,
      result,
      message: result
        ? `${message} ${result === 'win' ? 'Du hast das Match gewonnen.' : result === 'loss' ? 'Der Trainingsgegner hat das Match gewonnen.' : `Nach höchstens 20 Runden endet das Match unentschieden.`}`
        : message,
    })
  }

  const abandonMatch = () => {
    if (!match || match.result) return
    cancelMatch(match.id)
    setMatch(null)
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            <span aria-hidden="true">DEMO</span> Lokal gespeichert · kein Multiplayer
          </p>
          <h1 className="text-2xl font-bold text-white">Spielen</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Trainingsduell: Wähle zwischen schnellem Spiel und Einsatzspiel gegen einen simulierten Gegner. Diese Demo-Währung ist getrennt von deinem Supabase-Konto.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-amber-300">
          <Coins className="h-4 w-4" />
          <span className="font-bold">{coins.toLocaleString()} Demo-Münzen</span>
        </div>
      </div>
      <Card className="mb-5 border-border/50">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-muted-foreground">Tägliche Demo-Aufgabe: einmal pro lokalem Kalendertag 50 Demo-Münzen.</p>
          <Button
            variant="outline"
            disabled={lastDailyReward === getDemoDayKey()}
            onClick={() => setRewardNotice(claimDailyReward()
              ? '50 Demo-Münzen wurden lokal gutgeschrieben.'
              : 'Die tägliche Demo-Belohnung wurde heute bereits abgeholt.')}
          >
            {lastDailyReward === getDemoDayKey() ? 'Heute abgeholt' : '50 Demo-Münzen abholen'}
          </Button>
        </CardContent>
      </Card>
      {rewardNotice && <p role="status" className="mb-4 text-sm text-amber-300">{rewardNotice}</p>}

      {!match ? (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Swords className="h-5 w-5 text-primary" /> Match vorbereiten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Dein Deck enthält {cards.length} Karten. Bei jedem Zug wählst du eine Karte und einen ihrer fünf Werte. Der Sieger erhält beide Karten; bei Gleichstand bleiben sie liegen. Das Match endet, wenn ein Deck leer ist oder spätestens nach 20 Runden.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button aria-pressed={mode === 'quick'} variant={mode === 'quick' ? 'gaming' : 'outline'} onClick={() => setMode('quick')}>
                Schnelles Spiel · ohne Einsatz
              </Button>
              <Button
                aria-pressed={mode === 'stake'}
                variant={mode === 'stake' ? 'gaming' : 'outline'}
                onClick={() => setMode('stake')}
                disabled={coins < 50}
              >
                Einsatzspiel · 50 Demo-Münzen
              </Button>
            </div>
            <Button onClick={beginMatch} disabled={cards.length < 2} className="gap-2">
              <Swords className="h-4 w-4" /> Trainingsmatch starten
            </Button>
            {cards.length < 2 && <p className="text-sm text-destructive">Mindestens zwei Karten sind für ein Match erforderlich.</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          <Card className="border-border/50">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="font-semibold text-white">Runde {match.round} · Trainingsgegner (simuliert)</p>
              <p className="text-sm text-muted-foreground">
                Deine Karten: {match.playerCards.length} · Gegner: {match.opponentCards.length}
              </p>
            </CardContent>
          </Card>

          <p role="status" aria-live="polite" className="rounded-lg border border-border/50 bg-card/70 p-4 text-sm text-muted-foreground">
            {match.message}
          </p>

          {!match.result && (
            <div className="grid gap-4 sm:grid-cols-2">
              {match.playerCards.map((card) => (
                <Card key={card.id} className="border-border/50">
                  <CardContent className="flex flex-col items-center gap-3 p-4">
                    <CardDisplay card={card} size="md" />
                    <p className="font-semibold text-white">{card.name}</p>
                    <div className="grid w-full grid-cols-2 gap-2">
                      {(Object.keys(statLabels) as (keyof CardStats)[]).map((stat) => (
                        <Button
                          key={stat}
                          variant="outline"
                          size="sm"
                          onClick={() => playRound(card, stat)}
                        >
                          {statLabels[stat]} · {card.stats[stat]}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {match.result && (
            <Card className="border-primary/30">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <h2 className="font-bold text-white">
                    {match.result === 'win' ? 'Match gewonnen!' : match.result === 'loss' ? 'Match verloren' : 'Unentschieden'}
                  </h2>
                  <p className="text-sm text-muted-foreground">Das Ergebnis und die Demo-Belohnung wurden lokal gespeichert.</p>
                </div>
                <Button onClick={() => setMatch(null)} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Neues Match
                </Button>
              </CardContent>
            </Card>
          )}

          {!match.result && (
            <Button variant="ghost" onClick={abandonMatch}>Match abbrechen und Einsatz erstatten</Button>
          )}
        </div>
      )}
    </div>
  )
}