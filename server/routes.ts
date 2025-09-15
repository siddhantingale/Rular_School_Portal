import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertStudentSchema, insertAttendanceSchema, insertClassSchema } from "@shared/schema";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Student routes
  app.get("/api/students", async (req, res) => {
    try {
      const { class: className, search } = req.query;
      let students = await storage.getAllStudents();
      
      if (className) {
        students = students.filter(s => s.class === className);
      }
      
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        students = students.filter(s => 
          s.fullName.toLowerCase().includes(searchTerm) ||
          s.rollNumber.toLowerCase().includes(searchTerm)
        );
      }
      
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", upload.single('photo'), async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      
      // Check if roll number already exists
      const existingStudent = await storage.getStudentByRollNumber(validatedData.rollNumber);
      if (existingStudent) {
        return res.status(400).json({ message: "Student with this roll number already exists" });
      }
      
      // Handle photo upload
      if (req.file) {
        validatedData.photoUrl = `/uploads/${req.file.filename}`;
      }
      
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      res.status(400).json({ message: "Failed to create student", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/students/:id", upload.single('photo'), async (req, res) => {
    try {
      const updates = req.body;
      
      if (req.file) {
        updates.photoUrl = `/uploads/${req.file.filename}`;
      }
      
      const student = await storage.updateStudent(req.params.id, updates);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(400).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const success = await storage.deleteStudent(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Attendance routes
  app.get("/api/attendance", async (req, res) => {
    try {
      const { date, class: className, studentId } = req.query;
      
      if (date) {
        const attendance = await storage.getAttendanceByDate(date as string);
        return res.json(attendance);
      }
      
      if (className && date) {
        const attendance = await storage.getAttendanceByClass(className as string, date as string);
        return res.json(attendance);
      }
      
      if (studentId) {
        const attendance = await storage.getAttendanceByStudent(studentId as string);
        return res.json(attendance);
      }
      
      res.status(400).json({ message: "Please provide date, class and date, or studentId parameter" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance/mark", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const attendanceData = Array.isArray(req.body) ? req.body : [req.body];
      const results = [];
      
      for (const data of attendanceData) {
        const validatedData = insertAttendanceSchema.parse({
          ...data,
          teacherId: req.user!.id,
          date: data.date || new Date().toISOString().split('T')[0],
        });
        
        const attendance = await storage.createAttendance(validatedData);
        results.push(attendance);
      }
      
      res.status(201).json(results);
    } catch (error) {
      res.status(400).json({ message: "Failed to mark attendance", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/attendance/stats", async (req, res) => {
    try {
      const { date } = req.query;
      const stats = await storage.getAttendanceStats(date as string);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance statistics" });
    }
  });

  // Classes routes
  app.get("/api/classes", async (req, res) => {
    try {
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post("/api/classes", async (req, res) => {
    try {
      const validatedData = insertClassSchema.parse(req.body);
      const classData = await storage.createClass(validatedData);
      res.status(201).json(classData);
    } catch (error) {
      res.status(400).json({ message: "Failed to create class" });
    }
  });

  // Teachers routes (Admin only)
  app.get("/api/teachers", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getAllUsers();
      const teachers = users.filter(user => user.role === 'teacher');
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  // Reports routes
  app.get("/api/reports/attendance", async (req, res) => {
    try {
      const { startDate, endDate, className, format = 'json' } = req.query;
      
      // This would generate various report formats
      // For now, returning basic attendance data
      const attendance = await storage.getAttendanceByDate(startDate as string || new Date().toISOString().split('T')[0]);
      
      if (format === 'json') {
        res.json(attendance);
      } else {
        // TODO: Implement PDF/Excel generation
        res.json({ message: `${format} export not implemented yet`, data: attendance });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // RFID scanning endpoint
  app.post("/api/attendance/rfid", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { rfidId, class: className, subject, period } = req.body;
      
      const student = await storage.getStudentByRfid(rfidId);
      if (!student) {
        return res.status(404).json({ message: "Student not found for this RFID" });
      }
      
      const attendanceData = {
        studentId: student.id,
        teacherId: req.user!.id,
        class: className,
        subject,
        period,
        status: 'present' as const,
        method: 'rfid' as const,
        date: new Date().toISOString().split('T')[0],
      };
      
      const attendance = await storage.createAttendance(attendanceData);
      res.status(201).json({ attendance, student });
    } catch (error) {
      res.status(500).json({ message: "Failed to process RFID scan" });
    }
  });

  // Face recognition endpoint
  app.post("/api/attendance/face", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { faceEncoding, class: className, subject, period } = req.body;
      
      // TODO: Implement face matching logic
      // For now, this is a placeholder
      res.json({ message: "Face recognition not fully implemented", faceEncoding });
    } catch (error) {
      res.status(500).json({ message: "Failed to process face recognition" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
