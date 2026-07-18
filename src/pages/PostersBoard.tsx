import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export function PostersBoard() {
  const [posters, setPosters] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const { session } = useAuth()

  useEffect(() => {
    fetchPosters()
  }, [])

  const fetchPosters = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.storage.from('posters').list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

      if (error) {
        console.error('Error fetching posters:', error)
        return
      }

      const urls = data
        .filter(file => file.name !== '.emptyFolderPlaceholder')
        .map(file => supabase.storage.from('posters').getPublicUrl(file.name).data.publicUrl)
      
      setPosters(urls)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 5MB.')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { error } = await supabase.storage
        .from('posters')
        .upload(fileName, file)

      if (error) {
        throw new Error(error.message)
      }

      await fetchPosters() // Refrescar la lista tras subir
    } catch (err: any) {
      alert('Error al subir el póster: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
            <ImageIcon className="w-8 h-8 text-emerald-500" />
            Tablón de Fiestas
          </h1>
          <p className="text-zinc-400">Pósters y carteles de otras peñas y eventos para ir calentando motores.</p>
        </div>
        
        <div>
          <input
            type="file"
            id="poster-upload"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <label htmlFor="poster-upload">
            <Button 
              asChild 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
              disabled={uploading}
            >
              <div>
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {uploading ? 'Subiendo...' : 'Sube el póster'}
              </div>
            </Button>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
      ) : posters.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <ImageIcon className="w-12 h-12 text-zinc-600 mb-4" />
            <p className="text-lg text-zinc-400 font-medium">No hay carteles subidos todavía</p>
            <p className="text-sm text-zinc-500 mt-1">¡Sé el primero en subir un póster para las próximas fiestas!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {posters.map((url, i) => (
            <div 
              key={i} 
              className="aspect-[2/3] relative rounded-xl overflow-hidden cursor-pointer group border border-zinc-800 hover:border-emerald-500/50 transition-colors bg-zinc-900"
              onClick={() => setSelectedImage(url)}
            >
              <img 
                src={url} 
                alt="Póster" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="bg-black/60 text-white px-3 py-1.5 rounded-md text-sm backdrop-blur-sm">Ampliar</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 p-2 rounded-full bg-zinc-800/50 text-white hover:bg-zinc-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedImage(null)
            }}
          >
            <X className="w-6 h-6" />
          </button>
          
          <img 
            src={selectedImage} 
            alt="Póster ampliado" 
            className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
          />
        </div>
      )}
    </div>
  )
}
