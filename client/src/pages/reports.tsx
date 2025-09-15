import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Mail, Filter } from "lucide-react";

export default function Reports() {
  const [reportType, setReportType] = useState<string>("daily");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: attendanceData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/reports/attendance", { 
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate, 
      className: selectedClass 
    }],
  });

  const { data: classes } = useQuery<any[]>({
    queryKey: ["/api/classes"],
  });

  const handleGenerateReport = () => {
    console.log("Generating report with:", {
      reportType,
      selectedClass,
      startDate,
      endDate
    });
  };

  const handleExportPDF = () => {
    console.log("Exporting PDF report");
    // TODO: Implement PDF export functionality
  };

  const handleExportExcel = () => {
    console.log("Exporting Excel report");
    // TODO: Implement Excel export functionality
  };

  const handleSendSMS = () => {
    console.log("Sending SMS summary");
    // TODO: Implement SMS sending functionality
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
                <h1 className="text-3xl font-bold text-foreground">Attendance Reports</h1>
                <p className="text-muted-foreground mt-1">Generate and export detailed attendance reports</p>
              </div>
            </div>

            {/* Report Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Report Type</label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger data-testid="select-report-type">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily Report</SelectItem>
                        <SelectItem value="weekly">Weekly Report</SelectItem>
                        <SelectItem value="monthly">Monthly Report</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Class</label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger data-testid="select-class">
                        <SelectValue placeholder="All Classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Classes</SelectItem>
                        {classes?.map((cls: any) => (
                          <SelectItem key={cls.id} value={cls.name}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">From Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      data-testid="input-start-date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">To Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      data-testid="input-end-date"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleGenerateReport}
                      className="w-full"
                      data-testid="button-generate-report"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">PDF Report</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    Download formatted PDF reports for printing and sharing
                  </p>
                  <Button 
                    onClick={handleExportPDF}
                    className="w-full bg-red-600 hover:bg-red-700"
                    data-testid="button-export-pdf"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Excel Export</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    Export data to Excel spreadsheet for analysis and calculations
                  </p>
                  <Button 
                    onClick={handleExportExcel}
                    className="w-full bg-green-600 hover:bg-green-700"
                    data-testid="button-export-excel"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">SMS Summary</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    Send attendance summary via SMS to parents/guardians
                  </p>
                  <Button 
                    onClick={handleSendSMS}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    data-testid="button-send-sms"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send SMS
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Report Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Daily Attendance Report - {new Date().toLocaleDateString()}
                  </CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>Total: 342</span>
                    <span>•</span>
                    <span>Present: 289</span>
                    <span>•</span>
                    <span>Rate: 84.5%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded"></div>
                    ))}
                  </div>
                ) : attendanceData && attendanceData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Class
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Method
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {attendanceData.map((record: any, index: number) => (
                          <tr key={index} className="hover:bg-muted/30">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                              {record.class}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                              Student #{record.studentId.slice(-4)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                record.status === 'present' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {record.method}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {new Date(record.markedAt).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No attendance data</h3>
                    <p className="text-muted-foreground">
                      No attendance records found for the selected criteria
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
