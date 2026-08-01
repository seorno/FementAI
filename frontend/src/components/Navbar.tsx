import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 glass-card mx-4 mt-4 mb-8 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-cyan">
        FermentAI
      </Link>
      <div className="flex gap-6 items-center">
        <Link href="/predict" className="hover:text-accent-teal transition-colors">Predict</Link>
        <Link href="/explore" className="hover:text-accent-cyan transition-colors">Explore</Link>
        <Link href="/about" className="hover:text-gray-300 transition-colors">About</Link>
      </div>
    </nav>
  );
}
