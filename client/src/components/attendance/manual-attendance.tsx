import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Users, UserCheck, UserX } from "lucide-react";
import { Student } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

interface ManualAttendanceProps {
  className: string;
  subject: string;
  period: string;
  onBack: () => void;
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent';
}

export function ManualAttendance({ className, subject, period, onBack }: ManualAttendanceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students", { class: className }],
    enabled: !!className,
  });

  const submitAttendanceMutation = useMutation({
    mutationFn: async (attendanceData: AttendanceRecord[]) => {
      const response = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(attendanceData.map(record => ({
          ...record,
          class: className,
          subject,
          period,
          method: 'manual',
          date: new Date().toISOString().split('T')[0],
        }))),
      });

      if (!response.ok) {
        throw new Error("Failed to submit attendance");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance has been submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      onBack();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit attendance",
        variant: "destructive",
      });
    },
  });

  const filteredStudents = students?.filter(student =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmit = () => {
    if (!students) return;

    const attendanceRecords: AttendanceRecord[] = students.map(student => ({
      studentId: student.id,
      status: attendance[student.id] || 'absent',
    }));

    submitAttendanceMutation.mutate(attendanceRecords);
  };

  const presentCount = Object.values(attendance).filter(status => status === 'present').length;
  const totalStudents = students?.length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <CardTitle className="text-lg">Manual Attendance - {className}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {subject} • {period}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-medium" data-testid="text-present-count">
                {presentCount} Present
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <UserX className="w-4 h-4 text-red-600" />
              <span className="text-red-600 font-medium">
                {totalStudents - presentCount} Absent
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium" data-testid="text-total-students">
                {totalStudents} Total
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search students by name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-students"
          />
        </div>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No students found</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? "Try adjusting your search term" 
                : `No students found in ${className}`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                data-testid={`student-row-${student.id}`}
              >
                <div className="flex items-center space-x-4">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={`${student.fullName} photo`}
                      className="w-12 h-12 rounded-full object-cover"
                      data-testid={`img-student-${student.id}`}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        {student.fullName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground" data-testid={`text-student-name-${student.id}`}>
                      {student.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Roll No: {student.rollNumber}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={attendance[student.id] === 'present'}
                      onCheckedChange={(checked) => 
                        handleAttendanceChange(student.id, checked ? 'present' : 'absent')
                      }
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      data-testid={`checkbox-present-${student.id}`}
                    />
                    <span className="text-sm font-medium text-green-600">Present</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={attendance[student.id] === 'absent'}
                      onCheckedChange={(checked) => 
                        handleAttendanceChange(student.id, checked ? 'absent' : 'present')
                      }
                      className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                      data-testid={`checkbox-absent-${student.id}`}
                    />
                    <span className="text-sm font-medium text-red-600">Absent</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSubmit}
            disabled={submitAttendanceMutation.isPending || totalStudents === 0}
            className="flex-1"
            data-testid="button-submit-attendance"
          >
            {submitAttendanceMutation.isPending ? "Submitting..." : "Submit Attendance"}
          </Button>
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1"
            data-testid="button-cancel"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
