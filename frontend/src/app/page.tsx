import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-6">
      <section className="min-h-[72vh] flex flex-col justify-center items-center text-center py-24">
        <p className="text-xs uppercase tracking-[0.3em] text-[#84657c] mb-8">Ferment AI · A new kind of home fermentation studio</p>
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-semibold tracking-[-0.055em] leading-[1.05] max-w-4xl text-[#1d1d1f]">
          Make something<br /><span className="text-[#806177]">that tastes like you.</span>
        </h1>
        <p className="text-lg sm:text-xl text-[#68686d] max-w-xl mt-8 leading-relaxed">
          Start with the moment you have in mind. Explore the flavours you love. Start with the moment in mind, explore what you love, and save your personal flavour profile.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link href="/design" className="rounded-full bg-[#1d1d1f] text-white px-8 py-4 font-medium hover:bg-[#493943] transition-colors">Design your taste</Link>
          <Link href="/predict" className="rounded-full border border-[#d9d7d8] px-8 py-4 text-[#1d1d1f] hover:bg-white transition-colors">Explore the research lab</Link>
        </div>
        <p className="mt-5 text-sm text-[#777]">18+ only. Flavour design is live; validated recipes and safety advice are not yet available.</p>
      </section>
      <section className="grid md:grid-cols-3 gap-5 pb-24" aria-label="The Ferment AI journey">
        {[
          ['01', 'Choose the moment', 'A quiet evening, a dinner or a gathering. Begin with how you want to enjoy your drink.'],
          ['02', 'Find your flavour', 'Sweet, tart, aromatic, crisp or rich. Build a personal taste profile from simple sensory notes.'],
          ['03', 'Learn by making', 'Understand ingredients, equipment and the science before starting a safe, feasible batch.'],
        ].map(([number, title, description]) => (
          <article key={number} className="rounded-[28px] border border-[#e7e7e7] bg-white p-9 min-h-[240px]">
            <span className="text-[#927389] text-sm font-medium">{number}</span>
            <h2 className="text-2xl font-semibold tracking-tight mt-12 mb-3 text-[#1d1d1f]">{title}</h2>
            <p className="text-[#68686d] leading-relaxed">{description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
