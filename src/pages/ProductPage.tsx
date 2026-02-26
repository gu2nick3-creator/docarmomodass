import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { subcategoryService } from '@/services/subcategoryService';
import { useToast } from '@/hooks/use-toast';
import { ApiError } from '@/services/api';

type ColorObj = { name: string; hex: string; inStock?: boolean };

type ProductUI = {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  categoryId: string;
  subcategoryId?: string;
  sizes: string[];
  colors: ColorObj[];
};

type CategoryUI = { id: string; name: string };
type SubcategoryUI = { id: string; name: string; categoryId: string };

function safeString(v: any) {
  return String(v ?? '').trim();
}

function unwrapArray(x: any) {
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.items)) return x.items;
  if (Array.isArray(x?.data)) return x.data;
  return [];
}

function normalizeColors(colors: any): ColorObj[] {
  if (!Array.isArray(colors)) return [];
  return colors
    .map((c: any) => {
      if (typeof c === 'string') return { name: c, hex: c, inStock: true };
      const name = safeString(c?.name ?? c?.hex);
      const hex = safeString(c?.hex ?? '');
      if (!name && !hex) return null;
      return { name: name || hex, hex: hex || name, inStock: c?.inStock ?? true };
    })
    .filter(Boolean) as ColorObj[];
}

function normalizeProductFromApi(p: any): ProductUI {
  return {
    id: safeString(p?.id),
    name: safeString(p?.name),
    price: Number(p?.price ?? 0),
    description: String(p?.description ?? ''),
    image: safeString(p?.image),
    categoryId: safeString(p?.categoryId ?? p?.category_id),
    subcategoryId: safeString(p?.subcategoryId ?? p?.subcategory_id),
    sizes: Array.isArray(p?.sizes) ? p.sizes.map((s: any) => safeString(s)).filter(Boolean) : [],
    colors: normalizeColors(p?.colors),
  };
}

const ProductPage = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductUI | null>(null);

  const [categories, setCategories] = useState<CategoryUI[]>([]);
  const [subcategoriesAll, setSubcategoriesAll] = useState<SubcategoryUI[]>([]);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState<ColorObj | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      try {
        const [catsRes, subsRes] = await Promise.all([
          categoryService.getAll(),
          subcategoryService.getAll(),
        ]);

        setCategories(unwrapArray(catsRes).map((c: any) => ({ id: safeString(c?.id), name: String(c?.name ?? '') })));
        setSubcategoriesAll(
          unwrapArray(subsRes).map((s: any) => ({
            id: safeString(s?.id),
            name: String(s?.name ?? ''),
            categoryId: safeString(s?.categoryId ?? s?.category_id),
          })),
        );

        // tenta getById, se o backend não tiver, cai no getAll e filtra
        let p: any = null;
        try {
          p = await productService.getById(id);
        } catch {
          const all = await productService.getAll();
          const arr = unwrapArray(all);
          p = arr.find((x: any) => safeString(x?.id) === safeString(id)) ?? null;
        }

        if (!p) {
          setProduct(null);
          return;
        }

        const normalized = normalizeProductFromApi(p);
        setProduct(normalized);

        // reset seleção quando muda de produto
        setSelectedSize('');
        setSelectedColor(null);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Erro ao carregar produto';
        toast({ title: msg, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  const category = useMemo(() => {
    if (!product?.categoryId) return null;
    return categories.find(c => safeString(c.id) === safeString(product.categoryId)) ?? null;
  }, [categories, product?.categoryId]);

  const subcategory = useMemo(() => {
    if (!product?.subcategoryId) return null;
    return subcategoriesAll.find(s => safeString(s.id) === safeString(product.subcategoryId)) ?? null;
  }, [subcategoriesAll, product?.subcategoryId]);

  const inStockColors = useMemo(() => {
    if (!product) return [];
    const list = Array.isArray(product.colors) ? product.colors : [];
    // se vier sem inStock, assume true
    return list.filter(c => c?.inStock !== false);
  }, [product]);

  const handleAdd = () => {
    if (!product) return;
    if (!selectedSize || !selectedColor) return;

    // o carrinho antigo esperava "selectedColor" como string (nome)
    // vamos mandar o nome se tiver, senão o hex.
    addItem(product as any, selectedSize, selectedColor.name || selectedColor.hex);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 text-center text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando produto...
          </span>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Produto não encontrado</h1>
          <Link to="/produtos">
            <Button variant="outline" className="mt-4">
              Voltar aos produtos
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <Link
          to="/produtos"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar aos produtos
        </Link>

        <div className="grid gap-10 md:grid-cols-2">
          {/* Image */}
          <div className="aspect-[3/4] overflow-hidden rounded-sm bg-muted">
            <img
              src={product.image || '/images/placeholder.png'}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-accent">
                {category?.name || 'Categoria'} {subcategory ? `/ ${subcategory.name}` : ''}
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold text-foreground">{product.name}</h1>
              <p className="mt-3 text-2xl font-bold text-foreground">
                R$ {Number(product.price || 0).toFixed(2).replace('.', ',')}
              </p>
            </div>

            <p className="text-muted-foreground leading-relaxed">{product.description || ''}</p>

            {/* Size selector */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Tamanho</p>
              <div className="flex flex-wrap gap-2">
                {(product.sizes || []).map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={cn(
                      'min-w-[44px] rounded-sm border px-3 py-2 text-sm font-medium transition-colors',
                      selectedSize === s
                        ? 'border-accent bg-accent text-accent-foreground'
                        : 'border-border text-foreground hover:border-accent',
                    )}
                  >
                    {s}
                  </button>
                ))}
                {(!product.sizes || product.sizes.length === 0) && (
                  <p className="text-xs text-muted-foreground">Sem tamanhos cadastrados.</p>
                )}
              </div>
            </div>

            {/* Color selector */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Cor</p>
              <div className="flex flex-wrap gap-3">
                {inStockColors.map(c => (
                  <button
                    key={c.name || c.hex}
                    onClick={() => setSelectedColor(c)}
                    className={cn(
                      'h-9 w-9 rounded-sm border-2 transition-all',
                      selectedColor?.name === c.name && selectedColor?.hex === c.hex
                        ? 'border-accent ring-2 ring-accent ring-offset-2'
                        : 'border-border',
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
                {inStockColors.length === 0 && (
                  <p className="text-xs text-muted-foreground">Sem cores cadastradas.</p>
                )}
              </div>
              {selectedColor && <p className="mt-1 text-xs text-muted-foreground">{selectedColor.name}</p>}
            </div>

            <Button
              onClick={handleAdd}
              disabled={!selectedSize || !selectedColor}
              className="mt-2 bg-accent text-accent-foreground hover:bg-gold-dark py-6 text-sm uppercase tracking-wider"
            >
              <ShoppingBag className="mr-2 h-4 w-4" /> Adicionar ao Carrinho
            </Button>

            {(!selectedSize || !selectedColor) && (
              <p className="text-xs text-muted-foreground">Selecione tamanho e cor para continuar.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductPage;
