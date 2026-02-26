import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { request, ApiError } from '@/services/api';
import { Loader2 } from 'lucide-react';

type CheckoutForm = {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
};

const CheckoutPage = () => {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CheckoutForm>({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
  });

  const update = (field: keyof CheckoutForm, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    const required: (keyof CheckoutForm)[] = [
      'name',
      'email',
      'cpf',
      'phone',
      'street',
      'number',
      'neighborhood',
      'city',
      'state',
      'cep',
    ];
    for (const k of required) {
      if (!String(form[k] ?? '').trim()) return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    if (!items.length) {
      toast({ title: 'Seu carrinho está vazio.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Monta itens pro Mercado Pago via backend
      const mpItems = items.map(i => ({
        id: String(i.product.id),
        title: i.product.name,
        quantity: Number(i.quantity || 1),
        currency_id: 'BRL',
        unit_price: Number(i.product.price || 0),
        // extras úteis pra você registrar no pedido
        selectedSize: i.selectedSize,
        selectedColor: i.selectedColor,
        image: i.product.image || '',
      }));

      const payload = {
        customer: {
          name: form.name.trim(),
          email: form.email.trim(),
          cpf: form.cpf.trim(),
          phone: form.phone.trim(),
        },
        shipping: {
          street: form.street.trim(),
          number: form.number.trim(),
          complement: form.complement.trim(),
          neighborhood: form.neighborhood.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          cep: form.cep.trim(),
        },
        items: mpItems,
        total: Number(total || 0),
      };

      // 🔥 endpoint do backend (ajuste se no seu backend for outro)
      const res = await request<{ init_point?: string; sandbox_init_point?: string }>(
        '/mercadopago/checkout',
        { method: 'POST', body: payload },
      );

      const link = res?.init_point || res?.sandbox_init_point;

      if (!link) {
        toast({
          title: 'Checkout criado, mas faltou link de pagamento',
          description: 'Verifique o endpoint /mercadopago/checkout no backend.',
          variant: 'destructive',
        });
        return;
      }

      toast({ title: 'Redirecionando para o Mercado Pago...' });

      // Você pode limpar agora (checkout já gerado)
      clearCart();

      // Redireciona pro pagamento
      window.location.href = link;
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Erro ao iniciar pagamento no Mercado Pago';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-display text-3xl font-bold">Checkout</h1>
          <p className="mt-4 text-muted-foreground">Seu carrinho está vazio.</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/produtos')}>
            Ver produtos
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="font-display text-3xl font-bold text-foreground">Checkout</h1>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-display text-xl font-semibold text-foreground">Dados Pessoais</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Nome *</Label>
                <Input value={form.name} onChange={e => update('name', e.target.value)} />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} />
              </div>
              <div>
                <Label>CPF *</Label>
                <Input value={form.cpf} onChange={e => update('cpf', e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div>
                <Label>Telefone *</Label>
                <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(00) 00000-0000" />
              </div>
            </div>

            <h2 className="font-display text-xl font-semibold text-foreground pt-4">Endereço de Entrega</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Rua *</Label>
                <Input value={form.street} onChange={e => update('street', e.target.value)} />
              </div>
              <div>
                <Label>Número *</Label>
                <Input value={form.number} onChange={e => update('number', e.target.value)} />
              </div>
              <div>
                <Label>Complemento</Label>
                <Input value={form.complement} onChange={e => update('complement', e.target.value)} />
              </div>
              <div>
                <Label>Bairro *</Label>
                <Input value={form.neighborhood} onChange={e => update('neighborhood', e.target.value)} />
              </div>
              <div>
                <Label>Cidade *</Label>
                <Input value={form.city} onChange={e => update('city', e.target.value)} />
              </div>
              <div>
                <Label>Estado *</Label>
                <Input value={form.state} onChange={e => update('state', e.target.value)} />
              </div>
              <div>
                <Label>CEP *</Label>
                <Input value={form.cep} onChange={e => update('cep', e.target.value)} placeholder="00000-000" />
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="rounded-sm border border-border bg-card p-6 h-fit">
            <h2 className="font-display text-xl font-bold text-foreground">Resumo do Pedido</h2>

            <div className="mt-4 space-y-3">
              {items.map(item => (
                <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.product.name} ({item.selectedSize}/{item.selectedColor}) x{item.quantity}
                  </span>
                  <span>R$ {(Number(item.product.price || 0) * item.quantity).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-border pt-4 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>R$ {Number(total || 0).toFixed(2).replace('.', ',')}</span>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-accent text-accent-foreground hover:bg-gold-dark py-6 text-sm uppercase tracking-wider"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Criando pagamento...
                </span>
              ) : (
                'Pagar com Mercado Pago'
              )}
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">Pagamento seguro via Mercado Pago</p>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
