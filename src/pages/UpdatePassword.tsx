import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, KeyRound } from 'lucide-react'

export function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Verificar si realmente estamos en una sesión de recuperación
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login')
      }
    })
  }, [navigate])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/'), 2000)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl">
        <CardHeader className="space-y-1 items-center pb-6">
          <div className="w-12 h-12 bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Nueva Contraseña</CardTitle>
          <CardDescription className="text-zinc-400 text-center">
            Introduce tu nueva contraseña para acceder a la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="p-3 bg-emerald-900/50 border border-emerald-900 text-emerald-200 text-sm rounded-md text-center">
              ¡Contraseña actualizada con éxito! Redirigiendo...
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-900/50 border border-red-900 text-red-200 text-sm rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Nueva Contraseña</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-red-500"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-red-800 hover:bg-red-700 text-white font-medium transition-colors mt-4"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Actualizar Contraseña'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
