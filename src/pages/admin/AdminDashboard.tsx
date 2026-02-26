import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { authService } from '@/services/authService';
import AdminRevenue from './AdminRevenue';
import AdminProducts from './AdminProducts';
import AdminCategories from './AdminCategories';
import AdminOrders from './AdminOrders';

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('admin_auth') !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold">DO CARMO <span className="text-accent">MODAS</span></Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Painel Admin</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Sair</Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <Tabs defaultValue="revenue">
          <TabsList className="w-full justify-start bg-card">
            <TabsTrigger value="revenue">Faturamento</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue"><AdminRevenue /></TabsContent>
          <TabsContent value="products"><AdminProducts /></TabsContent>
          <TabsContent value="categories"><AdminCategories /></TabsContent>
          <TabsContent value="orders"><AdminOrders /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
