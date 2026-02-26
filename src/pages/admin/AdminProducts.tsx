const handleSave = async () => {
  if (!form.name || !form.categoryId) {
    toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
    return;
  }

  // payload no formato que o backend aceita
  const payload: any = {
    name: String(form.name ?? '').trim(),
    price: Number(form.price || 0),
    categoryId: String(form.categoryId ?? '').trim(),
    subcategoryId: String(form.subcategoryId ?? '').trim(),
    description: String(form.description ?? ''),
    image: String(form.image ?? ''),
    sizes: Array.isArray(form.sizes) ? form.sizes.map(s => String(s)) : [],
    // backend espera string[] -> vamos mandar HEX
    colors: Array.isArray(form.colors)
      ? form.colors
          .map((c: any) => String(c?.hex || c?.name || '').trim())
          .filter(Boolean)
      : [],
  };

  // se subcategoryId ficar vazio, manda vazio mesmo
  if (!payload.subcategoryId) payload.subcategoryId = '';

  setSaving(true);
  try {
    if (editing) {
      const id = String((editing as any).id ?? '').trim();

      if (!id || id === ':p') {
        toast({ title: 'Não foi possível salvar: produto sem ID válido.', variant: 'destructive' });
        return; // cai no finally e libera o loading
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
