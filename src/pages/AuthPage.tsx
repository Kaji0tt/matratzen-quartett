import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, Navigate } from 'react-router-dom'
import { Mail, Lock, User, Loader2, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth-store'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

function getAuthErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined
  switch (code) {
    case 'invalid_credentials': return 'E-Mail-Adresse oder Passwort ist falsch.'
    case 'email_not_confirmed': return 'Bitte bestätige zuerst deine E-Mail-Adresse.'
    case 'user_already_exists': return 'Für diese E-Mail-Adresse besteht bereits ein Account. Bitte melde dich an.'
    case 'signup_disabled':
    case 'email_provider_disabled': return 'Die Registrierung per E-Mail ist derzeit deaktiviert.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit': return 'Zu viele Anfragen. Bitte versuche es später erneut.'
    case 'email_address_not_authorized': return 'Der E-Mail-Versand ist noch auf Testadressen beschränkt. Bitte kontaktiere den Betreiber.'
    case 'weak_password': return 'Das Passwort erfüllt die Sicherheitsanforderungen nicht. Bitte wähle ein stärkeres Passwort.'
    case 'otp_expired': return 'Der Bestätigungslink ist abgelaufen oder ungültig. Bitte fordere eine neue E-Mail an.'
    default: return error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.'
  }
}

export function AuthPage({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendAvailableAt, setResendAvailableAt] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    const search = new URLSearchParams(window.location.search)
    const description = params.get('error_description') ?? search.get('error_description')
    const code = params.get('error_code') ?? search.get('error_code')
    return description || code ? getAuthErrorMessage(Object.assign(new Error(description ?? 'Bestätigung fehlgeschlagen.'), { code })) : null
  })
  const { user, isLoading: isAuthLoading } = useAuthStore()
  const emailRedirectTo = `${window.location.origin}/auth`

  useEffect(() => {
    const updateCooldown = () => setResendCooldown(Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000)))
    updateCooldown()
    if (resendAvailableAt <= Date.now()) return
    const timer = window.setInterval(() => {
      updateCooldown()
      if (Date.now() >= resendAvailableAt) window.clearInterval(timer)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendAvailableAt])

  if (user && !isAuthLoading) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading || isAuthLoading) return
    setErrorMessage(null)
    if (mode === 'register' && username.trim().length < 3) {
      setErrorMessage('Der Benutzername muss mindestens 3 Zeichen ohne äußere Leerzeichen enthalten.')
      return
    }
    if (mode === 'register' && password !== passwordConfirmation) {
      setErrorMessage('Die Passwörter stimmen nicht überein.')
      return
    }
    setIsLoading(true)

    try {
      if (mode === 'register') {
        const normalizedEmail = email.trim()
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { username: username.trim() },
            emailRedirectTo,
          },
        })
        if (error) throw error
        setPassword('')
        setPasswordConfirmation('')
        if (data.session) {
          toast({ title: 'Willkommen! Dein Account wurde erstellt.' })
        } else {
          setConfirmationEmail(normalizedEmail)
          setResendAvailableAt(Date.now() + 60_000)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) {
          if (error.code === 'email_not_confirmed') setConfirmationEmail(email.trim())
          throw error
        }
        toast({ title: 'Willkommen zurück!', variant: 'default' })
      }
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!confirmationEmail || isLoading || Date.now() < resendAvailableAt) return
    setErrorMessage(null)
    setIsLoading(true)
    setResendAvailableAt(Date.now() + 60_000)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: confirmationEmail,
        options: { emailRedirectTo },
      })
      if (error) throw error
      toast({ title: 'Bestätigung angefordert', description: 'Bitte prüfe dein Postfach und deinen Spam-Ordner.' })
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err))
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
            <CardTitle>{confirmationEmail ? 'E-Mail bestätigen' : mode === 'login' ? 'Anmelden' : 'Registrieren'}</CardTitle>
            <CardDescription>
              {confirmationEmail
                ? 'Nur noch ein Schritt bis zu deinem Account.'
                : mode === 'login'
                ? 'Melde dich an und sammle weiter!'
                : 'Registriere dich mit deiner eigenen E-Mail-Adresse.'}
            </CardDescription>
          </CardHeader>

          {errorMessage && <p role="alert" className="px-6 pb-4 text-sm text-destructive">{errorMessage}</p>}

          {confirmationEmail ? (
            <>
              <CardContent className="space-y-4" role="status">
                <MailCheck aria-hidden="true" className="mx-auto h-12 w-12 text-purple-400" />
                <p className="text-sm">
                  Wenn die Adresse noch nicht registriert ist, erhältst du eine Bestätigungsmail an{' '}
                  <strong className="break-all">{confirmationEmail}</strong>.
                  Öffne den Link in der E-Mail, um deinen Account zu aktivieren.
                </p>
                <p className="text-sm text-muted-foreground">
                  Prüfe auch deinen Spam-Ordner. Bereits bestätigt? Melde dich mit deinem Passwort an.
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="button" variant="gaming" className="w-full" onClick={handleResend} disabled={isLoading || resendCooldown > 0}>
                  {isLoading && <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />}
                  {resendCooldown > 0 ? `Erneut senden in ${resendCooldown} s` : 'Bestätigungsmail erneut senden'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setConfirmationEmail(null); setErrorMessage(null) }} disabled={isLoading}>
                  Zurück zum Formular
                </Button>
                {mode === 'register' && <Link to="/auth" className="text-sm text-purple-400 hover:underline">Zur Anmeldung</Link>}
              </CardFooter>
            </>
          ) : <form onSubmit={handleSubmit}>
            <fieldset disabled={isLoading || isAuthLoading}>
            <CardContent className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="username">Benutzername</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      autoComplete="username"
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
                    autoComplete="email"
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
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                    minLength={6}
                  />
                </div>

                {mode === 'register' && (
                  <div className="space-y-2">
                    <Label htmlFor="password-confirmation">Passwort bestätigen</Label>
                    <Input
                      id="password-confirmation"
                      type="password"
                      autoComplete="new-password"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">Mindestens 6 Zeichen. Verwende am besten ein langes, einzigartiges Passwort.</p>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                variant="gaming"
                className="w-full"
                disabled={isLoading || isAuthLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'login' ? 'Anmelden' : 'Account erstellen'}
              </Button>

            </CardFooter>
            </fieldset>
            <div className="px-6 pb-6 text-center">
              <Link to={mode === 'login' ? '/auth/register' : '/auth'} className="text-sm text-purple-400 hover:underline">
                {mode === 'login'
                  ? 'Noch kein Account? Jetzt registrieren'
                  : 'Bereits registriert? Anmelden'}
              </Link>
            </div>
          </form>}
        </Card>
      </motion.div>
    </div>
  )
}
