import { useGetCategories } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { Link } from 'wouter';
import { Image } from '@/components/ui/image';

export default function Collections() {
  const { data: categories, isLoading } = useGetCategories();

  return (
    <Layout>
      <div className="border-b border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-serif text-4xl font-medium md:text-5xl">Collections</h1>
          <p className="mt-6 text-muted-foreground max-w-2xl mx-auto">Explore our distinct categories, each curated with an uncompromising eye for detail and design.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[4/3] bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories?.map((category) => (
              <Link 
                key={category.id} 
                href={`/shop?category=${category.id}`} 
                className="group relative aspect-[4/3] overflow-hidden bg-muted block"
              >
                <Image 
                  src={category.imageUrl || ''} 
                  alt={category.name} 
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-black/40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                  <h2 className="font-serif text-4xl font-medium mb-3">{category.name}</h2>
                  {category.description && (
                    <p className="text-sm font-light max-w-md mx-auto mb-6 opacity-90">{category.description}</p>
                  )}
                  <span className="border-b border-white pb-1 text-xs font-medium uppercase tracking-widest opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    Explore Collection
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}