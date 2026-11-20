import Link from 'next/link';

export default function Navbar() {
  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-50 bg-[#f7f7f5]/95 backdrop-blur-md border-b border-[#e7e7e7]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold tracking-tight text-xl text-[#1d1d1f]">Ferment AI<span className="text-[#84657c]">.</span></Link>
        <div className="flex gap-5 sm:gap-8 text-sm text-[#57565b]">
          <Link href="/design" className="hover:text-[#1d1d1f] focus-visible:outline focus-visible:outline-2">Design a drink</Link>
          <Link href="/journal" className="hover:text-[#1d1d1f] focus-visible:outline focus-visible:outline-2">Batch journal</Link>
          <Link href="/memory" className="hover:text-[#1d1d1f] focus-visible:outline focus-visible:outline-2">Taste memory</Link>
          <Link href="/predict" className="hover:text-[#1d1d1f] focus-visible:outline focus-visible:outline-2">Research lab</Link>
          <Link href="/about" className="hover:text-[#1d1d1f] focus-visible:outline focus-visible:outline-2">About</Link>
        </div>
      </div>
    </nav>
  );
}
