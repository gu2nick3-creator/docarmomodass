import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';
import { Loader2 } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.login(email, password);
      navigate('/admin');
    } catch {
      // Fallback: mock login para dev local
      if (email === 'admin@docarmomodas.com' && password === 'admin123') {
        localStorage.setItem('admin_auth', 'true');
        navigate('/admin');
      } else {
        toast({ title: 'Credenciais inválidas', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary">
      <div className="w-full max-w-md rounded-sm border border-border bg-card p-8">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">DO CARMO <span className="text-accent">MODAS</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Painel Administrativo</p>
        </div>
        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@docarmomodas.com" /></div>
          <div><Label>Senha</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></div>
          <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-gold-dark">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
