'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-bold text-xl text-blue-600">
              DNA ERP
            </Link>
            <div className="flex gap-4">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') && pathname === '/'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/po"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/po')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Purchase Orders
              </Link>
              <Link
                href="/dna"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dna')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                DNA Config
              </Link>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Demo Mode
          </div>
        </div>
      </div>
    </nav>
  )
}
