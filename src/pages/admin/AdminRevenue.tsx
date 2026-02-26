import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockOrders } from '@/data/mockData';
import { DollarSign, ShoppingCart, TrendingUp, Package } from 'lucide-react';

const AdminRevenue = () => {
  const totalRevenue = mockOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = mockOrders.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const statusCounts = {
    Pendente: mockOrders.filter(o => o.status === 'Pendente').length,
    Entregue: mockOrders.filter(o => o.status === 'Entregue').length,
    Cancelado: mockOrders.filter(o => o.status === 'Cancelado').length,
    Finalizado: mockOrders.filter(o => o.status === 'Finalizado').length,
  };

  return (
    <div className="space-y-6 pt-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Faturamento</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalOrders}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">R$ {avgTicket.toFixed(2).replace('.', ',')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Pendentes</CardTitle>
            <Package className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{statusCounts.Pendente}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Status dos Pedidos</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="rounded-sm border border-border p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <p className="text-sm text-muted-foreground">{status}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRevenue;
