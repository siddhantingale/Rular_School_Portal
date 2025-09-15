import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Eye, Phone, Mail } from "lucide-react";
import { User } from "@shared/schema";

export default function Teachers() {
  const { user } = useAuth();

  const { data: teachers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/teachers"],
    enabled: user?.role === 'admin',
  });

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                Only administrators can access teacher management.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Teachers Management</h1>
                <p className="text-muted-foreground mt-1">Manage teacher accounts and permissions</p>
              </div>
              <Button className="mt-4 lg:mt-0" data-testid="button-add-teacher">
                <Plus className="w-4 h-4 mr-2" />
                Add New Teacher
              </Button>
            </div>

            {/* Teachers Grid */}
            {teachers && teachers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers.map((teacher) => (
                  <Card key={teacher.id} className="overflow-hidden" data-testid={`card-teacher-${teacher.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-lg font-semibold text-primary-foreground">
                            {teacher.fullName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg" data-testid={`text-teacher-name-${teacher.id}`}>
                            {teacher.fullName}
                          </h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {teacher.role}
                          </p>
                          <div className="mt-1">
                            <Badge 
                              variant={teacher.isActive ? "default" : "secondary"}
                              className={teacher.isActive ? "bg-green-100 text-green-800" : ""}
                            >
                              {teacher.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground truncate" data-testid={`text-teacher-email-${teacher.id}`}>
                            {teacher.email}
                          </span>
                        </div>
                        {teacher.phone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{teacher.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-muted-foreground">Username:</span>
                          <span className="font-medium">{teacher.username}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-muted-foreground">Joined:</span>
                          <span className="text-foreground">
                            {new Date(teacher.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="flex-1 text-sm"
                          data-testid={`button-edit-teacher-${teacher.id}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-sm"
                          data-testid={`button-view-teacher-${teacher.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No teachers found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first teacher account
                </p>
                <Button data-testid="button-add-first-teacher">
                  Add First Teacher
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
