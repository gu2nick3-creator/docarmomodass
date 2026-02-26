import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  sizes?: string[];
  colors?: ColorObj[];
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

function normalizeProductFromApi(p: any): ProductUI {
  const id = safeString(p?.id);
  const price = Number(p?.price ?? 0);

  const colors: ColorObj[] = Array.isArray(p?.colors)
    ? p.colors.map((c: any) => {
        if (typeof c === 'string') return { name: c, hex: c, inStock: true };
        return {
          name: safeString(c?.name ?? c?.hex),
          hex: safeString(c?.hex),
          inStock: c?.inStock ?? true,
        };
      })
    : [];

  return {
    ...(p as any),
    id,
    name: safeString(p?.name),
    price,
    description: String(p?.description ?? ''),
    image: safeString(p?.image),
    categoryId: safeString(p?.categoryId ?? p?.category_id),
    subcategoryId: safeString(p?.subcategoryId ?? p?.subcategory_id),
    sizes: Array.isArray(p?.sizes) ? p.sizes.map((s: any) => safeString(s)).filter(Boolean) : [],
    colors,
  };
}

const ProductsPage = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const initialCat = searchParams.get('category') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  const [products, setProducts] = useState<ProductUI[]>([]);
  const [categories, setCategories] = useState<CategoryUI[]>([]);
  const [subcategoriesAll, setSubcategoriesAll] = useState<SubcategoryUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedCategory(initialCat);
    setSelectedSubcategory('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCat]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [prodsRes, catsRes, subsRes] = await Promise.all([
          productService.getAll(),
          categoryService.getAll(),
          subcategoryService.getAll(),
        ]);

        setProducts(unwrapArray(prodsRes).map((p: any) => normalizeProductFromApi(p)));
        setCategories(unwrapArray(catsRes).map((c: any) => ({ id: safeString(c?.id), name: String(c?.name ?? '') })));
        setSubcategoriesAll(
          unwrapArray(subsRes).map((s: any) => ({
            id: safeString(s?.id),
            name: String(s?.name ?? ''),
            categoryId: safeString(s?.categoryId ?? s?.category_id),
          })),
        );
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Erro ao carregar produtos';
        toast({ title: msg, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const subcategories = useMemo(() => {
    const catId = safeString(selectedCategory);
    if (!catId) return [];
    return subcategoriesAll.filter(s => safeString(s.categoryId) === catId);
  }, [selectedCategory, subcategoriesAll]);

  const filtered = useMemo(() => {
    let list = products;

    if (selectedCategory) list = list.filter(p => safeString(p.categoryId) === safeString(selectedCategory));
    if (selectedSubcategory) list = list.filter(p => safeString(p.subcategoryId) === safeString(selectedSubcategory));

    return list;
  }, [products, selectedCategory, selectedSubcategory]);

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="font-display text-3xl font-bold text-foreground">Nossos Produtos</h1>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-4">
          <Select
            value={selectedCategory}
            onValueChange={v => {
              setSelectedCategory(v === 'all' ? '' : v);
              setSelectedSubcategory('');
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {subcategories.length > 0 && (
            <Select value={selectedSubcategory} onValueChange={v => setSelectedSubcategory(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Subcategoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {subcategories.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 gap-y-8">
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : (
            filtered.map(p => <ProductCard key={p.id} product={p as any} />)
          )}
        </div>

        {!loading && filtered.length === 0 && (
          <p className="mt-12 text-center text-muted-foreground">Nenhum produto encontrado nesta categoria.</p>
        )}
      </div>
    </Layout>
  );
};

export default ProductsPage;
