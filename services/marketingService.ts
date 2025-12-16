
import { Shop, Product, ShopCategory } from '../types';

// Mock Data tailored for Bihar - Only Construction
const MOCK_SHOPS: Shop[] = [
    {
        id: 'S3',
        ownerId: 'USR-MOCK-3',
        name: 'Raju Construction',
        category: 'CONSTRUCTION',
        location: 'Nokha Bypass',
        rating: 4.2,
        isOpen: true,
        themeColor: 'bg-slate-800'
    },
    {
        id: 'S5',
        ownerId: 'USR-MOCK-5',
        name: 'Bihar Brick Field',
        category: 'CONSTRUCTION',
        location: 'Sasaram Road',
        rating: 4.6,
        isOpen: true,
        themeColor: 'bg-stone-800'
    },
    {
        id: 'S6',
        ownerId: 'USR-MOCK-6',
        name: 'Gupta Hardware & Paint',
        category: 'CONSTRUCTION',
        location: 'Dehri Market',
        rating: 4.4,
        isOpen: true,
        themeColor: 'bg-zinc-800'
    }
];

const MOCK_PRODUCTS: Product[] = [
    { id: 'P6', shopId: 'S3', name: 'Ultratech Cement', price: 410, unit: 'bag', image: 'cement', available: true },
    { id: 'P7', shopId: 'S3', name: 'TMT Bar (12mm)', price: 65, unit: 'kg', image: 'rod', available: true },
    { id: 'P10', shopId: 'S3', name: 'Red Bricks (Class 1)', price: 12, unit: 'pc', image: 'bricks', available: true },
    { id: 'P11', shopId: 'S5', name: 'River Sand (Balu)', price: 4500, unit: 'tractor', image: 'sand', available: true, description: 'Direct from Sone River' },
    { id: 'P12', shopId: 'S5', name: 'Stone Chips (Gitti)', price: 6500, unit: 'tractor', image: 'chips', available: true },
    { id: 'P13', shopId: 'S6', name: 'Asian Paints Royale', price: 450, unit: 'L', image: 'paint', available: true },
    { id: 'P14', shopId: 'S6', name: 'PVC Pipes (4 inch)', price: 350, unit: 'pc', image: 'pipe', available: true }
];

export const getShops = async (): Promise<Shop[]> => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    return MOCK_SHOPS;
};

export const getProductsByShop = async (shopId: string): Promise<Product[]> => {
    await new Promise(r => setTimeout(r, 300));
    return MOCK_PRODUCTS.filter(p => p.shopId === shopId);
};

export const getAllProducts = async (): Promise<Product[]> => {
    return MOCK_PRODUCTS;
};

export const createShop = async (shop: Shop): Promise<boolean> => {
    MOCK_SHOPS.push(shop);
    return true;
};

export const addProduct = async (product: Product): Promise<boolean> => {
    MOCK_PRODUCTS.push(product);
    return true;
};

// Maps category to a color style for 3D walls
export const getShopStyle = (category: ShopCategory) => {
    // Only Construction left
    return 'from-slate-700 to-slate-950';
};
