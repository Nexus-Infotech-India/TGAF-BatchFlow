export interface CalendarInfo {
  id: string;
  month: number;
  year: number;
  description: string;
}

export interface Training {
  id: string;
  title: string;
  status: string;
  trainingType: string;
  startDate: string;
  endDate: string;
  location: string;
  trainer?: {
    id: string;
    name: string;
  };
  _count?: {
    participants: number;
    sessions: number;
    documents: number;
  };
  sessions?: Session[]; 
}

export interface Session {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  venue: string;
  trainingId: string;
  trainingTitle: string;
}

export interface CalendarDay {
  day: number;
  date: Date;
  isWeekend: boolean;
  trainings: Training[];
  sessions: Session[];
}

export interface CalendarData {
  message: string;
  calendarInfo: CalendarInfo;
  month: number;
  year: number;
  firstDayOfMonth: number;
  daysInMonth: number;
  days: CalendarDay[];
  trainings: Training[];
  statistics: {
    totalTrainings: number;
    scheduledTrainings: number;
    completedTrainings: number;
    inProgressTrainings: number;
    cancelledTrainings: number;
  };
}

export interface DailyData {
  message: string;
  date: string;
  day: number;
  month: number;
  year: number;
  trainings: Training[];
  trainingsCount: number;
}

// Status color mapping
export const statusColors = {
  SCHEDULED: '#1890ff',
  IN_PROGRESS: '#faad14',
  COMPLETED: '#52c41a',
  CANCELLED: '#f5222d',
  POSTPONED: '#722ed1'
};

export const trainingTypeColors: Record<string, string> = {
  TECHNICAL: '#108ee9',
  SAFETY: '#f5222d',
  COMPLIANCE: '#faad14',
  ONBOARDING: '#52c41a',
  WORKSHOP: '#722ed1',
  SEMINAR: '#eb2f96',
  PROFESSIONAL_DEVELOPMENT: '#fa8c16'
};


// Animation variants
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export const cardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
};