import { Link } from 'wouter';
import { Product } from '@workspace/api-client-react';
import { Image } from '@/components/ui/image';
import { formatPrice } from '@/lib/api';
import { AddToCartButton } from './AddToCartButton';
import { motion } from 'framer-motion';

export function ProductCard({ product }: { product: Product }) {
  const isDiscounted = product.discountPrice != null && product.discountPrice < product.price;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group relative flex flex-col bg-card hover-elevate"
    >
      <Link href={`/products/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-muted block">
        <Image 
          src={product.imageUrl || ''} 
          alt={product.name} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        {product.isNew && (
          <div className="absolute left-3 top-3 bg-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
            New
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute left-0 top-1/2 w-full bg-background/80 py-2 text-center text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
            Sold Out
          </div>
        )}
        <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <AddToCartButton 
            product={product} 
            className="w-full bg-background/90 text-foreground hover:bg-background backdrop-blur-sm" 
            variant="secondary"
          />
        </div>
      </Link>
      
      <div className="flex flex-1 flex-col pt-4">
        <div className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {product.categoryName}
        </div>
        <Link href={`/products/${product.id}`} className="block">
          <h3 className="font-serif text-lg font-medium leading-tight group-hover:text-primary/70 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-center gap-3">
          {isDiscounted ? (
            <>
              <span className="font-medium">{formatPrice(product.discountPrice!)}</span>
              <span className="text-sm text-muted-foreground line-through">{formatPrice(product.price)}</span>
            </>
          ) : (
            <span className="font-medium">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
