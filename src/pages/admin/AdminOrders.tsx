import { useState } from 'react';
import { mockOrders } from '@/data/mockData';
import { Order, OrderStatus } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { orderService } from '@/services/orderService';

const statusColors: Record<OrderStatus, string> = {
  Pendente: 'bg-yellow-100 text-yellow-800',
  Entregue: 'bg-green-100 text-green-800',
  Cancelado: 'bg-red-100 text-red-800',
  Finalizado: 'bg-blue-100 text-blue-800',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try { await orderService.updateStatus(orderId, status); } catch { /* fallback local */ }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    toast({ title: `Pedido ${orderId} atualizado para ${status}` });
  };

  const filtered = orders.filter(o => {
    if (filterStatus && o.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.buyer.name.toLowerCase().includes(q) || o.buyer.email.toLowerCase().includes(q) || o.buyer.cpf.includes(q) || o.id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 pt-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Pedidos</h2>

      <div className="flex flex-wrap gap-4">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, email ou CPF..." className="max-w-xs" />
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Entregue">Entregue</SelectItem>
            <SelectItem value="Cancelado">Cancelado</SelectItem>
            <SelectItem value="Finalizado">Finalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-sm border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(o => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.id}</TableCell>
                <TableCell>{o.buyer.name}</TableCell>
                <TableCell>R$ {o.total.toFixed(2).replace('.', ',')}</TableCell>
                <TableCell>
                  <Select value={o.status} onValueChange={v => updateStatus(o.id, v as OrderStatus)}>
                    <SelectTrigger className="w-32 h-8">
                      <Badge className={statusColors[o.status]}>{o.status}</Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Entregue">Entregue</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                      <SelectItem value="Finalizado">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader><DialogTitle className="font-display">Pedido {o.id}</DialogTitle></DialogHeader>
                      <div className="space-y-4 text-sm">
                        <div>
                          <h4 className="font-semibold text-foreground">Comprador</h4>
                          <p>{o.buyer.name} · {o.buyer.email}</p>
                          <p>CPF: {o.buyer.cpf} · Tel: {o.buyer.phone}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Endereço</h4>
                          <p>{o.buyer.address.street}, {o.buyer.address.number} {o.buyer.address.complement}</p>
                          <p>{o.buyer.address.neighborhood} - {o.buyer.address.city}/{o.buyer.address.state}</p>
                          <p>CEP: {o.buyer.address.cep}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Itens</h4>
                          {o.items.map((item, i) => (
                            <div key={i} className="flex justify-between border-b border-border py-2">
                              <span>{item.product.name} ({item.selectedSize}/{item.selectedColor}) x{item.quantity}</span>
                              <span>R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                            </div>
                          ))}
                          <div className="flex justify-between pt-2 font-bold">
                            <span>Total</span>
                            <span>R$ {o.total.toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminOrders;
