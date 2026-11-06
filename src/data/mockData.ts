export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  description: string;
  images: string[];
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  colors?: string[];
  sizes?: string[];
  isNew?: boolean;
  isTrending?: boolean;
}

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Aura Minimalist Watch',
    brand: 'Timepiece',
    price: 299,
    originalPrice: 350,
    description: 'A beautifully crafted minimalist watch featuring a seamless unibody design and sapphire glass.',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80',
    ],
    category: 'Accessories',
    rating: 4.8,
    reviews: 124,
    inStock: true,
    colors: ['#000000', '#C0C0C0'],
    isNew: true,
    isTrending: true,
  },
  {
    id: '2',
    name: 'Luxe Leather Tote',
    brand: 'Maison',
    price: 590,
    description: 'Premium full-grain leather tote with soft structure and expansive interior.',
    images: [
      'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=80',
    ],
    category: 'Bags',
    rating: 4.9,
    reviews: 89,
    inStock: true,
    colors: ['#8B4513', '#000000', '#F5F5DC'],
  },
  {
    id: '3',
    name: 'Aero Noise-Cancelling Headphones',
    brand: 'Sonic',
    price: 349,
    originalPrice: 399,
    description: 'Industry-leading noise cancellation with spatial audio and a refined glass-and-aluminum finish.',
    images: [
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80',
    ],
    category: 'Electronics',
    rating: 4.7,
    reviews: 342,
    inStock: true,
    colors: ['#FFFFFF', '#000000'],
    isTrending: true,
  },
  {
    id: '4',
    name: 'Silk Blend Lounge Set',
    brand: 'Ethereal',
    price: 185,
    description: 'Ultra-soft silk blend lounge set designed for ultimate comfort and elegance.',
    images: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80',
    ],
    category: 'Clothing',
    rating: 4.6,
    reviews: 56,
    inStock: true,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['#E6E6FA', '#F08080'],
    isNew: true,
  },
  {
    id: '5',
    name: 'Matte Ceramic Vase',
    brand: 'Object',
    price: 120,
    description: 'A sculptural ceramic vase with a smooth matte finish, perfect for minimal spaces.',
    images: [
      'https://images.unsplash.com/photo-1612152505975-64536767eb32?w=800&q=80',
    ],
    category: 'Home',
    rating: 4.5,
    reviews: 28,
    inStock: false,
    colors: ['#F5F5F5', '#333333'],
  },
  {
    id: '6',
    name: 'Velocity Running Shoes',
    brand: 'Active',
    price: 180,
    description: 'Performance running shoes with responsive cushioning and a breathable knit upper.',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    ],
    category: 'Footwear',
    rating: 4.8,
    reviews: 215,
    inStock: true,
    sizes: ['8', '9', '10', '11', '12'],
    colors: ['#FF0000', '#000000', '#FFFFFF'],
    isTrending: true,
  }
];

export const mockCategories = [
  { id: '1', name: 'Accessories', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80' },
  { id: '2', name: 'Bags', image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=80' },
  { id: '3', name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80' },
  { id: '4', name: 'Clothing', image: 'https://images.unsplash.com/photo-1489987707023-af0825f5c8f8?w=800&q=80' },
  { id: '5', name: 'Home', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80' },
  { id: '6', name: 'Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80' },
];
