import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">DocuMind AI</h1>
      <div className="space-x-4">
        <Button asChild className="shadow-lg transform transition-transform duration-200 hover:scale-105">
          <Link href="/signin">Sign In</Link>
        </Button>
        <Button asChild variant="outline" className="shadow-lg transform transition-transform duration-200 hover:scale-105">
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    </div>
  )
}

