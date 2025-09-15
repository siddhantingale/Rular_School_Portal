import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AttendanceData {
  date: string;
  present: number;
  absent: number;
  total: number;
}

interface AttendanceChartProps {
  data: AttendanceData[];
  title?: string;
  className?: string;
}

export function AttendanceChart({ data, title = "Attendance Trends", className }: AttendanceChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      percentage: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0,
    }));
  }, [data]);

  const averageAttendance = useMemo(() => {
    if (chartData.length === 0) return 0;
    const total = chartData.reduce((sum, item) => sum + item.percentage, 0);
    return Math.round(total / chartData.length);
  }, [chartData]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return 'stable';
    const recent = chartData.slice(-3);
    const older = chartData.slice(-6, -3);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, item) => sum + item.percentage, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.percentage, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 2) return 'up';
    if (difference < -2) return 'down';
    return 'stable';
  }, [chartData]);

  const maxValue = Math.max(...chartData.map(item => item.total));

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center space-x-2">
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
            {trend === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
            <span className="text-sm font-medium">{averageAttendance}% avg</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {chartData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No attendance data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Simple Bar Chart */}
            <div className="grid grid-cols-1 gap-3">
              {chartData.slice(-7).map((item, index) => (
                <div key={item.date} className="flex items-center space-x-3">
                  <div className="w-16 text-xs text-muted-foreground">
                    {new Date(item.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  
                  <div className="flex-1 relative">
                    <div className="w-full bg-muted rounded-full h-6">
                      <div
                        className="bg-primary rounded-full h-6 flex items-center justify-end pr-2 transition-all duration-300"
                        style={{
                          width: `${(item.present / maxValue) * 100}%`,
                          minWidth: item.present > 0 ? '20px' : '0',
                        }}
                      >
                        {item.present > 0 && (
                          <span className="text-xs text-primary-foreground font-medium">
                            {item.present}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {item.absent > 0 && (
                      <div
                        className="bg-red-200 rounded-full h-6 flex items-center justify-end pr-2 mt-1"
                        style={{
                          width: `${(item.absent / maxValue) * 100}%`,
                          minWidth: '20px',
                        }}
                      >
                        <span className="text-xs text-red-700 font-medium">
                          {item.absent}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-12 text-right">
                    <span className={`text-sm font-medium ${
                      item.percentage >= 80 
                        ? 'text-green-600' 
                        : item.percentage >= 60 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                    }`}>
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center space-x-6 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-xs text-muted-foreground">Present</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-200 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Absent</span>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Best Day</p>
                <p className="text-lg font-semibold text-green-600">
                  {Math.max(...chartData.map(item => item.percentage))}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Average</p>
                <p className="text-lg font-semibold text-foreground">
                  {averageAttendance}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Trend</p>
                <p className={`text-lg font-semibold ${
                  trend === 'up' 
                    ? 'text-green-600' 
                    : trend === 'down' 
                    ? 'text-red-600' 
                    : 'text-muted-foreground'
                }`}>
                  {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
