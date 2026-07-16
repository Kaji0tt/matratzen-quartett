import { useState } from 'react'
import { motion } from 'framer-motion'
import { Navigate } from 'react-router-dom'
import { Mail, Lock, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth-store'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuthStore()

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          },
        })
        if (error) throw error
        toast({
          title: 'Registrierung erfolgreich!',
          description: 'Bitte bestätige deine E-Mail-Adresse.',
        })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast({ title: 'Willkommen zurück!', variant: 'default' })
      }
    } catch (err) {
      toast({
        title: 'Fehler',
        description: err instanceof Error ? err.message : 'Unbekannter Fehler',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🛏️</div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-gaming">
            MATRATZEN QUARTETT
          </h1>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>{mode === 'login' ? 'Anmelden' : 'Registrieren'}</CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Melde dich an und sammle weiter!'
                : 'Erstelle deinen Account und starte deine Sammlung.'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="username">Benutzername</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="MatressMaster99"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-9"
                      required
                      minLength={3}
                      maxLength={20}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="du@beispiel.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                variant="gaming"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'login' ? 'Anmelden' : 'Account erstellen'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login'
                  ? 'Noch kein Account? Jetzt registrieren'
                  : 'Bereits registriert? Anmelden'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
