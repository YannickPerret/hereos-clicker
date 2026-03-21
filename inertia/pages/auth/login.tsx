import { useForm, Link } from '@inertiajs/react'

export default function Login() {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    post('/login')
  }

  return (
    <div className="min-h-screen bg-cyber-black flex items-center justify-center relative">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      <div className="w-full max-w-md relative z-10">
        <img
          src="/images/hereos_logo.webp"
          alt="HEREOS"
          className="mx-auto mb-3 h-20 w-auto object-contain"
        />
        <p className="text-center text-gray-500 mb-8 text-sm tracking-widest uppercase">
          Cyberpunk Clicker // Connexion
        </p>

        <form onSubmit={handleSubmit} className="bg-cyber-dark border border-cyber-blue/30 rounded-lg p-8 neon-border">
          <div className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-blue mb-2">Email</label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                className="w-full bg-cyber-black border border-cyber-blue/30 rounded px-4 py-2.5 text-white focus:border-cyber-blue focus:outline-none focus:ring-1 focus:ring-cyber-blue/50 transition-all"
                placeholder="runner@neo-city.net"
              />
              {errors.email && <p className="text-cyber-red text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-blue mb-2">Mot de passe</label>
              <input
                type="password"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                className="w-full bg-cyber-black border border-cyber-blue/30 rounded px-4 py-2.5 text-white focus:border-cyber-blue focus:outline-none focus:ring-1 focus:ring-cyber-blue/50 transition-all"
                placeholder="********"
              />
              {errors.password && <p className="text-cyber-red text-xs mt-1">{errors.password}</p>}
            </div>

            {(errors as any).E_INVALID_CREDENTIALS && (
              <p className="text-cyber-red text-xs">Identifiants invalides</p>
            )}

            <button
              type="submit"
              disabled={processing}
              className="w-full py-3 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue font-bold uppercase tracking-widest rounded hover:bg-cyber-blue/30 transition-all disabled:opacity-50 neon-border"
            >
              {processing ? '[ CONNEXION... ]' : '[ SE CONNECTER ]'}
            </button>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            Pas de compte ?{' '}
            <Link href="/register" className="text-cyber-pink hover:underline">
              S'inscrire
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
