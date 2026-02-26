const handleSave = async () => {
  if (!form.name || !form.categoryId) {
    toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
    return;
  }

  // Converte o que o backend espera:
  // - price: number
  // - sizes: string[]
  // - colors: string[] (vamos mandar HEX)
  const payload: any = {
    ...form,
    price: Number(form.price || 0),
    sizes: Array.isArray(form.sizes) ? form.sizes.map(s => String(s)) : [],
    colors: Array.isArray(form.colors)
      ? form.colors
          .map((c: any) => String(c?.hex || c?.name || '').trim())
          .filter(Boolean)
      : [],
  };

  setSaving(true);
  try {
    if (editing) {
      const id = String((editing as any).id ?? '').trim();
      if (!id || id === ':p') {
        toast({ title: 'Não foi possível salvar: produto sem ID válido.', variant: 'destructive' });
        return;
      }
      await productService.update(id, payload);
      toast({ title: 'Produto atualizado com sucesso!' });
    } else {
      await productService.create(payload as Omit<Product, 'id'>);
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
