import { Layout } from '@/components/layout/Layout';

export default function About() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[500px] w-full overflow-hidden bg-muted">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-3xl text-white">
            <h1 className="font-serif text-5xl font-medium tracking-tight md:text-7xl mb-6">The Luxe Story</h1>
            <p className="text-lg font-light tracking-wide md:text-xl uppercase opacity-90">Crafting elegance since 2010</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg mx-auto md:prose-xl">
            <p className="lead text-2xl text-center font-serif text-foreground/80 mb-16 leading-relaxed">
              We founded Luxe with a singular vision: to curate a collection of exceptional objects that bring beauty and intention to everyday life.
            </p>
            
            <h2 className="font-serif font-medium text-3xl mb-6 mt-16">Our Philosophy</h2>
            <p className="text-muted-foreground">
              True luxury is not about excess. It is about the absence of compromise. It is found in the weight of a perfectly cast brass handle, the seamless drape of fine silk, and the quiet confidence of design that serves a purpose.
            </p>
            <p className="text-muted-foreground">
              Every item in our collection is selected based on three criteria: material integrity, design excellence, and enduring value. We reject the disposable in favor of the permanent.
            </p>

            <h2 className="font-serif font-medium text-3xl mb-6 mt-16">Craftsmanship First</h2>
            <p className="text-muted-foreground">
              We partner directly with ateliers and independent artisans who share our obsession with quality. By working closely with makers in Italy, Japan, Portugal, and the United Kingdom, we ensure that traditional techniques are preserved and elevated for the modern context.
            </p>

            <div className="my-20 grid grid-cols-2 gap-8 not-prose">
              <div className="aspect-square bg-muted">
                <img src="https://images.unsplash.com/photo-1618220179428-22790b46a0eb?q=80&w=1000&auto=format&fit=crop" alt="Craftsmanship detail" className="h-full w-full object-cover" />
              </div>
              <div className="aspect-square bg-muted">
                <img src="https://images.unsplash.com/photo-1549497538-303791108f95?q=80&w=1000&auto=format&fit=crop" alt="Material detail" className="h-full w-full object-cover" />
              </div>
            </div>

            <h2 className="font-serif font-medium text-3xl mb-6 mt-16">Sustainability</h2>
            <p className="text-muted-foreground">
              We believe the most sustainable product is the one you only have to buy once. We are committed to transparency in our supply chain and actively work to minimize our environmental footprint through carbon-neutral shipping and fully recyclable packaging.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}