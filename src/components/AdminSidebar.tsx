import { 
  Shield, 
  FileText, 
  Users, 
  BarChart3, 
  MessageSquare,
  Settings,
  LogOut,
  Trophy
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const sidebarItems = [
  { icon: BarChart3, label: 'Dashboard', path: '/admin-dashboard' },
  { icon: FileText, label: 'Tests', path: '/admin/tests' },
  { icon: Users, label: 'Students', path: '/admin/students' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: Trophy, label: 'Results', path: '/admin/results' },
  { icon: MessageSquare, label: 'Messages', path: '/admin/messages' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/admin-dashboard') {
      return location.pathname === '/admin-dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col shadow-lg">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <span className="font-display font-bold text-foreground block">GRIZZLY</span>
            <span className="text-xs text-muted-foreground">Admin Portal</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {sidebarItems.map((item, index) => (
            <li key={index}>
              <button 
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-sm font-medium text-secondary-foreground">
              {profile?.name?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{profile?.name || 'Admin'}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}