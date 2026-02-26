import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
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
  featured?: boolean;
  isNew?: boolean;
};

type CategoryUI = {
  id: string;
  name: string;
  subcategories: { id: string; name: string; categoryId?: string }[];
};

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

  // backend pode devolver colors como string[]
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

function normalizeCategoryFromApi(c: any): CategoryUI {
  return {
    id: safeString(c?.id),
    name: String(c?.name ?? ''),
    subcategories: Array.isArray(c?.subcategories)
      ? c.subcategories.map((s: any) => ({
          id: safeString(s?.id),
          name: String(s?.name ?? ''),
          categoryId: safeString(s?.categoryId ?? s?.category_id),
        }))
      : [],
  };
}

const Index = () => {
  const { toast } = useToast();

  const [products, setProducts] = useState<ProductUI[]>([]);
  const [categories, setCategories] = useState<CategoryUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [prodsRes, catsRes] = await Promise.all([
          productService.getAll(),
          categoryService.getAll(),
        ]);

        const prodsArr = unwrapArray(prodsRes).map((p: any) => normalizeProductFromApi(p));
        const catsArr = unwrapArray(catsRes).map((c: any) => normalizeCategoryFromApi(c));

        setProducts(prodsArr);
        setCategories(catsArr);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Erro ao carregar dados da loja';
        toast({ title: msg, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  // ✅ Destaques/Novidades: se não existir no banco, a home mostra os primeiros itens
  const featured = useMemo(() => {
    const hasFeatured = products.some(p => !!p.featured);
    if (hasFeatured) return products.filter(p => p.featured);
    return products.slice(0, 8);
  }, [products]);

  const newProducts = useMemo(() => {
    const hasNew = products.some(p => !!p.isNew);
    if (hasNew) return products.filter(p => p.isNew);
    return products.slice(0, 8);
  }, [products]);

  // ✅ Moda feminina: pega a primeira categoria que tiver "Feminina" no nome,
  // senão não filtra (pra não quebrar)
  const femininaCategoryId = useMemo(() => {
    const fem = categories.find(c => c.name.toLowerCase().includes('femin'));
    return fem?.id || '';
  }, [categories]);

  const femininaProducts = useMemo(() => {
    if (!femininaCategoryId) return products.slice(0, 8);
    return products.filter(p => p.categoryId === femininaCategoryId).slice(0, 8);
  }, [products, femininaCategoryId]);

  return (
    <Layout>
      {/* Hero Banner */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-primary">
        <img
          src="/images/vitrine.png"
          alt="Vitrine Do Carmo Modas"
          className="absolute inset-0 h-full w-full object-cover object-top opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent" />
        <div className="relative z-10 container text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent">Coleção 2026</p>
          <h1 className="mt-4 font-display text-4xl font-bold text-primary-foreground md:text-6xl lg:text-7xl">
            Vista-se com<br />
            <span className="text-accent">Elegância</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-primary-foreground/70">
            Descubra peças selecionadas que combinam sofisticação e conforto para você.
          </p>
          <Link to="/produtos">
            <Button className="mt-8 bg-accent text-accent-foreground hover:bg-gold-dark px-8 py-6 text-sm uppercase tracking-wider">
              Ver Coleção <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Destaques */}
      <section className="container py-16">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Seleção Especial</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-foreground">Mais Vendidos</h2>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 gap-y-8">
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : featured.length ? (
            featured.map(p => <ProductCard key={p.id} product={p as any} />)
          ) : (
            <p className="text-muted-foreground">Nenhum produto cadastrado ainda.</p>
          )}
        </div>
      </section>

      {/* Ogochi Section */}
      <section className="bg-primary py-16">
        <div className="container text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent">Marca Oficial</p>
          <h2 className="mt-4 font-display text-4xl font-bold text-primary-foreground md:text-5xl">
            Nós vendemos <span className="text-accent">Ogochi</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-primary-foreground/70">
            Tradição, qualidade e elegância. Encontre as melhores peças da Ogochi aqui na Do Carmo Modas.
          </p>
          <Link to="/produtos">
            <Button
              variant="outline"
              className="mt-8 border-accent text-accent hover:bg-accent hover:text-accent-foreground px-8 py-6 text-sm uppercase tracking-wider"
            >
              Explorar Ogochi
            </Button>
          </Link>
        </div>
      </section>

      {/* Novidades */}
      {newProducts.length > 0 && (
        <section className="container py-16">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Recém Chegados</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground">Novidades</h2>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 gap-y-8">
            {newProducts.map(p => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        </section>
      )}

      {/* Moda Feminina */}
      <section className="bg-primary py-16">
        <div className="container">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent">Novidade</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-primary-foreground md:text-4xl">
              Moda <span className="text-accent">Feminina</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-primary-foreground/70">
              Peças selecionadas com elegância e sofisticação para mulheres que valorizam estilo e qualidade.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 gap-y-8">
            {femininaProducts.map(p => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link to={femininaCategoryId ? `/produtos?category=${femininaCategoryId}` : '/produtos'}>
              <Button
                variant="outline"
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground px-8 py-6 text-sm uppercase tracking-wider"
              >
                Ver Coleção Feminina <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="bg-muted py-16">
        <div className="container">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">Categorias</h2>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/produtos?category=${cat.id}`}
                className="group flex flex-col items-center justify-center rounded-sm border border-border bg-card p-8 transition-all hover:border-accent hover:shadow-md"
              >
                <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {cat.subcategories?.length ?? 0} subcategorias
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
