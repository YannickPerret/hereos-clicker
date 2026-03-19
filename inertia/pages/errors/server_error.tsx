import { Head, Link } from '@inertiajs/react'

export default function ServerError() {
  return (
    <>
      <Head title="500 - Erreur serveur" />
      <div className="min-h-screen bg-cyber-black text-white flex items-center justify-center px-6">
        <div className="max-w-xl text-center border border-cyber-red/30 bg-cyber-dark/60 rounded-lg p-8">
          <p className="text-cyber-red text-xs tracking-[0.3em] uppercase mb-2">Erreur 500</p>
          <h1 className="text-3xl font-bold mb-4">Erreur serveur</h1>
          <p className="text-gray-300 mb-6">
            Une erreur interne est survenue. Reessaie dans quelques instants.
          </p>
          <Link
            href="/play"
            className="inline-block px-5 py-2 border border-cyber-red text-cyber-red rounded hover:bg-cyber-red/10 transition-all"
          >
            Retour au jeu
          </Link>
        </div>
      </div>
    </>
  )
}
