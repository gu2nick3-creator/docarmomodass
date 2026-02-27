import { useEffect, useMemo, useState } from 'react';
import { OrderStatus } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { orderService } from '@/services/orderService';
import { ApiError } from '@/services/api';

type Address = {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
};

type Buyer = {
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  address?: Address;
};

type OrderItem = {
  product: { name: string; price: number };
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
};

type UiOrder = {
  id: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  buyer: Buyer;
  items: OrderItem[];
  paymentId?: string | null;
};

const statusColors: Record<OrderStatus, string> = {
  Pendente: 'bg-yellow-100 text-yellow-800',
  Entregue: 'bg-green-100 text-green-800',
  Cancelado: 'bg-red-100 text-red-800',
  Finalizado: 'bg-blue-100 text-blue-800',
};

function safeString(v: any) {
  return String(v ?? '').trim();
}

function safeNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function tryJson<T>(v: any, fallback: T): T {
  try {
    if (v == null) return fallback;
    if (typeof v === 'object') return v as T;
    if (typeof v === 'string') return (JSON.parse(v) as T) ?? fallback;
    return fallback;
  } catch {
    return fallback;
  }
}

// Backend -> PT-BR
function toPtStatus(s: any): OrderStatus {
  const x = safeString(s).toLowerCase();
  if (x === 'pending' || x === 'pendente') return 'Pendente';
  if (x === 'delivered' || x === 'entregue') return 'Entregue';
  if (x === 'canceled' || x === 'cancelled' || x === 'cancelado') return 'Cancelado';
  if (x === 'finished' || x === 'finalizado' || x === 'paid' || x === 'approved') return 'Finalizado';
  // se vier algo diferente, cai como Pendente pra não quebrar UI
  return 'Pendente';
}

// PT-BR -> Backend
function toApiStatus(s: OrderStatus): string {
  if (s === 'Pendente') return 'pending';
  if (s === 'Entregue') return 'delivered';
  if (s === 'Cancelado') return 'canceled';
  return 'finished';
}

function normalizeOrderFromApi(o: any): UiOrder {
  const id = safeString(o?.id || o?.orderId || o?.code || o?._id);

  // total pode vir como total, total_amount, totalAmount
  const total = safeNumber(o?.total ?? o?.total_amount ?? o?.totalAmount);

  // createdAt pode vir como created_at, createdAt
  const createdAt = safeString(o?.createdAt ?? o?.created_at ?? o?.date ?? new Date().toISOString());

  // buyer/customer pode vir como buyer ou customer (objeto ou JSON string)
  const customerObj = tryJson<any>(o?.buyer ?? o?.customer, {});
  const buyer: Buyer = {
    name: safeString(customerObj?.name ?? o?.customer_name ?? o?.buyer?.name) || 'Cliente',
    email: safeString(customerObj?.email ?? o?.customer_email ?? o?.buyer?.email) || '-',
    cpf: safeString(customerObj?.cpf ?? o?.buyer?.cpf),
    phone: safeString(customerObj?.phone ?? o?.buyer?.phone),
    address: tryJson<Address>(customerObj?.address ?? o?.buyer?.address, {}),
  };

  // items pode vir como items (array) ou items JSON string
  const itemsRaw = tryJson<any[]>(o?.items, []);
  const items: OrderItem[] = Array.isArray(itemsRaw)
    ? itemsRaw.map((it: any) => ({
        product: {
          name: safeString(it?.product?.name ?? it?.title ?? it?.name) || 'Produto',
          price: safeNumber(it?.product?.price ?? it?.unit_price ?? it?.price),
        },
        quantity: Math.max(1, Number(it?.quantity ?? 1)),
        selectedSize: safeString(it?.selectedSize ?? it?.size),
        selectedColor: safeString(it?.selectedColor ?? it?.color),
      }))
    : [];

  const status = toPtStatus(o?.status);

  return {
    id: id || 'PED-000',
    status,
    total,
    createdAt,
    buyer,
    items,
    paymentId: o?.payment_id ?? o?.paymentId ?? null,
  };
}

function unwrapArray(x: any): any[] {
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.items)) return x.items;
  if (Array.isArray(x?.data)) return x.data;
  return [];
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getAll();
      const arr = unwrapArray(res);
      setOrders(arr.map(normalizeOrderFromApi));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao carregar pedidos';
      toast({ title: message, variant: 'destructive' });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const id = safeString(orderId);
    if (!id) return;

    // otimista (atualiza UI antes)
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)));

    try {
      // envia pro backend em inglês (mais comum no schema)
      await orderService.updateStatus(id, toApiStatus(status));
      toast({ title: `Pedido ${id} atualizado para ${status}` });
    } catch (err) {
      // rollback se falhar
      await loadOrders();
      const message = err instanceof ApiError ? err.message : 'Erro ao atualizar status';
      toast({ title: message, variant: 'destructive' });
    }
  };

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (filterStatus && o.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (o.buyer.name || '').toLowerCase().includes(q) ||
          (o.buyer.email || '').toLowerCase().includes(q) ||
          (o.buyer.cpf || '').includes(q) ||
          (o.id || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, filterStatus, search]);

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold text-foreground">Pedidos</h2>
        <Button variant="outline" onClick={() => void loadOrders()} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Atualizar
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, email ou CPF..."
          className="max-w-xs"
        />
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <span className="text-sm text-muted-foreground">{filterStatus || 'Filtrar status'}</span>
          </SelectTrigger>
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                  </span>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhum pedido encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.id}</TableCell>
                  <TableCell>{o.buyer.name}</TableCell>
                  <TableCell>R$ {Number(o.total || 0).toFixed(2).replace('.', ',')}</TableCell>

                  <TableCell>
                    <Select value={o.status} onValueChange={v => void updateStatus(o.id, v as OrderStatus)}>
                      <SelectTrigger className="w-36 h-8">
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

                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>

                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="font-display">Pedido {o.id}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 text-sm">
                          <div>
                            <h4 className="font-semibold text-foreground">Comprador</h4>
                            <p>
                              {o.buyer.name} · {o.buyer.email}
                            </p>
                            <p>
                              CPF: {o.buyer.cpf || '-'} · Tel: {o.buyer.phone || '-'}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-semibold text-foreground">Endereço</h4>
                            <p>
                              {o.buyer.address?.street || '-'}, {o.buyer.address?.number || '-'}{' '}
                              {o.buyer.address?.complement || ''}
                            </p>
                            <p>
                              {o.buyer.address?.neighborhood || '-'} - {o.buyer.address?.city || '-'}/
                              {o.buyer.address?.state || '-'}
                            </p>
                            <p>CEP: {o.buyer.address?.cep || '-'}</p>
                          </div>

                          <div>
                            <h4 className="font-semibold text-foreground">Itens</h4>
                            {(o.items || []).length === 0 ? (
                              <p className="text-muted-foreground">Sem itens salvos.</p>
                            ) : (
                              <>
                                {o.items.map((item, i) => (
                                  <div key={i} className="flex justify-between border-b border-border py-2">
                                    <span>
                                      {item.product.name}
                                      {item.selectedSize || item.selectedColor
                                        ? ` (${item.selectedSize || '-'}/${item.selectedColor || '-'})`
                                        : ''}{' '}
                                      x{item.quantity}
                                    </span>
                                    <span>
                                      R$ {(Number(item.product.price || 0) * Number(item.quantity || 1))
                                        .toFixed(2)
                                        .replace('.', ',')}
                                    </span>
                                  </div>
                                ))}
                                <div className="flex justify-between pt-2 font-bold">
                                  <span>Total</span>
                                  <span>R$ {Number(o.total || 0).toFixed(2).replace('.', ',')}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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

export default AdminOrders;
