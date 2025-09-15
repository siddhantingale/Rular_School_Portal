import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ManualAttendance } from "@/components/attendance/manual-attendance";
import { FacialRecognition } from "@/components/attendance/facial-recognition";
import { RfidScanner } from "@/components/attendance/rfid-scanner";
import { CheckSquare, Camera, CreditCard } from "lucide-react";

export default function Attendance() {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [attendanceMethod, setAttendanceMethod] = useState<string>("");

  const classes = ["Class 1-A", "Class 1-B", "Class 2-A", "Class 2-B"];
  const subjects = ["Mathematics", "Science", "English", "Hindi", "Social Studies"];
  const periods = ["1st Period", "2nd Period", "3rd Period", "4th Period", "5th Period"];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Mark Attendance</h1>
                <p className="text-muted-foreground mt-1">Select class and attendance method</p>
              </div>
            </div>

            {/* Class Selection */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Class</label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger data-testid="select-class">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(className => (
                          <SelectItem key={className} value={className}>
                            {className}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger data-testid="select-subject">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(subject => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Period</label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger data-testid="select-period">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.map(period => (
                          <SelectItem key={period} value={period}>
                            {period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Methods */}
            {!attendanceMethod ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setAttendanceMethod('manual')}
                  data-testid="card-manual-attendance"
                >
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckSquare className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Manual Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Mark attendance manually using checkboxes for each student
                    </p>
                    <div className="flex justify-center">
                      <div className="bg-primary text-primary-foreground py-2 px-4 rounded-md text-sm">
                        Start Manual Marking
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setAttendanceMethod('facial')}
                  data-testid="card-facial-recognition"
                >
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-secondary" />
                    </div>
                    <CardTitle className="text-lg">Facial Recognition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Use camera to identify and mark students automatically
                    </p>
                    <div className="flex justify-center">
                      <div className="bg-secondary text-secondary-foreground py-2 px-4 rounded-md text-sm">
                        Start Camera
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setAttendanceMethod('rfid')}
                  data-testid="card-rfid-scanner"
                >
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-lg">RFID Scanner</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Scan student RFID cards for instant attendance marking
                    </p>
                    <div className="flex justify-center">
                      <div className="bg-accent text-accent-foreground py-2 px-4 rounded-md text-sm">
                        Start Scanner
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                {attendanceMethod === 'manual' && (
                  <ManualAttendance 
                    className={selectedClass}
                    subject={selectedSubject}
                    period={selectedPeriod}
                    onBack={() => setAttendanceMethod('')}
                  />
                )}
                
                {attendanceMethod === 'facial' && (
                  <FacialRecognition 
                    className={selectedClass}
                    subject={selectedSubject}
                    period={selectedPeriod}
                    onBack={() => setAttendanceMethod('')}
                  />
                )}
                
                {attendanceMethod === 'rfid' && (
                  <RfidScanner 
                    className={selectedClass}
                    subject={selectedSubject}
                    period={selectedPeriod}
                    onBack={() => setAttendanceMethod('')}
                  />
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
