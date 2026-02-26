import { useEffect, useMemo, useState } from 'react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { imageService } from '@/services/imageService';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { subcategoryService } from '@/services/subcategoryService';
import { ApiError } from '@/services/api';

type Category = { id: string; name: string };
type Subcategory = { id: string; name: string; categoryId: string };

const emptyProduct = (): Partial<Product> => ({
  name: '',
  price: 0,
  categoryId: '',
  subcategoryId: '',
  sizes: [],
  colors: [],
  description: '',
  image: '',
});

const AdminProducts = () => {
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategoriesAll, setSubcategoriesAll] = useState<Subcategory[]>([]);

  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>(emptyProduct());
  const [sizeInput, setSizeInput] = useState('');
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#000000');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [prods, cats, subs] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
        subcategoryService.getAll(),
      ]);
      setProductsList(Array.isArray(prods) ? prods : (prods?.items ?? []));
      setCategories(Array.isArray(cats) ? cats : (cats?.items ?? []));
      setSubcategoriesAll(Array.isArray(subs) ? subs : (subs?.items ?? []));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao carregar dados';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subcategories = useMemo(() => {
    if (!form.categoryId) return [];
    return subcategoriesAll.filter(s => s.categoryId === form.categoryId);
  }, [form.categoryId, subcategoriesAll]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct());
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ ...p });
    setOpen(true);
  };

  const addSize = () => {
    if (sizeInput && !form.sizes?.includes(sizeInput)) {
      setForm(prev => ({ ...prev, sizes: [...(prev.sizes || []), sizeInput] }));
      setSizeInput('');
    }
  };

  const removeSize = (s: string) =>
    setForm(prev => ({ ...prev, sizes: prev.sizes?.filter(x => x !== s) }));

  const addColor = () => {
    if (colorName && !form.colors?.find(c => c.name === colorName)) {
      setForm(prev => ({
        ...prev,
        colors: [...(prev.colors || []), { name: colorName, hex: colorHex, inStock: true }],
      }));
      setColorName('');
      setColorHex('#000000');
    }
  };

  const removeColor = (name: string) =>
    setForm(prev => ({ ...prev, colors: prev.colors?.filter(c => c.name !== name) }));

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande', description: 'Máximo 5MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const result = await imageService.upload(file);
      setForm(prev => ({ ...prev, image: result.secure_url }));
      toast({ title: 'Imagem enviada com sucesso!' });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Erro no upload da imagem. Configure o Cloudinary.';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.categoryId) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await productService.update(editing.id, form);
        toast({ title: 'Produto atualizado com sucesso!' });
      } else {
        await productService.create(form as Omit<Product, 'id'>);
        toast({ title: 'Produto cadastrado com sucesso!' });
      }
      setOpen(false);
      await loadAll();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao salvar produto';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      await productService.delete(id);
      toast({ title: 'Produto excluído.' });
      await loadAll();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao excluir produto';
      toast({ title: message, variant: 'destructive' });
    }
  };

  const filtered = productsList.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat && p.categoryId !== filterCat) return false;
    return true;
  });

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold text-foreground">Produtos</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-accent text-accent-foreground hover:bg-gold-dark">
              <Plus className="mr-2 h-4 w-4" /> Criar Produto
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">{editing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nome *</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>

                <div>
                  <Label>Preço *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label>Categoria *</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={v => setForm(p => ({ ...p, categoryId: v, subcategoryId: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Subcategoria</Label>
                  <Select value={form.subcategoryId} onValueChange={v => setForm(p => ({ ...p, subcategoryId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Imagem do Produto</Label>
                {form.image && (
                  <div className="mt-2 mb-2 relative inline-block">
                    <img src={form.image} alt="Preview" className="h-24 w-24 object-cover rounded-sm border border-border" />
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, image: '' }))}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) void handleImageUpload(file);
                    }}
                    className="cursor-pointer"
                  />
                  {uploading && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">JPG, PNG ou WebP. Máx: 5MB. Upload via Cloudinary.</p>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label>Tamanhos</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={sizeInput}
                    onChange={e => setSizeInput(e.target.value)}
                    placeholder="Ex: M"
                    className="w-24"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSize())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addSize}>
                    Adicionar
                  </Button>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {form.sizes?.map(s => (
                    <span key={s} className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-1 text-xs">
                      {s}{' '}
                      <button type="button" onClick={() => removeSize(s)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <Label>Cores em Estoque</Label>
                <div className="flex gap-2 mt-1 items-end">
                  <div>
                    <Label className="text-xs">Nome</Label>
                    <Input value={colorName} onChange={e => setColorName(e.target.value)} placeholder="Preto" className="w-28" />
                  </div>
                  <div>
                    <Label className="text-xs">Cor</Label>
                    <input
                      type="color"
                      value={colorHex}
                      onChange={e => setColorHex(e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded border border-border"
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addColor}>
                    Adicionar
                  </Button>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {form.colors?.map(c => (
                    <span key={c.name} className="inline-flex items-center gap-2 rounded-sm border border-border px-2 py-1 text-xs">
                      <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: c.hex }} /> {c.name}
                      <button type="button" onClick={() => removeColor(c.name)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving || uploading} className="w-full bg-accent text-accent-foreground hover:bg-gold-dark">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? 'Salvar Alterações' : 'Cadastrar Produto'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..." className="max-w-xs" />
        <Select value={filterCat} onValueChange={v => setFilterCat(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar categoria" />
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
      </div>

      <div className="rounded-sm border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Cores</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                  </span>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {p.image && <img src={p.image} alt={p.name} className="h-10 w-10 rounded-sm object-cover" />}
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>R$ {p.price.toFixed(2).replace('.', ',')}</TableCell>
                  <TableCell>{categories.find(c => c.id === p.categoryId)?.name || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {p.colors?.map(c => (
                        <span
                          key={c.name}
                          className="h-4 w-4 rounded-full border"
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => void handleDelete(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminProducts;
