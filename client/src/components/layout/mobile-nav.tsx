import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu,
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  FileText, 
  UserCheck, 
  Settings, 
  LogOut,
  Wifi,
  WifiOff
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Mark Attendance", href: "/attendance", icon: CheckSquare },
  { name: "Students", href: "/students", icon: Users },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Teachers", href: "/teachers", icon: UserCheck, adminOnly: true },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline] = useState(navigator.onLine);

  const handleNavigation = (href: string) => {
    setLocation(href);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };

  return (
    <div className="lg:hidden bg-card border-b border-border">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="button-mobile-menu">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Rural Schools</div>
                    <div className="text-xs text-muted-foreground">Attendance System</div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              {/* User Info */}
              <div className="py-6">
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-secondary-foreground">
                      {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {user?.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user?.role}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {navigation.map((item) => {
                  // Skip admin-only items for non-admin users
                  if (item.adminOnly && user?.role !== 'admin') return null;

                  const isActive = location === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Button
                      key={item.name}
                      variant={isActive ? "default" : "ghost"}
                      onClick={() => handleNavigation(item.href)}
                      className="w-full justify-start"
                      data-testid={`mobile-nav-${item.name.toLowerCase().replace(' ', '-')}`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span>{item.name}</span>
                    </Button>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="absolute bottom-6 left-6 right-6">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  disabled={logoutMutation.isPending}
                  data-testid="mobile-button-logout"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span>Logout</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
          <h1 className="text-xl font-bold">Attendance System</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
            {isOnline ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
            <span>{isOnline ? "Online" : "Offline"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
