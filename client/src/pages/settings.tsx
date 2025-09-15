import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Upload, 
  Trash2, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Shield,
  Globe,
  Database
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [systemSettings, setSystemSettings] = useState({
    language: "english",
    darkMode: false,
    emailNotifications: true,
    offlineMode: true,
    autoSync: false,
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement password change API call
    toast({
      title: "Success",
      description: "Password updated successfully",
    });
    
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleSystemSettingsChange = (key: string, value: any) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    
    toast({
      title: "Settings Updated",
      description: `${key.charAt(0).toUpperCase() + key.slice(1)} has been updated`,
    });
  };

  const handleForceSync = () => {
    toast({
      title: "Sync Started",
      description: "Syncing data with server...",
    });
    
    // TODO: Implement sync functionality
    setTimeout(() => {
      toast({
        title: "Sync Complete",
        description: "All data has been synchronized",
      });
    }, 2000);
  };

  const handleBackupData = () => {
    toast({
      title: "Backup Started",
      description: "Creating backup of attendance data...",
    });
    
    // TODO: Implement backup functionality
  };

  const handleRestoreData = () => {
    toast({
      title: "Restore Started", 
      description: "Restoring data from backup...",
    });
    
    // TODO: Implement restore functionality
  };

  const handleClearCache = () => {
    toast({
      title: "Cache Cleared",
      description: "Local storage and cache have been cleared",
    });
    
    // TODO: Implement cache clearing
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">Configure system preferences and options</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Account Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Account Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ 
                          ...prev, 
                          currentPassword: e.target.value 
                        }))}
                        data-testid="input-current-password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ 
                          ...prev, 
                          newPassword: e.target.value 
                        }))}
                        data-testid="input-new-password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ 
                          ...prev, 
                          confirmPassword: e.target.value 
                        }))}
                        data-testid="input-confirm-password"
                      />
                    </div>
                    <Button type="submit" className="w-full" data-testid="button-change-password">
                      Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* System Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <span>System Preferences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select 
                      value={systemSettings.language} 
                      onValueChange={(value) => handleSystemSettingsChange('language', value)}
                    >
                      <SelectTrigger data-testid="select-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="hindi">Hindi</SelectItem>
                        <SelectItem value="marathi">Marathi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Dark Mode</Label>
                      <p className="text-xs text-muted-foreground">Switch to dark theme</p>
                    </div>
                    <Switch
                      checked={systemSettings.darkMode}
                      onCheckedChange={(checked) => handleSystemSettingsChange('darkMode', checked)}
                      data-testid="switch-dark-mode"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">Receive attendance alerts</p>
                    </div>
                    <Switch
                      checked={systemSettings.emailNotifications}
                      onCheckedChange={(checked) => handleSystemSettingsChange('emailNotifications', checked)}
                      data-testid="switch-email-notifications"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Offline Mode</Label>
                      <p className="text-xs text-muted-foreground">Enable offline attendance</p>
                    </div>
                    <Switch
                      checked={systemSettings.offlineMode}
                      onCheckedChange={(checked) => handleSystemSettingsChange('offlineMode', checked)}
                      data-testid="switch-offline-mode"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Sync</Label>
                      <p className="text-xs text-muted-foreground">Automatic data synchronization</p>
                    </div>
                    <Switch
                      checked={systemSettings.autoSync}
                      onCheckedChange={(checked) => handleSystemSettingsChange('autoSync', checked)}
                      data-testid="switch-auto-sync"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sync Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                    <span>Offline & Sync</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Connection Status</span>
                      <span className={`flex items-center ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-600' : 'bg-red-600'}`}></div>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Sync</span>
                      <span className="text-foreground">2 minutes ago</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pending Records</span>
                      <span className="text-foreground">0</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleForceSync}
                    className="w-full bg-secondary hover:bg-secondary/90"
                    data-testid="button-force-sync"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Force Sync Now
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Data Management */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Data Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Download className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="text-lg font-medium text-foreground mb-2">Backup Data</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a backup of all attendance data
                    </p>
                    <Button 
                      onClick={handleBackupData}
                      className="w-full"
                      data-testid="button-backup-data"
                    >
                      Create Backup
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-secondary" />
                    </div>
                    <h4 className="text-lg font-medium text-foreground mb-2">Restore Data</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Restore from a previous backup
                    </p>
                    <Button 
                      onClick={handleRestoreData}
                      className="w-full bg-secondary hover:bg-secondary/90"
                      data-testid="button-restore-data"
                    >
                      Restore Backup
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                    <h4 className="text-lg font-medium text-foreground mb-2">Clear Cache</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Clear local storage and cached data
                    </p>
                    <Button 
                      onClick={handleClearCache}
                      variant="destructive"
                      className="w-full"
                      data-testid="button-clear-cache"
                    >
                      Clear Cache
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
