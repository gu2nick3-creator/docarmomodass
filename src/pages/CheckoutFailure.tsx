import { Link, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

const CheckoutFailure = () => {
  const [params] = useSearchParams();
  const orderId = params.get('orderId') || localStorage.getItem('last_order_id') || '';

  return (
    <Layout>
      <div className="container py-20 text-center">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-sm border border-border bg-card p-8">
          <XCircle className="h-10 w-10 text-destructive" />
          <h1 className="font-display text-3xl font-bold text-foreground">Pagamento não concluído</h1>
          <p className="text-muted-foreground">
            Não conseguimos finalizar o pagamento. Você pode tentar novamente.
          </p>

          {orderId && (
            <p className="text-sm text-muted-foreground">
              Pedido: <span className="font-semibold text-foreground">#{orderId}</span>
            </p>
          )}

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link to="/checkout">
              <Button className="bg-accent text-accent-foreground hover:bg-gold-dark">
                Tentar novamente
              </Button>
            </Link>
            <Link to="/carrinho">
              <Button variant="outline">Voltar ao carrinho</Button>
            </Link>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Se o problema continuar, fale com a loja pelo WhatsApp.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutFailure;
