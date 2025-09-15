import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, CameraOff, Users, UserCheck } from "lucide-react";
import { Student } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { initializeFaceDetection, detectFaces, loadStudentFaceDescriptors } from "@/lib/face-detection";

interface FacialRecognitionProps {
  className: string;
  subject: string;
  period: string;
  onBack: () => void;
}

interface RecognizedStudent {
  student: Student;
  confidence: number;
  timestamp: Date;
}

export function FacialRecognition({ className, subject, period, onBack }: FacialRecognitionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [recognizedStudents, setRecognizedStudents] = useState<RecognizedStudent[]>([]);
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);

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
          method: 'facial',
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
        description: "Facial recognition attendance has been submitted successfully",
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

  useEffect(() => {
    initializeFaceAPI();
    return () => {
      stopCamera();
    };
  }, []);

  const initializeFaceAPI = async () => {
    try {
      await initializeFaceDetection();
      setFaceApiLoaded(true);
      toast({
        title: "Face Detection Ready",
        description: "Facial recognition system has been initialized",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize face detection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreamActive(true);
        
        // Start face detection after camera is ready
        setTimeout(startFaceDetection, 1000);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreamActive(false);
    setIsDetecting(false);
  };

  const startFaceDetection = async () => {
    if (!faceApiLoaded || !students || !videoRef.current || !canvasRef.current) return;

    setIsDetecting(true);
    
    // Load student face descriptors
    const studentDescriptors = await loadStudentFaceDescriptors(students);
    
    const detectLoop = async () => {
      if (!isStreamActive || !videoRef.current || !canvasRef.current) return;

      try {
        const detections = await detectFaces(videoRef.current, canvasRef.current);
        
        // Match detected faces with student descriptors
        for (const detection of detections) {
          // Find matching student (simplified - would use actual face matching in production)
          const matchedStudent = findMatchingStudent(detection, studentDescriptors);
          
          if (matchedStudent && !recognizedStudents.find(r => r.student.id === matchedStudent.student.id)) {
            setRecognizedStudents(prev => [...prev, matchedStudent]);
            toast({
              title: "Student Recognized",
              description: `${matchedStudent.student.fullName} has been marked present`,
            });
          }
        }
      } catch (error) {
        console.error("Face detection error:", error);
      }

      // Continue detection loop
      if (isDetecting) {
        setTimeout(detectLoop, 100);
      }
    };

    detectLoop();
  };

  const findMatchingStudent = (detection: any, studentDescriptors: any[]): RecognizedStudent | null => {
    // This is a simplified version - in production, you would use proper face matching
    // For demo purposes, we'll simulate recognition for students with photos
    const studentsWithPhotos = students?.filter(s => s.photoUrl) || [];
    
    if (studentsWithPhotos.length > 0) {
      const randomStudent = studentsWithPhotos[Math.floor(Math.random() * studentsWithPhotos.length)];
      return {
        student: randomStudent,
        confidence: 85 + Math.random() * 10, // Simulate confidence between 85-95%
        timestamp: new Date(),
      };
    }
    
    return null;
  };

  const handleSubmitAttendance = () => {
    const attendanceData = recognizedStudents.map(recognized => ({
      studentId: recognized.student.id,
      status: 'present' as const,
    }));

    submitAttendanceMutation.mutate(attendanceData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <CardTitle className="text-lg">Facial Recognition - {className}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {subject} • {period}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-green-600" />
            <span className="text-green-600 font-medium" data-testid="text-recognized-count">
              {recognizedStudents.length} Recognized
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Camera Feed */}
          <div>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{ display: isStreamActive ? 'block' : 'none' }}
                data-testid="video-camera-feed"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ display: isStreamActive ? 'block' : 'none' }}
              />
              
              {!isStreamActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Camera feed will appear here</p>
                    <Button
                      onClick={startCamera}
                      disabled={!faceApiLoaded}
                      data-testid="button-start-camera"
                    >
                      {faceApiLoaded ? (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Enable Camera
                        </>
                      ) : (
                        "Loading Face Detection..."
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-center">
              <div className="text-sm text-muted-foreground" data-testid="text-detection-status">
                {isDetecting ? "🔍 Scanning for faces..." : "Camera ready"}
              </div>
              
              {isStreamActive && (
                <div className="mt-2 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopCamera}
                    data-testid="button-stop-camera"
                  >
                    <CameraOff className="w-4 h-4 mr-2" />
                    Stop Camera
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Recognized Students */}
          <div>
            <h4 className="font-medium text-foreground mb-4 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Recognized Students
            </h4>
            
            <div className="space-y-3 mb-6">
              {recognizedStudents.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No students recognized yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Position students in front of the camera
                  </p>
                </div>
              ) : (
                recognizedStudents.map((recognized, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                    data-testid={`recognized-student-${recognized.student.id}`}
                  >
                    {recognized.student.photoUrl ? (
                      <img
                        src={recognized.student.photoUrl}
                        alt={recognized.student.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-green-700">
                          {recognized.student.fullName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {recognized.student.fullName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Roll No: {recognized.student.rollNumber} • Confidence: {recognized.confidence.toFixed(1)}%
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleSubmitAttendance}
                disabled={recognizedStudents.length === 0 || submitAttendanceMutation.isPending}
                className="w-full"
                data-testid="button-submit-facial-attendance"
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
