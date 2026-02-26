import { useState } from 'react';
import { categories as initialCategories } from '@/data/mockData';
import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { categoryService } from '@/services/categoryService';
import { subcategoryService } from '@/services/subcategoryService';

const AdminCategories = () => {
  const [catList, setCatList] = useState<Category[]>(initialCategories);
  const [newCatName, setNewCatName] = useState('');
  const [newSubNames, setNewSubNames] = useState<Record<string, string>>({});
  const [loadingCat, setLoadingCat] = useState(false);
  const [loadingSub, setLoadingSub] = useState<string | null>(null);
  const { toast } = useToast();

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    setLoadingCat(true);
    try {
      let newCat: Category;
      try {
        newCat = await categoryService.create({ name: newCatName.trim() });
      } catch {
        newCat = { id: Date.now().toString(), name: newCatName.trim(), subcategories: [] };
      }
      setCatList(prev => [...prev, newCat]);
      setNewCatName('');
      toast({ title: 'Categoria criada com sucesso!' });
    } catch (err) {
      toast({ title: 'Erro ao criar categoria', variant: 'destructive' });
    } finally {
      setLoadingCat(false);
    }
  };

  const deleteCategory = async (id: string) => {
    try { await categoryService.delete(id); } catch { /* fallback local */ }
    setCatList(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Categoria excluída.' });
  };

  const addSubcategory = async (catId: string) => {
    const name = newSubNames[catId]?.trim();
    if (!name) return;
    setLoadingSub(catId);
    try {
      let newSub;
      try {
        newSub = await subcategoryService.create({ name, categoryId: catId });
      } catch {
        newSub = { id: Date.now().toString(), name, categoryId: catId };
      }
      setCatList(prev => prev.map(c =>
        c.id === catId ? { ...c, subcategories: [...c.subcategories, newSub] } : c
      ));
      setNewSubNames(prev => ({ ...prev, [catId]: '' }));
      toast({ title: 'Subcategoria criada!' });
    } catch {
      toast({ title: 'Erro ao criar subcategoria', variant: 'destructive' });
    } finally {
      setLoadingSub(null);
    }
  };

  const deleteSubcategory = async (catId: string, subId: string) => {
    try { await subcategoryService.delete(subId); } catch { /* fallback local */ }
    setCatList(prev => prev.map(c =>
      c.id === catId ? { ...c, subcategories: c.subcategories.filter(s => s.id !== subId) } : c
    ));
  };

  return (
    <div className="space-y-6 pt-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Categorias</h2>

      <div className="flex gap-2">
        <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nome da nova categoria" className="max-w-xs" onKeyDown={e => e.key === 'Enter' && addCategory()} />
        <Button onClick={addCategory} disabled={loadingCat} className="bg-accent text-accent-foreground hover:bg-gold-dark">
          {loadingCat ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Criar Categoria
        </Button>
      </div>

      <div className="space-y-4">
        {catList.map(cat => (
          <Card key={cat.id}>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg">{cat.name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {cat.subcategories.map(sub => (
                <div key={sub.id} className="flex items-center justify-between rounded-sm border border-border px-4 py-2">
                  <span className="flex items-center gap-2 text-sm"><ChevronRight className="h-3 w-3 text-accent" /> {sub.name}</span>
                  <button onClick={() => deleteSubcategory(cat.id, sub.id)}><Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" /></button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newSubNames[cat.id] || ''}
                  onChange={e => setNewSubNames(prev => ({ ...prev, [cat.id]: e.target.value }))}
                  placeholder="Nova subcategoria"
                  className="max-w-xs"
                  onKeyDown={e => e.key === 'Enter' && addSubcategory(cat.id)}
                />
                <Button variant="outline" size="sm" disabled={loadingSub === cat.id} onClick={() => addSubcategory(cat.id)}>
                  {loadingSub === cat.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminCategories;
