import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { products, categories } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get('category') || '';
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  const subcategories = useMemo(() => {
    if (!selectedCategory) return [];
    return categories.find(c => c.id === selectedCategory)?.subcategories || [];
  }, [selectedCategory]);

  const filtered = useMemo(() => {
    let list = products;
    if (selectedCategory) list = list.filter(p => p.categoryId === selectedCategory);
    if (selectedSubcategory) list = list.filter(p => p.subcategoryId === selectedSubcategory);
    return list;
  }, [selectedCategory, selectedSubcategory]);

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="font-display text-3xl font-bold text-foreground">Nossos Produtos</h1>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-4">
          <Select value={selectedCategory} onValueChange={v => { setSelectedCategory(v === 'all' ? '' : v); setSelectedSubcategory(''); }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {subcategories.length > 0 && (
            <Select value={selectedSubcategory} onValueChange={v => setSelectedSubcategory(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Subcategoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {subcategories.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 gap-y-8">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
        {filtered.length === 0 && (
          <p className="mt-12 text-center text-muted-foreground">Nenhum produto encontrado nesta categoria.</p>
        )}
      </div>
    </Layout>
  );
};

export default ProductsPage;
