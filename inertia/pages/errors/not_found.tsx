import { Head, Link } from '@inertiajs/react'

export default function NotFound() {
  return (
    <>
      <Head title="404 - Page introuvable" />
      <div className="min-h-screen bg-cyber-black text-white flex items-center justify-center px-6">
        <div className="max-w-xl text-center border border-cyber-blue/30 bg-cyber-dark/60 rounded-lg p-8">
          <p className="text-cyber-blue text-xs tracking-[0.3em] uppercase mb-2">Erreur 404</p>
          <h1 className="text-3xl font-bold mb-4">Page introuvable</h1>
          <p className="text-gray-300 mb-6">
            La ressource demandee n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <Link
            href="/play"
            className="inline-block px-5 py-2 border border-cyber-blue text-cyber-blue rounded hover:bg-cyber-blue/10 transition-all"
          >
            Retour au jeu
          </Link>
        </div>
      </div>
    </>
  )
}
