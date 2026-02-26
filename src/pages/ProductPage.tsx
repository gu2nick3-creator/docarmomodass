import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { products, categories } from '@/data/mockData';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const ProductPage = () => {
  const { id } = useParams();
  const product = products.find(p => p.id === id);
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  if (!product) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Produto não encontrado</h1>
          <Link to="/produtos"><Button variant="outline" className="mt-4">Voltar aos produtos</Button></Link>
        </div>
      </Layout>
    );
  }

  const category = categories.find(c => c.id === product.categoryId);
  const subcategory = category?.subcategories.find(s => s.id === product.subcategoryId);

  const handleAdd = () => {
    if (!selectedSize || !selectedColor) return;
    addItem(product, selectedSize, selectedColor);
  };

  return (
    <Layout>
      <div className="container py-8">
        <Link to="/produtos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar aos produtos
        </Link>

        <div className="grid gap-10 md:grid-cols-2">
          {/* Image */}
          <div className="aspect-[3/4] overflow-hidden rounded-sm bg-muted">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          </div>

          {/* Details */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-accent">
                {category?.name} {subcategory ? `/ ${subcategory.name}` : ''}
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold text-foreground">{product.name}</h1>
              <p className="mt-3 text-2xl font-bold text-foreground">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </p>
            </div>

            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            {/* Size selector */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Tamanho</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={cn(
                      'min-w-[44px] rounded-sm border px-3 py-2 text-sm font-medium transition-colors',
                      selectedSize === s
                        ? 'border-accent bg-accent text-accent-foreground'
                        : 'border-border text-foreground hover:border-accent'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Color selector */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Cor</p>
              <div className="flex flex-wrap gap-3">
                {product.colors.filter(c => c.inStock).map(c => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    className={cn(
                      'h-9 w-9 rounded-sm border-2 transition-all',
                      selectedColor === c.name ? 'border-accent ring-2 ring-accent ring-offset-2' : 'border-border'
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
              {selectedColor && <p className="mt-1 text-xs text-muted-foreground">{selectedColor}</p>}
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
