import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Coins, ShieldAlert, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDemoGameStore } from '@/store/demo-game-store'

const demoOffers = [
  { id: 'demo-small', title: 'Handvoll Demo-Münzen', amount: 250, price: 'Demo-Angebot A' },
  { id: 'demo-large', title: 'Großer Demo-Münzbeutel', amount: 1000, price: 'Demo-Angebot B' },
]

export function ShopPage() {
  const [notice, setNotice] = useState('')
  const checkout = useDemoGameStore((state) => state.checkout)
  const startCheckout = useDemoGameStore((state) => state.startCheckout)
  const resolveCheckout = useDemoGameStore((state) => state.resolveCheckout)
  const track = useDemoGameStore((state) => state.track)
  const hasTrackedOpen = useRef(false)

  useEffect(() => {
    if (hasTrackedOpen.current) return
    hasTrackedOpen.current = true
    track('shop_opened', { sandbox: true })
  }, [track])

  const beginCheckout = (offerId: string) => {
    try {
      startCheckout(offerId)
      setNotice('Demo-Vorgang gestartet. Es wurde keine Zahlung ausgelöst.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Demo-Vorgang konnte nicht gestartet werden.')
    }
  }

  const resolve = (approved: boolean) => {
    resolveCheckout(approved)
    setNotice(approved
      ? 'Sandbox bestätigt: Es wurde nichts gekauft und keine Währung gutgeschrieben.'
      : 'Sandbox abgelehnt: Es wurde nichts gekauft und keine Währung verändert.')
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
          <ShieldAlert className="h-3.5 w-3.5" /> Demo / Sandbox · keine echten Zahlungen
        </p>
        <h1 className="text-2xl font-bold text-white">Shop</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Der Zahlungsanbieter ist noch nicht verbunden. Diese Vorschau verändert weder Demo- noch produktive Kontostände.
        </p>
      </div>

      {notice && <p role="status" aria-live="polite" className="mb-4 rounded-lg border border-border/50 bg-card p-3 text-sm text-muted-foreground">{notice}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {demoOffers.map((offer) => (
          <Card key={offer.id} className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Coins className="h-5 w-5 text-amber-400" /> {offer.title}
              </CardTitle>
              <CardDescription>{offer.price} · nur zur Vorschau</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-2xl font-bold text-amber-300">{offer.amount.toLocaleString()} Demo-Münzen</p>
              <Button className="w-full" variant="outline" onClick={() => beginCheckout(offer.id)}>
                Sandbox-Vorgang starten
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {checkout && (
        <Card className="mt-6 border-border/50">
          <CardHeader>
            <CardTitle className="text-white">Letzter Testvorgang</CardTitle>
            <CardDescription>
              {checkout.offer} · {new Date(checkout.createdAt).toLocaleString('de-DE')} · ID {checkout.id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Status: {checkout.status}</p>
            {checkout.status === 'pending' && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => resolve(true)} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Sandbox genehmigen
                </Button>
                <Button variant="outline" onClick={() => resolve(false)} className="gap-2">
                  <XCircle className="h-4 w-4" /> Sandbox ablehnen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}