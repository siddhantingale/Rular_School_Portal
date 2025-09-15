// PDF export utilities for attendance reports
// Provides functionality to generate and download PDF reports

interface AttendanceReportData {
  title: string;
  date: string;
  class?: string;
  subject?: string;
  teacher: string;
  students: {
    id: string;
    name: string;
    rollNumber: string;
    status: 'present' | 'absent';
  }[];
  summary: {
    total: number;
    present: number;
    absent: number;
    percentage: number;
  };
}

interface ReportOptions {
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  includePhotos?: boolean;
  includeCharts?: boolean;
}

// Generate simple HTML-based PDF (using browser's print functionality)
export async function generateAttendancePDF(
  data: AttendanceReportData,
  options: ReportOptions = {}
): Promise<void> {
  const { format = 'A4', orientation = 'portrait', includePhotos = false } = options;

  // Create a new window for the report
  const reportWindow = window.open('', '_blank', 'width=800,height=600');
  if (!reportWindow) {
    throw new Error('Failed to open report window. Please allow pop-ups.');
  }

  // Generate HTML content
  const htmlContent = generateReportHTML(data, { format, orientation, includePhotos });

  // Write content to the new window
  reportWindow.document.write(htmlContent);
  reportWindow.document.close();

  // Wait for content to load
  await new Promise(resolve => {
    reportWindow.onload = resolve;
    setTimeout(resolve, 1000); // Fallback timeout
  });

  // Trigger print dialog
  reportWindow.print();

  // Close window after printing (optional)
  setTimeout(() => {
    reportWindow.close();
  }, 1000);
}

// Generate CSV export
export function generateAttendanceCSV(data: AttendanceReportData): void {
  const headers = ['Roll Number', 'Student Name', 'Status'];
  const rows = data.students.map(student => [
    student.rollNumber,
    student.name,
    student.status.charAt(0).toUpperCase() + student.status.slice(1)
  ]);

  const csvContent = [
    // Report header
    [`Attendance Report: ${data.title}`],
    [`Date: ${data.date}`],
    [`Class: ${data.class || 'All Classes'}`],
    [`Teacher: ${data.teacher}`],
    [`Total Students: ${data.summary.total}`],
    [`Present: ${data.summary.present}`],
    [`Absent: ${data.summary.absent}`],
    [`Attendance Rate: ${data.summary.percentage}%`],
    [], // Empty row
    headers,
    ...rows
  ].map(row => row.join(',')).join('\n');

  // Download CSV file
  downloadFile(csvContent, `attendance-report-${data.date}.csv`, 'text/csv');
}

// Generate Excel-compatible CSV
export function generateAttendanceExcel(data: AttendanceReportData): void {
  // Add BOM for proper Excel UTF-8 handling
  const BOM = '\uFEFF';
  const headers = ['Roll Number', 'Student Name', 'Status', 'Date', 'Class'];
  const rows = data.students.map(student => [
    student.rollNumber,
    student.name,
    student.status.charAt(0).toUpperCase() + student.status.slice(1),
    data.date,
    data.class || ''
  ]);

  const csvContent = BOM + [
    // Summary section
    ['ATTENDANCE REPORT'],
    ['Date', data.date],
    ['Class', data.class || 'All Classes'],
    ['Subject', data.subject || ''],
    ['Teacher', data.teacher],
    [],
    ['SUMMARY'],
    ['Total Students', data.summary.total],
    ['Present', data.summary.present],
    ['Absent', data.summary.absent],
    ['Attendance Rate', `${data.summary.percentage}%`],
    [],
    ['STUDENT DETAILS'],
    headers,
    ...rows
  ].map(row => row.join(',')).join('\n');

  downloadFile(csvContent, `attendance-report-${data.date}.csv`, 'text/csv');
}

// Generate simple text report
export function generateAttendanceText(data: AttendanceReportData): void {
  const content = `
ATTENDANCE REPORT
================

Title: ${data.title}
Date: ${data.date}
Class: ${data.class || 'All Classes'}
${data.subject ? `Subject: ${data.subject}` : ''}
Teacher: ${data.teacher}

SUMMARY
-------
Total Students: ${data.summary.total}
Present: ${data.summary.present}
Absent: ${data.summary.absent}
Attendance Rate: ${data.summary.percentage}%

STUDENT DETAILS
---------------
${data.students.map(student => 
  `${student.rollNumber.padEnd(10)} ${student.name.padEnd(30)} ${student.status.toUpperCase()}`
).join('\n')}

Generated on: ${new Date().toLocaleString()}
  `.trim();

  downloadFile(content, `attendance-report-${data.date}.txt`, 'text/plain');
}

// Generate HTML content for PDF
function generateReportHTML(
  data: AttendanceReportData,
  options: { format: string; orientation: string; includePhotos: boolean }
): string {
  const { format, orientation, includePhotos } = options;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Attendance Report - ${data.title}</title>
    <style>
        @page {
            size: ${format} ${orientation};
            margin: 1in;
        }
        
        body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            margin: 0;
            color: #1976D2;
            font-size: 24px;
        }
        
        .header .subtitle {
            margin: 10px 0;
            color: #666;
            font-size: 14px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .info-section h3 {
            margin: 0 0 10px 0;
            color: #1976D2;
            font-size: 16px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        
        .info-section p {
            margin: 5px 0;
            font-size: 14px;
        }
        
        .summary-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            text-align: center;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        
        .stat-card .number {
            font-size: 24px;
            font-weight: bold;
            color: #1976D2;
            margin-bottom: 5px;
        }
        
        .stat-card .label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }
        
        .students-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        
        .students-table th,
        .students-table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
            font-size: 12px;
        }
        
        .students-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .students-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .status-present {
            color: #4CAF50;
            font-weight: bold;
        }
        
        .status-absent {
            color: #f44336;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 11px;
            color: #666;
            text-align: center;
        }
        
        @media print {
            body { print-color-adjust: exact; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${data.title}</h1>
        <div class="subtitle">Rural School Attendance Management System</div>
    </div>

    <div class="info-grid">
        <div class="info-section">
            <h3>Report Details</h3>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            ${data.class ? `<p><strong>Class:</strong> ${data.class}</p>` : ''}
            ${data.subject ? `<p><strong>Subject:</strong> ${data.subject}</p>` : ''}
        </div>
        
        <div class="info-section">
            <h3>Teacher Information</h3>
            <p><strong>Teacher:</strong> ${data.teacher}</p>
            <p><strong>Total Students:</strong> ${data.summary.total}</p>
        </div>
    </div>

    <div class="summary-stats">
        <div class="stat-card">
            <div class="number">${data.summary.total}</div>
            <div class="label">Total Students</div>
        </div>
        
        <div class="stat-card">
            <div class="number">${data.summary.present}</div>
            <div class="label">Present</div>
        </div>
        
        <div class="stat-card">
            <div class="number">${data.summary.absent}</div>
            <div class="label">Absent</div>
        </div>
        
        <div class="stat-card">
            <div class="number">${data.summary.percentage}%</div>
            <div class="label">Attendance Rate</div>
        </div>
    </div>

    <table class="students-table">
        <thead>
            <tr>
                <th>Roll No.</th>
                <th>Student Name</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${data.students.map(student => `
                <tr>
                    <td>${student.rollNumber}</td>
                    <td>${student.name}</td>
                    <td class="status-${student.status}">
                        ${student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="footer">
        <p>This report was generated automatically by the Rural School Attendance Management System</p>
        <p>Report generated on ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>
  `;
}

// Utility function to download files
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Convert attendance data to report format
export function formatAttendanceDataForReport(
  attendanceRecords: any[],
  students: any[],
  teacherName: string,
  title: string,
  className?: string,
  subject?: string
): AttendanceReportData {
  const studentMap = new Map(students.map(s => [s.id, s]));
  
  const reportStudents = students.map(student => {
    const attendanceRecord = attendanceRecords.find(r => r.studentId === student.id);
    return {
      id: student.id,
      name: student.fullName,
      rollNumber: student.rollNumber,
      status: attendanceRecord?.status || 'absent' as 'present' | 'absent',
    };
  });

  const presentCount = reportStudents.filter(s => s.status === 'present').length;
  const totalCount = reportStudents.length;
  const absentCount = totalCount - presentCount;
  const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return {
    title,
    date: new Date().toLocaleDateString(),
    class: className,
    subject,
    teacher: teacherName,
    students: reportStudents,
    summary: {
      total: totalCount,
      present: presentCount,
      absent: absentCount,
      percentage,
    },
  };
}

// Export multiple formats at once
export async function exportMultipleFormats(
  data: AttendanceReportData,
  formats: Array<'pdf' | 'csv' | 'excel' | 'text'>
): Promise<void> {
  for (const format of formats) {
    switch (format) {
      case 'pdf':
        await generateAttendancePDF(data);
        break;
      case 'csv':
        generateAttendanceCSV(data);
        break;
      case 'excel':
        generateAttendanceExcel(data);
        break;
      case 'text':
        generateAttendanceText(data);
        break;
    }
    
    // Small delay between downloads to avoid browser blocking
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
