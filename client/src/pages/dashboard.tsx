import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Users, CheckCircle, XCircle, TrendingUp, Clock, BookOpen, UserPlus } from "lucide-react";
import { useLocation } from "wouter";

interface AttendanceStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = useQuery<AttendanceStats>({
    queryKey: ["/api/attendance/stats"],
  });

  const { data: recentAttendance } = useQuery<any[]>({
    queryKey: ["/api/attendance", { date: new Date().toISOString().split('T')[0] }],
  });

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
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
                <h1 className="text-3xl font-bold text-foreground" data-testid="text-welcome">
                  Welcome, {user?.fullName}!
                </h1>
                <p className="text-muted-foreground mt-1">
                  Here's what's happening at your school today.
                </p>
              </div>
              <div className="mt-4 lg:mt-0">
                <div className="text-sm text-muted-foreground">
                  Today: <span className="font-medium text-foreground">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                      <p className="text-3xl font-bold text-foreground" data-testid="text-total-students">
                        {stats?.totalStudents || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                      <p className="text-3xl font-bold text-green-600" data-testid="text-present-today">
                        {stats?.presentToday || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Absent Today</p>
                      <p className="text-3xl font-bold text-red-600" data-testid="text-absent-today">
                        {stats?.absentToday || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                      <p className="text-3xl font-bold text-secondary" data-testid="text-attendance-rate">
                        {stats?.attendanceRate || 0}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentAttendance && recentAttendance.length > 0 ? (
                      recentAttendance.slice(0, 5).map((attendance: any, index: number) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-secondary rounded-full"></div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-foreground">
                              Attendance marked for {attendance.class}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(attendance.markedAt).toLocaleTimeString()} • 
                              Method: {attendance.method}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No recent activity</p>
                        <p className="text-sm text-muted-foreground">
                          Start marking attendance to see activity here
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => setLocation('/attendance')}
                      className="flex flex-col items-center p-6 h-auto bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20"
                      variant="ghost"
                      data-testid="button-mark-attendance"
                    >
                      <CheckCircle className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">Mark Attendance</span>
                    </Button>
                    
                    <Button
                      onClick={() => setLocation('/students')}
                      className="flex flex-col items-center p-6 h-auto bg-secondary/5 text-secondary hover:bg-secondary/10 border border-secondary/20"
                      variant="ghost"
                      data-testid="button-add-student"
                    >
                      <UserPlus className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">Add Student</span>
                    </Button>
                    
                    <Button
                      onClick={() => setLocation('/reports')}
                      className="flex flex-col items-center p-6 h-auto bg-accent/50 text-accent-foreground hover:bg-accent/80 border border-accent/20"
                      variant="ghost"
                      data-testid="button-reports"
                    >
                      <BookOpen className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">Generate Report</span>
                    </Button>
                    
                    <Button
                      onClick={() => setLocation('/settings')}
                      className="flex flex-col items-center p-6 h-auto bg-muted/50 text-muted-foreground hover:bg-muted/80 border border-muted/20"
                      variant="ghost"
                      data-testid="button-settings"
                    >
                      <Clock className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">Settings</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
