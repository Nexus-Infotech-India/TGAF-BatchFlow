import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { CalendarProps } from 'antd';
import api from '../../utils/api';
import { API_ROUTES } from '../../utils/api';
import { CalendarData, DailyData } from '../../Types/calenderTypes';
import { message } from 'antd';

export const useCalendarLogic = (formInstance: any) => {
  // State
  const [currentMonth, setCurrentMonth] = useState(dayjs().month() + 1); // 1-12
  const [currentYear, setCurrentYear] = useState(dayjs().year());
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [detailLevel, setDetailLevel] = useState<'overview' | 'compact' | 'detailed'>('overview');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedTrainingType, setSelectedTrainingType] = useState<string | null>(null);
  const [isDescriptionModalVisible, setIsDescriptionModalVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  // Auth token
  const authToken = localStorage.getItem('authToken');

  // Get calendar data query
  const calendarQuery = useQuery({
    queryKey: ['trainingCalendar', currentMonth, currentYear, detailLevel, selectedStatus, selectedTrainingType],
    queryFn: async () => {
      const params = new URLSearchParams({
        month: currentMonth.toString(),
        year: currentYear.toString(),
        detailLevel
      });
      
      if (selectedStatus) {
        params.append('status', selectedStatus);
      }
      
      if (selectedTrainingType) {
        params.append('trainingType', selectedTrainingType);
      }
      
      const response = await api.get(`${API_ROUTES.TRAINING.GET_MONTHLY_CALENDAR}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      return response.data as CalendarData;
    },
    enabled: !!authToken
  });

  // Get daily data query
  const dailyQuery = useQuery({
    queryKey: ['dailyCalendar', selectedDate?.format('YYYY-MM-DD')],
    queryFn: async () => {
      if (!selectedDate) return null;
      
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const response = await api.get(API_ROUTES.TRAINING.GET_DAILY_CALENDAR(dateStr), {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      return response.data as DailyData;
    },
    enabled: !!selectedDate && !!authToken
  });

  // Update description mutation
  const updateDescriptionMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await api.put(
        API_ROUTES.TRAINING.UPDATE_CALENDAR_DESCRIPTION(currentMonth.toString(), currentYear.toString()),
        { description },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      message.success('Calendar description updated successfully');
      calendarQuery.refetch();
      setIsDescriptionModalVisible(false);
    },
    onError: (error: any) => {
      message.error('Failed to update description: ' + (error.response?.data?.message || error.message));
    }
  });

  // Handlers
  const handleDateSelect: CalendarProps<dayjs.Dayjs>['onSelect'] = (date) => {
    setSelectedDate(date);
    setIsDrawerVisible(true);
  };

  const handlePanelChange: CalendarProps<dayjs.Dayjs>['onPanelChange'] = (value, mode) => {
    if (mode === 'month') {
      setCurrentMonth(value.month() + 1);
      setCurrentYear(value.year());
    }
  };

  const handlePrevMonth = () => {
    const newDate = dayjs().year(currentYear).month(currentMonth - 2);
    setCurrentMonth(newDate.month() + 1);
    setCurrentYear(newDate.year());
  };

  const handleNextMonth = () => {
    const newDate = dayjs().year(currentYear).month(currentMonth);
    setCurrentMonth(newDate.month() + 1);
    setCurrentYear(newDate.year());
  };

  const handleEditDescription = () => {
    formInstance.setFieldsValue({
      description: calendarQuery.data?.calendarInfo?.description || ''
    });
    setIsDescriptionModalVisible(true);
  };

  const handleDescriptionSubmit = () => {
    formInstance
      .validateFields()
      .then((values: any) => {
        updateDescriptionMutation.mutate(values.description);
      });
  };

  const handleFilterChange = (filterType: string, value: string | null) => {
    if (filterType === 'status') {
      setSelectedStatus(value);
    } else if (filterType === 'trainingType') {
      setSelectedTrainingType(value);
    }
  };

  const resetFilters = () => {
    setSelectedStatus(null);
    setSelectedTrainingType(null);
    setDetailLevel('overview');
  };

  // Utility functions
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    
    if (start.month() === end.month() && start.year() === end.year()) {
      return `${start.format('MMM D')} - ${end.format('D, YYYY')}`;
    }
    
    if (start.year() === end.year()) {
      return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
    }
    
    return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`;
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${dayjs(startTime).format('h:mm A')} - ${dayjs(endTime).format('h:mm A')}`;
  };

  const getCellData = (date: dayjs.Dayjs) => {
    if (!calendarQuery.data) return null;
    
    const day = date.date();
    const month = date.month() + 1;
    const year = date.year();
    
    // Only render content for the current month
    if (month !== currentMonth || year !== currentYear) {
      return null;
    }
    
    const dayData = calendarQuery.data.days.find(d => d.day === day);
    if (!dayData) return null;
    
    return dayData;
  };

  return {
    // State
    currentMonth,
    currentYear,
    selectedDate,
    detailLevel,
    selectedStatus,
    selectedTrainingType,
    isDescriptionModalVisible,
    isDrawerVisible,
    
    // Setters
    setCurrentMonth,
    setCurrentYear,
    setSelectedDate,
    setDetailLevel,
    setSelectedStatus, 
    setSelectedTrainingType,
    setIsDescriptionModalVisible,
    setIsDrawerVisible,
    
    // Queries and mutations
    calendarQuery,
    dailyQuery,
    updateDescriptionMutation,
    
    // Handlers
    handleDateSelect,
    handlePanelChange,
    handlePrevMonth,
    handleNextMonth,
    handleEditDescription,
    handleDescriptionSubmit,
    handleFilterChange,
    resetFilters,
    
    // Utility functions
    formatDateRange,
    formatTimeRange,
    getCellData
  };
};