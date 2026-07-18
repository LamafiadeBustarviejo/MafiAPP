import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LogIn, Loader2 } from 'lucide-react'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      window.location.href = '/' // O navigate('/') si importamos useNavigate
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl">
        <CardHeader className="space-y-4 items-center pb-6 pt-8 px-2 md:px-4">
          <img src="/logo.png" alt="La MafiAPP" className="w-full h-auto object-contain mix-blend-screen drop-shadow-2xl scale-110" />
          <CardDescription className="text-zinc-400 mt-6 text-center">
            Inicia sesión para acceder a la peña
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-900 text-red-200 text-sm rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="tu@email.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-red-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-red-500"
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-red-800 hover:bg-red-700 text-white font-medium transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>

            <button
              type="button"
              onClick={async () => {
                if (!email) {
                  setError("Por favor, introduce tu email arriba primero")
                  return
                }
                setLoading(true)
                setError(null)
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: window.location.origin + '/update-password',
                })
                if (error) {
                  setError(error.message)
                } else {
                  setError("¡Revisa tu correo! Te hemos enviado un enlace.") // Usamos setError para mostrar el mensaje temporalmente
                }
                setLoading(false)
              }}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              ¿Has olvidado tu contraseña?
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
