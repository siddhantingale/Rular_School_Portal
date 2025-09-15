import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("teacher"), // admin, teacher
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rollNumber: text("roll_number").notNull().unique(),
  fullName: text("full_name").notNull(),
  class: text("class").notNull(),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  parentName: text("parent_name"),
  parentPhone: text("parent_phone"),
  rfidCardId: text("rfid_card_id"),
  photoUrl: text("photo_url"),
  faceEncoding: text("face_encoding"), // JSON string of face encoding
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  teacherId: varchar("teacher_id").notNull(),
  class: text("class").notNull(),
  subject: text("subject"),
  date: text("date").notNull(), // YYYY-MM-DD format
  period: text("period"),
  status: text("status").notNull(), // present, absent
  method: text("method").notNull(), // manual, facial, rfid
  markedAt: timestamp("marked_at").defaultNow().notNull(),
});

export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  teacherId: varchar("teacher_id"),
  studentCount: integer("student_count").default(0),
  isActive: boolean("is_active").notNull().default(true),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
  fullName: true,
  phone: true,
});

export const insertStudentSchema = createInsertSchema(students).pick({
  rollNumber: true,
  fullName: true,
  class: true,
  dateOfBirth: true,
  gender: true,
  parentName: true,
  parentPhone: true,
  rfidCardId: true,
  photoUrl: true,
  faceEncoding: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).pick({
  studentId: true,
  teacherId: true,
  class: true,
  subject: true,
  date: true,
  period: true,
  status: true,
  method: true,
});

export const insertClassSchema = createInsertSchema(classes).pick({
  name: true,
  teacherId: true,
  studentCount: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
