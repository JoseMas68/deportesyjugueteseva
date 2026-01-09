import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-eva-black text-eva-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-eva-yellow mb-4">EVA</h1>
        <p className="text-xl mb-8">Deportes y Juguetes Eva</p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/admin"
            className="btn btn-primary"
          >
            Panel Admin
          </Link>

          <a
            href="http://localhost:4321"
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver Tienda
          </a>
        </div>

        <p className="mt-8 text-eva-gray-400 text-sm">
          Backend API & Admin Panel
        </p>
      </div>
    </div>
  )
}
