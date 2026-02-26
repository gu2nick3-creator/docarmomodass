import { Link, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const CheckoutSuccess = () => {
  const [params] = useSearchParams();
  const orderId = params.get('orderId') || localStorage.getItem('last_order_id') || '';

  return (
    <Layout>
      <div className="container py-20 text-center">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-sm border border-border bg-card p-8">
          <CheckCircle2 className="h-10 w-10 text-accent" />
          <h1 className="font-display text-3xl font-bold text-foreground">Pagamento aprovado!</h1>
          <p className="text-muted-foreground">
            Seu pedido foi confirmado. Em breve você receberá atualizações no seu email/WhatsApp.
          </p>

          {orderId && (
            <p className="text-sm text-muted-foreground">
              Pedido: <span className="font-semibold text-foreground">#{orderId}</span>
            </p>
          )}

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link to="/produtos">
              <Button className="bg-accent text-accent-foreground hover:bg-gold-dark">
                Ver mais produtos
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline">Voltar para a Home</Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutSuccess;
