import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useAddToCart, getGetCartQueryKey } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import { Product } from '@workspace/api-client-react';
import { useLocation } from 'wouter';

export function AddToCartButton({ product, className, variant = 'default', size = 'default' }: { product: Product, className?: string, variant?: any, size?: any }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const addToCart = useAddToCart();

  const handleAdd = () => {
    if (!isAuthenticated) {
      setLocation('/login');
      return;
    }

    if (product.variants && product.variants.length > 0) {
      // Direct to product page if variants need selection
      setLocation(`/products/${product.id}`);
      return;
    }

    addToCart.mutate(
      { data: { productId: product.id, quantity: 1 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({
            title: 'Added to cart',
            description: `${product.name} has been added to your cart.`,
          });
        },
        onError: () => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not add to cart. Please try again.',
          });
        }
      }
    );
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className} 
      onClick={handleAdd}
      disabled={addToCart.isPending || product.stock === 0}
    >
      {addToCart.isPending ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
      ) : (
        <ShoppingBag className="mr-2 h-4 w-4" />
      )}
      {product.stock === 0 ? 'Out of Stock' : product.variants?.length ? 'Select Options' : 'Add to Cart'}
    </Button>
  );
}
