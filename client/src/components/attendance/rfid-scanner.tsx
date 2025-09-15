import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Users, UserCheck, Scan } from "lucide-react";
import { Student } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

interface RfidScannerProps {
  className: string;
  subject: string;
  period: string;
  onBack: () => void;
}

interface ScannedStudent {
  student: Student;
  timestamp: Date;
  rfidId: string;
}

export function RfidScanner({ className, subject, period, onBack }: RfidScannerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [rfidInput, setRfidInput] = useState("");
  const [scannedStudents, setScannedStudents] = useState<ScannedStudent[]>([]);

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students", { class: className }],
    enabled: !!className,
  });

  const submitAttendanceMutation = useMutation({
    mutationFn: async (attendanceData: { studentId: string; status: 'present' }[]) => {
      const response = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(attendanceData.map(record => ({
          ...record,
          class: className,
          subject,
          period,
          method: 'rfid',
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
        description: "RFID attendance has been submitted successfully",
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

  const handleRfidScan = async (rfidId: string) => {
    if (!rfidId.trim()) return;

    try {
      // First, try to find the student by RFID
      const student = students?.find(s => s.rfidCardId === rfidId.trim());
      
      if (!student) {
        toast({
          title: "Student Not Found",
          description: `No student found with RFID: ${rfidId}`,
          variant: "destructive",
        });
        setRfidInput("");
        return;
      }

      // Check if already scanned
      if (scannedStudents.find(s => s.student.id === student.id)) {
        toast({
          title: "Already Scanned",
          description: `${student.fullName} has already been marked present`,
          variant: "destructive",
        });
        setRfidInput("");
        return;
      }

      // Add to scanned students
      const newScannedStudent: ScannedStudent = {
        student,
        timestamp: new Date(),
        rfidId: rfidId.trim(),
      };

      setScannedStudents(prev => [...prev, newScannedStudent]);
      setRfidInput("");

      toast({
        title: "Student Scanned",
        description: `${student.fullName} has been marked present`,
      });

    } catch (error) {
      toast({
        title: "Scan Error",
        description: "Failed to process RFID scan",
        variant: "destructive",
      });
    }
  };

  const handleManualRfidInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRfidScan(rfidInput);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    toast({
      title: "Scanner Active",
      description: "Ready to scan RFID cards",
    });
  };

  const stopScanning = () => {
    setIsScanning(false);
    toast({
      title: "Scanner Stopped",
      description: "RFID scanning has been stopped",
    });
  };

  const handleSubmitAttendance = () => {
    const attendanceData = scannedStudents.map(scanned => ({
      studentId: scanned.student.id,
      status: 'present' as const,
    }));

    submitAttendanceMutation.mutate(attendanceData);
  };

  const removeScannedStudent = (studentId: string) => {
    setScannedStudents(prev => prev.filter(s => s.student.id !== studentId));
    toast({
      title: "Student Removed",
      description: "Student has been removed from attendance list",
    });
  };

  // Simulate RFID scanning (in real implementation, this would connect to actual RFID hardware)
  useEffect(() => {
    if (isScanning) {
      // Simulate periodic RFID scans for demo purposes
      const interval = setInterval(() => {
        // In real implementation, this would listen to RFID hardware events
        console.log("Listening for RFID scans...");
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isScanning]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <CardTitle className="text-lg">RFID Scanner - {className}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {subject} • {period}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-green-600" />
            <span className="text-green-600 font-medium" data-testid="text-scanned-count">
              {scannedStudents.length} Scanned
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner Interface */}
          <div>
            <div className="text-center mb-8">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${
                isScanning ? 'bg-secondary/20 animate-pulse' : 'bg-muted'
              }`}>
                <CreditCard className={`w-12 h-12 transition-colors ${
                  isScanning ? 'text-secondary animate-pulse' : 'text-muted-foreground'
                }`} />
              </div>
              
              <h3 className="text-lg font-medium text-foreground mb-2">
                {isScanning ? "Scanner Active" : "RFID Card Scanner"}
              </h3>
              <p className="text-muted-foreground">
                {isScanning 
                  ? "Hold student RFID card near scanner" 
                  : "Click start to begin scanning RFID cards"
                }
              </p>
            </div>

            {/* Scanner Controls */}
            <div className="space-y-4">
              {!isScanning ? (
                <Button
                  onClick={startScanning}
                  className="w-full"
                  data-testid="button-start-scanner"
                >
                  <Scan className="w-4 h-4 mr-2" />
                  Start Scanner
                </Button>
              ) : (
                <Button
                  onClick={stopScanning}
                  variant="outline"
                  className="w-full"
                  data-testid="button-stop-scanner"
                >
                  Stop Scanner
                </Button>
              )}

              {/* Manual RFID Input for testing */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Manual RFID Input (for testing)
                </label>
                <Input
                  placeholder="Enter RFID card ID..."
                  value={rfidInput}
                  onChange={(e) => setRfidInput(e.target.value)}
                  onKeyDown={handleManualRfidInput}
                  data-testid="input-manual-rfid"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Press Enter to simulate RFID scan
                </p>
              </div>
            </div>
          </div>

          {/* Scanned Students */}
          <div>
            <h4 className="font-medium text-foreground mb-4 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Scanned Students
            </h4>

            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {scannedStudents.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No cards scanned yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start the scanner and hold RFID cards near the reader
                  </p>
                </div>
              ) : (
                scannedStudents.map((scanned, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
                    data-testid={`scanned-student-${scanned.student.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      {scanned.student.photoUrl ? (
                        <img
                          src={scanned.student.photoUrl}
                          alt={scanned.student.fullName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-green-700">
                            {scanned.student.fullName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">
                          {scanned.student.fullName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Roll No: {scanned.student.rollNumber} • Card: {scanned.rfidId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {scanned.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-green-600 font-medium">Present</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeScannedStudent(scanned.student.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-remove-${scanned.student.id}`}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleSubmitAttendance}
                disabled={scannedStudents.length === 0 || submitAttendanceMutation.isPending}
                className="w-full"
                data-testid="button-submit-rfid-attendance"
              >
                {submitAttendanceMutation.isPending ? "Submitting..." : "Submit Attendance"}
              </Button>
              <Button
                variant="outline"
                onClick={onBack}
                className="w-full"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
