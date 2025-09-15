// Service Worker for Rural Schools Attendance System
// Provides offline functionality, caching, and background sync

const CACHE_NAME = 'attendance-system-v1.0.0';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const OFFLINE_PAGE = '/offline.html';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/auth',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  // Add other static assets as needed
];

// API routes that should work offline
const OFFLINE_APIS = [
  '/api/user',
  '/api/students',
  '/api/classes',
  '/api/attendance/stats'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // Delete old cache versions
              return cacheName.startsWith('attendance-system-') && 
                     cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE;
            })
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets and pages
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses for offline access
    if (networkResponse.ok && OFFLINE_APIS.some(api => url.pathname.startsWith(api))) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', url.pathname);
    
    // Try to serve from cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline indicator for failed API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This feature is not available offline' 
      }), 
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  // Try cache first for static assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Try network if not in cache
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match(OFFLINE_PAGE);
      return offlineResponse || new Response(getOfflinePageHtml(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    throw error;
  }
}

// Background sync for attendance data
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'attendance-sync') {
    event.waitUntil(syncAttendanceData());
  }
});

// Sync attendance data when connection is restored
async function syncAttendanceData() {
  try {
    // Get pending attendance records from IndexedDB
    const pendingRecords = await getPendingAttendanceRecords();
    
    for (const record of pendingRecords) {
      try {
        const response = await fetch('/api/attendance/mark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify([record])
        });

        if (response.ok) {
          await markRecordSynced(record.id);
          console.log('[SW] Synced attendance record:', record.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync record:', record.id, error);
      }
    }

    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        synced: pendingRecords.length
      });
    });
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Handle push notifications (for future implementation)
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: data.tag || 'attendance-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Details'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Utility functions for IndexedDB operations
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AttendanceSystemDB', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getPendingAttendanceRecords() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['attendanceRecords'], 'readonly');
    const store = transaction.objectStore('attendanceRecords');
    const index = store.index('synced');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(false);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[SW] Failed to get pending records:', error);
    return [];
  }
}

async function markRecordSynced(recordId) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['attendanceRecords'], 'readwrite');
    const store = transaction.objectStore('attendanceRecords');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(recordId);
      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.synced = true;
          const updateRequest = store.put(record);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(); // Record not found, consider it synced
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error('[SW] Failed to mark record as synced:', error);
  }
}

// Offline page HTML
function getOfflinePageHtml() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - Attendance System</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8fafc;
            color: #374151;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
        }
        .container {
            max-width: 400px;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 1rem;
            background: #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
        }
        h1 {
            color: #111827;
            margin-bottom: 0.5rem;
        }
        p {
            color: #6b7280;
            margin-bottom: 1.5rem;
            line-height: 1.5;
        }
        button {
            background: #16a34a;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            width: 100%;
        }
        button:hover {
            background: #15803d;
        }
        .offline-indicator {
            background: #fef2f2;
            color: #dc2626;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📡</div>
        <h1>You're Offline</h1>
        <p>
            The attendance system is currently offline. Some features may not be available, 
            but you can still mark attendance manually and it will sync when you're back online.
        </p>
        <button onclick="location.reload()">Try Again</button>
        <div class="offline-indicator">
            ⚠️ Working in offline mode
        </div>
    </div>

    <script>
        // Check for connectivity and reload when online
        window.addEventListener('online', () => {
            location.reload();
        });

        // Show online/offline status
        function updateStatus() {
            const indicator = document.querySelector('.offline-indicator');
            if (navigator.onLine) {
                indicator.textContent = '✅ Back online - refreshing...';
                indicator.style.background = '#f0fdf4';
                indicator.style.color = '#16a34a';
                setTimeout(() => location.reload(), 1000);
            }
        }

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
    </script>
</body>
</html>
  `;
}

// Message handling from clients
self.addEventListener('message', event => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CACHE_STUDENT_DATA':
      // Cache student data for offline access
      cacheStudentData(data);
      break;
      
    case 'CLEAR_CACHE':
      // Clear all caches
      clearAllCaches();
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Cache student data for offline access
async function cacheStudentData(students) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    // Cache student photos
    const photoPromises = students
      .filter(student => student.photoUrl)
      .map(student => {
        return cache.add(student.photoUrl).catch(err => {
          console.warn('[SW] Failed to cache photo:', student.photoUrl, err);
        });
      });
    
    await Promise.all(photoPromises);
    console.log('[SW] Cached student data for offline access');
  } catch (error) {
    console.error('[SW] Failed to cache student data:', error);
  }
}

// Clear all caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
  }
}

// Periodic background sync (when supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', event => {
    if (event.tag === 'attendance-sync') {
      event.waitUntil(syncAttendanceData());
    }
  });
}

// Clean up old caches periodically
setInterval(() => {
  caches.keys().then(cacheNames => {
    const oldCaches = cacheNames.filter(cacheName => {
      return cacheName.startsWith('attendance-system-') &&
             !cacheName.includes('v1.0.0');
    });
    
    return Promise.all(
      oldCaches.map(cacheName => caches.delete(cacheName))
    );
  });
}, 24 * 60 * 60 * 1000); // Run daily

console.log('[SW] Service worker loaded successfully');
