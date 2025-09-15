// Offline storage utilities for PWA functionality
// Handles local storage, IndexedDB, and data synchronization

import { useState, useEffect } from "react";

interface OfflineAttendanceRecord {
  id: string;
  studentId: string;
  teacherId: string;
  class: string;
  subject?: string;
  period?: string;
  status: 'present' | 'absent';
  method: 'manual' | 'facial' | 'rfid';
  date: string;
  timestamp: number;
  synced: boolean;
}

interface OfflineStudent {
  id: string;
  rollNumber: string;
  fullName: string;
  class: string;
  photoUrl?: string;
  rfidCardId?: string;
  lastUpdated: number;
}

interface SyncStatus {
  lastSync: number;
  pendingRecords: number;
  isOnline: boolean;
}

class OfflineStorage {
  private dbName = 'AttendanceSystemDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  // Initialize IndexedDB
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create attendance records store
        if (!db.objectStoreNames.contains('attendanceRecords')) {
          const attendanceStore = db.createObjectStore('attendanceRecords', { keyPath: 'id' });
          attendanceStore.createIndex('studentId', 'studentId', { unique: false });
          attendanceStore.createIndex('date', 'date', { unique: false });
          attendanceStore.createIndex('synced', 'synced', { unique: false });
        }

        // Create students cache store
        if (!db.objectStoreNames.contains('studentsCache')) {
          const studentsStore = db.createObjectStore('studentsCache', { keyPath: 'id' });
          studentsStore.createIndex('class', 'class', { unique: false });
          studentsStore.createIndex('rollNumber', 'rollNumber', { unique: true });
        }

        // Create sync metadata store
        if (!db.objectStoreNames.contains('syncMetadata')) {
          db.createObjectStore('syncMetadata', { keyPath: 'key' });
        }
      };
    });
  }

  // Store attendance record offline
  async storeAttendanceRecord(record: Omit<OfflineAttendanceRecord, 'id' | 'timestamp' | 'synced'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const offlineRecord: OfflineAttendanceRecord = {
      ...record,
      id: this.generateId(),
      timestamp: Date.now(),
      synced: false,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['attendanceRecords'], 'readwrite');
      const store = transaction.objectStore('attendanceRecords');
      const request = store.add(offlineRecord);

      request.onsuccess = () => resolve(offlineRecord.id);
      request.onerror = () => reject(request.error);
    });
  }

  // Get pending attendance records to sync
  async getPendingAttendanceRecords(): Promise<OfflineAttendanceRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['attendanceRecords'], 'readonly');
      const store = transaction.objectStore('attendanceRecords');
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Mark attendance record as synced
  async markRecordSynced(recordId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['attendanceRecords'], 'readwrite');
      const store = transaction.objectStore('attendanceRecords');
      const getRequest = store.get(recordId);

      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.synced = true;
          const updateRequest = store.put(record);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Record not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Cache students data for offline access
  async cacheStudents(students: OfflineStudent[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['studentsCache'], 'readwrite');
      const store = transaction.objectStore('studentsCache');

      // Clear existing cache
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        // Add new students
        let completed = 0;
        students.forEach(student => {
          const studentWithTimestamp = { ...student, lastUpdated: Date.now() };
          const addRequest = store.add(studentWithTimestamp);
          addRequest.onsuccess = () => {
            completed++;
            if (completed === students.length) resolve();
          };
          addRequest.onerror = () => reject(addRequest.error);
        });

        if (students.length === 0) resolve();
      };
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  // Get cached students by class
  async getCachedStudentsByClass(className: string): Promise<OfflineStudent[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['studentsCache'], 'readonly');
      const store = transaction.objectStore('studentsCache');
      const index = store.index('class');
      const request = index.getAll(className);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all cached students
  async getAllCachedStudents(): Promise<OfflineStudent[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['studentsCache'], 'readonly');
      const store = transaction.objectStore('studentsCache');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get sync status
  async getSyncStatus(): Promise<SyncStatus> {
    const pendingRecords = await this.getPendingAttendanceRecords();
    const lastSync = this.getLastSyncTime();

    return {
      lastSync,
      pendingRecords: pendingRecords.length,
      isOnline: navigator.onLine,
    };
  }

  // Sync pending records with server
  async syncWithServer(): Promise<{ success: number; failed: number }> {
    const pendingRecords = await this.getPendingAttendanceRecords();
    let success = 0;
    let failed = 0;

    for (const record of pendingRecords) {
      try {
        // Convert offline record to API format
        const apiRecord = {
          studentId: record.studentId,
          class: record.class,
          subject: record.subject,
          period: record.period,
          status: record.status,
          method: record.method,
          date: record.date,
        };

        const response = await fetch('/api/attendance/mark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify([apiRecord]),
        });

        if (response.ok) {
          await this.markRecordSynced(record.id);
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('Sync error for record:', record.id, error);
        failed++;
      }
    }

    if (success > 0) {
      this.setLastSyncTime(Date.now());
    }

    return { success, failed };
  }

  // Local storage helpers
  private getLastSyncTime(): number {
    const lastSync = localStorage.getItem('attendance_last_sync');
    return lastSync ? parseInt(lastSync, 10) : 0;
  }

  private setLastSyncTime(timestamp: number): void {
    localStorage.setItem('attendance_last_sync', timestamp.toString());
  }

  // Generate unique ID for offline records
  private generateId(): string {
    return 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['attendanceRecords', 'studentsCache'], 'readwrite');
      
      let completed = 0;
      const stores = ['attendanceRecords', 'studentsCache'];
      
      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => {
          completed++;
          if (completed === stores.length) {
            localStorage.removeItem('attendance_last_sync');
            resolve();
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    });
  }

  // Check if app is in offline mode
  isOffline(): boolean {
    return !navigator.onLine;
  }

  // Get storage usage estimate
  async getStorageEstimate(): Promise<{ used: number; available: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0,
      };
    }
    return null;
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();

// Initialize offline storage when module loads
offlineStorage.initialize().catch(console.error);

// Auto-sync when online
export function setupAutoSync(): void {
  window.addEventListener('online', async () => {
    console.log('Connection restored, syncing data...');
    try {
      const result = await offlineStorage.syncWithServer();
      console.log(`Sync completed: ${result.success} successful, ${result.failed} failed`);
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  });

  window.addEventListener('offline', () => {
    console.log('Connection lost, switching to offline mode');
  });
}

// Utility functions for components
export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
}

export async function preloadStudentsForOffline(className?: string): Promise<void> {
  try {
    const url = className ? `/api/students?class=${encodeURIComponent(className)}` : '/api/students';
    const response = await fetch(url, { credentials: 'include' });
    
    if (response.ok) {
      const students = await response.json();
      const offlineStudents: OfflineStudent[] = students.map((student: any) => ({
        id: student.id,
        rollNumber: student.rollNumber,
        fullName: student.fullName,
        class: student.class,
        photoUrl: student.photoUrl,
        rfidCardId: student.rfidCardId,
        lastUpdated: Date.now(),
      }));

      await offlineStorage.cacheStudents(offlineStudents);
      console.log(`Cached ${offlineStudents.length} students for offline access`);
    }
  } catch (error) {
    console.error('Failed to preload students for offline:', error);
  }
}
