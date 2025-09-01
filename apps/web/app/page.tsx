import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Dashboard
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/directory" className="px-4 py-2 hover:bg-gray-100 rounded">
              Directory
            </Link>
            <Link href="/login" className="px-4 py-2 hover:bg-gray-100 rounded">
              Sign In
            </Link>
            <Link href="/register" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-b from-gray-50 to-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6">
                Find & Book Local Services
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover the best barbershops, nail salons, and beauty services in your area
              </p>
              <div className="flex gap-4 justify-center">
                <input
                  type="text"
                  placeholder="Search for services..."
                  className="px-4 py-2 border rounded-lg w-96"
                />
                <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Popular Categories</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold mb-2">Barbershops</h3>
                <p className="text-sm text-muted-foreground">Classic cuts and modern styles</p>
              </div>
              <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold mb-2">Nail Salons</h3>
                <p className="text-sm text-muted-foreground">Manicures, pedicures, and nail art</p>
              </div>
              <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold mb-2">Hair Salons</h3>
                <p className="text-sm text-muted-foreground">Styling, coloring, and treatments</p>
              </div>
              <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold mb-2">Spa & Wellness</h3>
                <p className="text-sm text-muted-foreground">Relaxation and rejuvenation</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">For Customers</h3>
                <ul className="space-y-2 text-sm">
                  <li>✓ Find services near you</li>
                  <li>✓ Compare prices and reviews</li>
                  <li>✓ Book instantly online</li>
                  <li>✓ Get reminders and updates</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">For Businesses</h3>
                <ul className="space-y-2 text-sm">
                  <li>✓ Online booking system</li>
                  <li>✓ Staff management</li>
                  <li>✓ Customer database</li>
                  <li>✓ Analytics and insights</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Mobile Ready</h3>
                <ul className="space-y-2 text-sm">
                  <li>✓ Progressive Web App</li>
                  <li>✓ iOS and Android apps</li>
                  <li>✓ Offline support</li>
                  <li>✓ Push notifications</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-4">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            © 2025 userFit. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}