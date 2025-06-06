import api from './api';
import { autoMarkHoliday } from '../data/holidays';

// Get all attendance records
export const getAllAttendanceRecords = async () => {
  try {
    const response = await api.get('/attendance');
    return response.data.attendanceRecords || [];
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    throw error;
  }
};

// Get attendance records for a specific teacher
export const getTeacherAttendance = async (teacherId) => {
  try {
    const response = await api.get(`/attendance/teacher/${teacherId}`);
    return response.data.attendanceRecords || [];
  } catch (error) {
    console.error(`Error fetching attendance for teacher ${teacherId}:`, error);
    throw error;
  }
};

// Add or update attendance record
export const addAttendanceRecord = async (attendanceData) => {
  try {
    // Check if this is a holiday first
    const isAutoMarked = await autoMarkHoliday(
      attendanceData.date, 
      { addAttendanceRecord }, // Passing this service as reference
      attendanceData.teacherId
    );
    
    // If already auto-marked as holiday, don't continue
    if (isAutoMarked && !attendanceData.overrideHoliday) {
      return { 
        success: true, 
        message: 'Attendance automatically marked as holiday',
        record: attendanceData
      };
    }
    
    const response = await api.post('/attendance', attendanceData);
    return {
      success: true,
      message: 'Attendance record added successfully',
      record: response.data.attendance
    };
  } catch (error) {
    console.error('Error adding attendance record:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Error adding attendance record',
      error 
    };
  }
};

// Delete an attendance record
export const deleteAttendanceRecord = async (id) => {
  try {
    await api.delete(`/attendance/${id}`);
    return { success: true, message: 'Attendance record deleted successfully' };
  } catch (error) {
    console.error(`Error deleting attendance record ${id}:`, error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Error deleting attendance record',
      error 
    };
  }
};

// Get attendance summary by month/year
export const getAttendanceSummary = async (teacherId, year, month) => {
  try {
    const response = await api.get(`/attendance/summary/teacher/${teacherId}`, {
      params: { year, month }
    });
    return response.data.summary || {};
  } catch (error) {
    console.error(`Error fetching attendance summary for teacher ${teacherId}:`, error);
    throw error;
  }
};

// Check and auto-mark holidays for a specified period
export const processHolidaysForPeriod = async (teacherId, startDate, endDate) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Generate all dates in the range
    const dates = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Process each date
    const results = [];
    for (const date of dates) {
      const dateString = date.toISOString().split('T')[0];
      const result = await autoMarkHoliday(
        dateString,
        { addAttendanceRecord },
        teacherId
      );
      
      if (result) {
        results.push({ date: dateString, success: true });
      }
    }
    
    return {
      success: true,
      message: `Processed ${results.length} holidays`,
      results
    };
  } catch (error) {
    console.error('Error processing holidays for period:', error);
    return {
      success: false,
      message: 'Failed to process holidays',
      error
    };
  }
};

export default {
  getAllAttendanceRecords,
  getTeacherAttendance,
  addAttendanceRecord,
  deleteAttendanceRecord,
  getAttendanceSummary,
  processHolidaysForPeriod
}; 