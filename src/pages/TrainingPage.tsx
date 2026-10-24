import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Coins, Gift, RotateCcw, Swords, Zap } from 'lucide-react'
import { StreetCard } from '@/components/cards/StreetCard'
import { StreetPageHeader } from '@/components/layout/StreetPageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getDemoDayKey, useDemoGameStore, type DemoMatchMode, type DemoMatchResult } from '@/store/demo-game-store'
import { applyCardStatModifiers } from '@/lib/card-condition'
import type { Card as GameCard, CardStats } from '@/types'

import { STAT_LABELS as statLabels } from '@/types/card-stats'

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
    const playerStats = applyCardStatModifiers(playerCard.stats, playerCard.stat_modifiers)
    const opponentStats = applyCardStatModifiers(opponentCard.stats, opponentCard.stat_modifiers)
    const playerWins = playerStats[stat] > opponentStats[stat]
    const draws = playerStats[stat] === opponentStats[stat]
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
      ? `Gleichstand bei ${statLabels[stat]} (${playerStats[stat]}). Beide Karten bleiben liegen.`
      : playerWins
        ? `Du gewinnst mit ${statLabels[stat]}: ${playerStats[stat]} zu ${opponentStats[stat]}. Du erhältst die gegnerische Karte.`
        : `Der Trainingsgegner gewinnt mit ${statLabels[stat]}: ${opponentStats[stat]} zu ${playerStats[stat]}.`

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
    <div className="street-screen training-screen">
      <StreetPageHeader first="Dein Kiez." accent="Dein Spiel." coins={coins} />
      <section className="home-panel training-daily" aria-label="Tägliche Demo-Belohnung">
          <Gift aria-hidden="true" className="training-daily__icon" />
          <div><h2>Neuer Tag. Neuer Fund.</h2><p>Hol dir einmal pro lokalem Kalendertag 50 Demo-Münzen.</p></div>
          <button
            className="street-secondary training-reward"
            disabled={lastDailyReward === getDemoDayKey()}
            onClick={() => setRewardNotice(claimDailyReward()
              ? '50 Demo-Münzen wurden lokal gutgeschrieben.'
              : 'Die tägliche Demo-Belohnung wurde heute bereits abgeholt.')}
          >
            {lastDailyReward === getDemoDayKey() ? <Check aria-hidden="true" /> : <Coins aria-hidden="true" />}
            {lastDailyReward === getDemoDayKey() ? 'Heute abgeholt' : '+50 abholen'}
          </button>
      </section>
      {rewardNotice && <p role="status" className="mb-4 text-sm text-amber-300">{rewardNotice}</p>}

      {!match ? (
        <>
          <section className="home-panel training-intro">
            <div>
              <span className="home-brush-label home-brush-label--small">TRAINING</span>
              <h2>Zeig, was dein<br /><span>Deck draufhat.</span></h2>
              <p>Die Straße teilt aus. Du wählst den stärksten Wert.</p>
              <Link to="/collection" className="training-deck-link">{cards.length} Karten in deinem Deck<ArrowRight aria-hidden="true" /></Link>
            </div>
            <div className="training-intro__art" aria-hidden="true">
              <div className="training-intro__card">{sortedCards[0] ? <StreetCard card={sortedCards[0]} /> : <Swords />}</div>
              <span>VS</span>
            </div>
          </section>
          <section aria-labelledby="training-mode-heading">
            <div className="street-section-heading"><h2 id="training-mode-heading">Wähle deinen Modus</h2><span>01 / MATCH VORBEREITEN</span></div>
            <div className="training-modes">
              <button className={`home-panel training-mode${mode === 'quick' ? ' is-selected' : ''}`} aria-pressed={mode === 'quick'} onClick={() => setMode('quick')}>
                <Zap aria-hidden="true" /><span className="training-mode__check" aria-hidden="true">{mode === 'quick' && <Check />}</span>
                <strong>Schnelles Spiel</strong><span>Ohne Einsatz. Einfach loslegen.</span><b>FREE PLAY / 0 MÜNZEN</b>
              </button>
              <button
                className={`home-panel training-mode training-mode--stake${mode === 'stake' ? ' is-selected' : ''}`}
                aria-pressed={mode === 'stake'}
                onClick={() => setMode('stake')}
                disabled={coins < 50}
              >
                <Coins aria-hidden="true" /><span className="training-mode__check" aria-hidden="true">{mode === 'stake' && <Check />}</span>
                <strong>Einsatzspiel</strong><span>{coins < 50 ? 'Dir fehlen noch Demo-Münzen.' : 'Mehr Nervenkitzel. Gleiche Regeln.'}</span><b>50 DEMO-MÜNZEN EINSATZ</b>
              </button>
            </div>
            <div className="training-start">
              <button onClick={beginMatch} disabled={cards.length < 2} className="home-cta">
                <Swords aria-hidden="true" /> Trainingsmatch starten<ArrowRight aria-hidden="true" />
              </button>
              <span>{mode === 'quick' ? 'Ohne Einsatz' : '50 Demo-Münzen Einsatz'} · Max. 20 Runden</span>
            </div>
            {cards.length < 2 && <p className="text-sm text-destructive">Mindestens zwei Karten sind für ein Match erforderlich.</p>}
          </section>
          <section className="training-rules" aria-label="Spielregeln">
            <h2>So läuft dein Duell</h2>
            <ol><li><b>01</b><span>Karte und einen ihrer fünf Werte wählen.</span></li><li><b>02</b><span>Höherer Wert gewinnt beide Karten. Gleichstand? Beide bleiben liegen.</span></li><li><b>03</b><span>Deck leeren oder nach 20 Runden mehr Karten besitzen.</span></li></ol>
          </section>
        </>
      ) : (
        <div className="space-y-5">
          <Card className="home-panel">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="font-semibold text-white">Runde {match.round} · Trainingsgegner (simuliert)</p>
              <p className="text-sm text-muted-foreground">
                Deine Karten: {match.playerCards.length} · Gegner: {match.opponentCards.length}
              </p>
            </CardContent>
          </Card>

          <p role="status" aria-live="polite" className="training-round-message">
            {match.message}
          </p>

          {!match.result && (
            <div className="training-hand">
              {match.playerCards.map((card) => (
                <Card key={card.id} className="home-panel training-hand-card">
                  <CardContent className="flex flex-col items-center gap-3 p-4">
                    <div className="training-playing-card"><StreetCard card={card} /></div>
                    <p className="font-semibold text-white">{card.name}</p>
                    <div className="grid w-full grid-cols-2 gap-2">
                      {(Object.keys(statLabels) as (keyof CardStats)[]).map((stat) => (
                        <Button
                          key={stat}
                          variant="outline"
                          size="sm"
                          onClick={() => playRound(card, stat)}
                        >
                          <span>{statLabels[stat]}</span><b>{applyCardStatModifiers(card.stats, card.stat_modifiers)[stat]}</b>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {match.result && (
            <Card className="home-panel training-result">
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
      <p className="street-demo-note">Lokale Demo · kein Multiplayer. Demo-Münzen und Ergebnisse sind getrennt von deinem Online-Konto.</p>
    </div>
  )
}