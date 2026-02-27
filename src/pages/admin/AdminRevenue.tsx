import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, TrendingUp, Package, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ApiError } from '@/services/api';
import { dashboardService, type DashboardMetrics } from '@/services/dashboardService';

const currency = (n: number) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`;

const AdminRevenue = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardMetrics | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getMetrics();
      setData(res);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao carregar faturamento';
      toast({ title: msg, variant: 'destructive' });
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusEntries = useMemo(() => {
    const sc = data?.statusCounts ?? {};
    // garante ordem
    const ordered = ['Pendente', 'Entregue', 'Cancelado', 'Finalizado'];
    const hasAny = ordered.some(k => typeof sc[k] === 'number');

    if (hasAny) return ordered.map(k => [k, Number(sc[k] || 0)] as const);

    // fallback se backend mandar outros nomes
    return Object.entries(sc).map(([k, v]) => [k, Number(v || 0)] as const);
  }, [data]);

  const totalRevenue = Number(data?.totalRevenue || 0);
  const totalOrders = Number(data?.totalOrders || 0);
  const avgTicket = Number(data?.avgTicket || (totalOrders > 0 ? totalRevenue / totalOrders : 0));
  const pendingOrders = Number(
    data?.pendingOrders ??
      (typeof data?.statusCounts?.Pendente === 'number' ? data?.statusCounts?.Pendente : 0)
  );

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold text-foreground">Faturamento</h2>
        <button
          onClick={() => void load()}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="rounded-sm border border-border bg-card p-10 text-center text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </span>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Total</CardTitle>
                <DollarSign className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{currency(totalRevenue)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{currency(avgTicket)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Pendentes</CardTitle>
                <Package className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{pendingOrders}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status dos Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {statusEntries.map(([status, count]) => (
                  <div key={status} className="rounded-sm border border-border p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-sm text-muted-foreground">{status}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminRevenue;
