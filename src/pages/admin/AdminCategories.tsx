import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { categoryService } from '@/services/categoryService';
import { subcategoryService } from '@/services/subcategoryService';
import { ApiError } from '@/services/api';

type Cat = { id: string; name: string };
type Sub = { id: string; name: string; categoryId: string };
type CatWithSubs = { id: string; name: string; subcategories: { id: string; name: string }[] };

const AdminCategories = () => {
  const [cats, setCats] = useState<Cat[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newSubNames, setNewSubNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingCat, setLoadingCat] = useState(false);
  const [loadingSub, setLoadingSub] = useState<string | null>(null);
  const { toast } = useToast();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [catsRes, subsRes] = await Promise.all([
        categoryService.getAll(),
        subcategoryService.getAll(),
      ]);

      const catsArr: Cat[] = Array.isArray(catsRes) ? catsRes : (catsRes?.items ?? []);
      const subsArr: Sub[] = Array.isArray(subsRes) ? subsRes : (subsRes?.items ?? []);

      setCats(catsArr);
      setSubs(subsArr);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao carregar categorias';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const catList: CatWithSubs[] = useMemo(() => {
    return cats.map(c => ({
      ...c,
      subcategories: subs
        .filter(s => s.categoryId === c.id)
        .map(s => ({ id: s.id, name: s.name })),
    }));
  }, [cats, subs]);

  const addCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;

    setLoadingCat(true);
    try {
      await categoryService.create({ name });
      setNewCatName('');
      toast({ title: 'Categoria criada com sucesso!' });
      await loadAll();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao criar categoria';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setLoadingCat(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      await categoryService.delete(id);
      toast({ title: 'Categoria excluída.' });
      await loadAll();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Erro ao excluir categoria (pode ter produtos vinculados).';
      toast({ title: msg, variant: 'destructive' });
    }
  };

  const addSubcategory = async (catId: string) => {
    const name = (newSubNames[catId] || '').trim();
    if (!name) return;

    setLoadingSub(catId);
    try {
      await subcategoryService.create({ name, categoryId: catId });
      setNewSubNames(prev => ({ ...prev, [catId]: '' }));
      toast({ title: 'Subcategoria criada!' });
      await loadAll();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao criar subcategoria';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setLoadingSub(null);
    }
  };

  const deleteSubcategory = async (subId: string) => {
    if (!confirm('Excluir esta subcategoria?')) return;

    try {
      await subcategoryService.delete(subId);
      toast({ title: 'Subcategoria excluída.' });
      await loadAll();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao excluir subcategoria';
      toast({ title: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 pt-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Categorias</h2>

      <div className="flex gap-2">
        <Input
          value={newCatName}
          onChange={e => setNewCatName(e.target.value)}
          placeholder="Nome da nova categoria"
          className="max-w-xs"
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), void addCategory())}
        />
        <Button
          onClick={() => void addCategory()}
          disabled={loadingCat}
          className="bg-accent text-accent-foreground hover:bg-gold-dark"
        >
          {loadingCat ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Criar Categoria
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : (
          catList.map(cat => (
            <Card key={cat.id}>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-lg">{cat.name}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => void deleteCategory(cat.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>

              <CardContent className="space-y-3">
                {cat.subcategories.map(sub => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-sm border border-border px-4 py-2"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <ChevronRight className="h-3 w-3 text-accent" /> {sub.name}
                    </span>
                    <button type="button" onClick={() => void deleteSubcategory(sub.id)}>
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Input
                    value={newSubNames[cat.id] || ''}
                    onChange={e => setNewSubNames(prev => ({ ...prev, [cat.id]: e.target.value }))}
                    placeholder="Nova subcategoria"
                    className="max-w-xs"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), void addSubcategory(cat.id))}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loadingSub === cat.id}
                    onClick={() => void addSubcategory(cat.id)}
                  >
                    {loadingSub === cat.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
