import { type User, type InsertUser, type Student, type InsertStudent, type Attendance, type InsertAttendance, type Class, type InsertClass } from "@shared/schema";
import { randomUUID } from "crypto";
import session, { Store } from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Student methods
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByRollNumber(rollNumber: string): Promise<Student | undefined>;
  getStudentsByClass(className: string): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;
  getAllStudents(): Promise<Student[]>;
  getStudentByRfid(rfidId: string): Promise<Student | undefined>;
  getStudentByUserId(userId: string): Promise<Student | undefined>;

  // Attendance methods
  getAttendance(id: string): Promise<Attendance | undefined>;
  getAttendanceByDate(date: string): Promise<Attendance[]>;
  getAttendanceByStudent(studentId: string, startDate?: string, endDate?: string): Promise<Attendance[]>;
  getAttendanceByClass(className: string, date: string): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, updates: Partial<Attendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: string): Promise<boolean>;
  getAttendanceStats(date?: string): Promise<{
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    attendanceRate: number;
  }>;

  // Class methods
  getClass(id: string): Promise<Class | undefined>;
  getClassByName(name: string): Promise<Class | undefined>;
  getAllClasses(): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: string, updates: Partial<Class>): Promise<Class | undefined>;
  deleteClass(id: string): Promise<boolean>;

  sessionStore: Store;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private students: Map<string, Student>;
  private attendance: Map<string, Attendance>;
  private classes: Map<string, Class>;
  public sessionStore: Store;

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.attendance = new Map();
    this.classes = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize with default data
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    try {
      // Create default admin user
      const adminPassword = await hashPassword("admin123");
      const adminUser: User = {
        id: randomUUID(),
        username: "admin",
        email: "admin@school.edu",
        password: adminPassword,
        role: "admin",
        fullName: "School Administrator",
        phone: "+91 98765 43210",
        isActive: true,
        createdAt: new Date(),
      };
      this.users.set(adminUser.id, adminUser);

      // Create default teacher user
      const teacherPassword = await hashPassword("teacher123");
      const teacherUser: User = {
        id: randomUUID(),
        username: "teacher",
        email: "teacher@school.edu",
        password: teacherPassword,
        role: "teacher",
        fullName: "Priya Sharma",
        phone: "+91 98765 43211",
        isActive: true,
        createdAt: new Date(),
      };
      this.users.set(teacherUser.id, teacherUser);

      // Create default classes
      const defaultClasses = [
        { name: "Class 1-A", teacherId: teacherUser.id, studentCount: 25 },
        { name: "Class 1-B", teacherId: teacherUser.id, studentCount: 28 },
        { name: "Class 2-A", teacherId: teacherUser.id, studentCount: 30 },
        { name: "Class 2-B", teacherId: teacherUser.id, studentCount: 27 },
        { name: "Class 3-A", teacherId: teacherUser.id, studentCount: 32 },
      ];

      for (const classData of defaultClasses) {
        const newClass: Class = {
          id: randomUUID(),
          ...classData,
          isActive: true,
        };
        this.classes.set(newClass.id, newClass);
      }

      // Create sample students
      const sampleStudents = [
        {
          rollNumber: "001",
          fullName: "Raj Patel",
          class: "Class 1-A",
          dateOfBirth: "2010-05-15",
          gender: "Male",
          parentName: "Rajesh Patel",
          parentPhone: "+91 98765 11111",
          rfidCardId: "RF001234",
        },
        {
          rollNumber: "002", 
          fullName: "Priya Singh",
          class: "Class 1-A",
          dateOfBirth: "2010-08-22",
          gender: "Female",
          parentName: "Manoj Singh",
          parentPhone: "+91 98765 22222",
          rfidCardId: "RF001235",
        },
        {
          rollNumber: "003",
          fullName: "Arjun Kumar",
          class: "Class 1-B",
          dateOfBirth: "2010-03-10",
          gender: "Male", 
          parentName: "Suresh Kumar",
          parentPhone: "+91 98765 33333",
          rfidCardId: "RF001236",
        },
        {
          rollNumber: "004",
          fullName: "Anita Sharma",
          class: "Class 1-B",
          dateOfBirth: "2010-12-05",
          gender: "Female",
          parentName: "Rakesh Sharma", 
          parentPhone: "+91 98765 44444",
          rfidCardId: "RF001237",
        },
        {
          rollNumber: "005",
          fullName: "Vikram Yadav",
          class: "Class 2-A",
          dateOfBirth: "2009-09-18",
          gender: "Male",
          parentName: "Ramesh Yadav",
          parentPhone: "+91 98765 55555",
          rfidCardId: "RF001238",
        },
      ];

      for (const studentData of sampleStudents) {
        const student: Student = {
          id: randomUUID(),
          ...studentData,
          photoUrl: null,
          faceEncoding: null,
          userId: null,
          isActive: true,
          createdAt: new Date(),
        };
        this.students.set(student.id, student);
      }

      console.log("Default data initialized successfully");
      console.log("Admin credentials: admin / admin123");
      console.log("Teacher credentials: teacher / teacher123");
    } catch (error) {
      console.error("Failed to initialize default data:", error);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "teacher",
      phone: insertUser.phone ?? null,
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Student methods
  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByRollNumber(rollNumber: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(student => student.rollNumber === rollNumber);
  }

  async getStudentsByClass(className: string): Promise<Student[]> {
    return Array.from(this.students.values()).filter(student => student.class === className && student.isActive);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = {
      ...insertStudent,
      id,
      dateOfBirth: insertStudent.dateOfBirth ?? null,
      gender: insertStudent.gender ?? null,
      parentName: insertStudent.parentName ?? null,
      parentPhone: insertStudent.parentPhone ?? null,
      rfidCardId: insertStudent.rfidCardId ?? null,
      photoUrl: insertStudent.photoUrl ?? null,
      faceEncoding: insertStudent.faceEncoding ?? null,
      userId: insertStudent.userId ?? null,
      isActive: true,
      createdAt: new Date(),
    };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    
    const updatedStudent = { ...student, ...updates };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: string): Promise<boolean> {
    return this.students.delete(id);
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values()).filter(student => student.isActive);
  }

  async getStudentByRfid(rfidId: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(student => student.rfidCardId === rfidId);
  }

  async getStudentByUserId(userId: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(student => student.userId === userId);
  }

  // Attendance methods
  async getAttendance(id: string): Promise<Attendance | undefined> {
    return this.attendance.get(id);
  }

  async getAttendanceByDate(date: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(att => att.date === date);
  }

  async getAttendanceByStudent(studentId: string, startDate?: string, endDate?: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(att => {
      if (att.studentId !== studentId) return false;
      if (startDate && att.date < startDate) return false;
      if (endDate && att.date > endDate) return false;
      return true;
    });
  }

  async getAttendanceByClass(className: string, date: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(att => att.class === className && att.date === date);
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = randomUUID();
    const attendance: Attendance = {
      ...insertAttendance,
      id,
      subject: insertAttendance.subject ?? null,
      period: insertAttendance.period ?? null,
      markedAt: new Date(),
    };
    this.attendance.set(id, attendance);
    return attendance;
  }

  async updateAttendance(id: string, updates: Partial<Attendance>): Promise<Attendance | undefined> {
    const attendance = this.attendance.get(id);
    if (!attendance) return undefined;
    
    const updatedAttendance = { ...attendance, ...updates };
    this.attendance.set(id, updatedAttendance);
    return updatedAttendance;
  }

  async deleteAttendance(id: string): Promise<boolean> {
    return this.attendance.delete(id);
  }

  async getAttendanceStats(date?: string): Promise<{
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    attendanceRate: number;
  }> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const todayAttendance = await this.getAttendanceByDate(targetDate);
    const totalStudents = Array.from(this.students.values()).filter(s => s.isActive).length;
    
    const presentToday = todayAttendance.filter(att => att.status === 'present').length;
    const absentToday = todayAttendance.filter(att => att.status === 'absent').length;
    const attendanceRate = totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0;

    return {
      totalStudents,
      presentToday,
      absentToday,
      attendanceRate,
    };
  }

  // Class methods
  async getClass(id: string): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async getClassByName(name: string): Promise<Class | undefined> {
    return Array.from(this.classes.values()).find(cls => cls.name === name);
  }

  async getAllClasses(): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(cls => cls.isActive);
  }

  async createClass(insertClass: InsertClass): Promise<Class> {
    const id = randomUUID();
    const classData: Class = {
      ...insertClass,
      id,
      teacherId: insertClass.teacherId ?? null,
      studentCount: insertClass.studentCount ?? null,
      isActive: true,
    };
    this.classes.set(id, classData);
    return classData;
  }

  async updateClass(id: string, updates: Partial<Class>): Promise<Class | undefined> {
    const classData = this.classes.get(id);
    if (!classData) return undefined;
    
    const updatedClass = { ...classData, ...updates };
    this.classes.set(id, updatedClass);
    return updatedClass;
  }

  async deleteClass(id: string): Promise<boolean> {
    return this.classes.delete(id);
  }
}

export const storage = new MemStorage();
