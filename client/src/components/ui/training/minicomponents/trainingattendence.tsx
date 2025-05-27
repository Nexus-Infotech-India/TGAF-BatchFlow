import { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Save,
  RefreshCw,
  Check,
  X,
  FileText,
  AlertCircle,
  ChevronDown,
  User,
  Users,
  Calendar,
  Clock,
  MapPin,
  Eye,
  Edit3,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ExternalLink} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { API_ROUTES } from '../../../../utils/api';
import { format } from 'date-fns';
import SessionAttendanceViewer from '../minicomponents/sessionview';

// Types
type User = {
  id: string;
  name: string;
  email: string;
  department?: string;
  role?: string;
};

interface TrainingAttendanceProps {
  training: any;
  onRefresh: () => void;
}

type AttendanceRecord = {
  userId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
  signatureUrl?: string;
  feedbackFormUrl?: string;
};

type SessionParticipant = {
  userId: string;
  user: User;
};

type AttendanceData = {
  recorded: Array<{
    userId: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    remarks?: string;
    signatureUrl?: string;
    user: User;
  }>;
  missing: Array<SessionParticipant>;
};

type Session = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  venue: string;
  description?: string;
  maxParticipants?: number;
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: index * 0.05,
      duration: 0.3
    }
  })
};

const TrainingAttendance: React.FC<TrainingAttendanceProps> = ({
  training,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State for attendance records and session selection
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [sessionInfo, setSessionInfo] = useState<{
    title: string;
    date: string;
    venue?: string;
    description?: string;
  } | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [uploadedFileNames, setUploadedFileNames] = useState<Record<string, string>>({});
  const [showAttendanceView, setShowAttendanceView] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'view'>('edit');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch sessions for this training
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['trainingSessions', training?.id],
    queryFn: async () => {
      const response = await api.get(
        API_ROUTES.TRAINING.GET_TRAINING_SESSIONS(training.id),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      return response.data.data;
    },
    enabled: !!training?.id,
  });

  // Get completed sessions only
  const completedSessions =
    sessionsData?.filter(
      (session: Session) =>
        session.status === 'COMPLETED' || new Date(session.endTime) < new Date()
    ) || [];

  // Fetch session info based on selected session
  const sessionQuery = useQuery({
    queryKey: ['session', selectedSessionId],
    queryFn: async () => {
      const response = await api.get(
        API_ROUTES.TRAINING.GET_SESSION_BY_ID(selectedSessionId),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      return response.data.data;
    },
    enabled: !!selectedSessionId,
  });

  const sessionData = sessionQuery.data;
  const sessionLoading = sessionQuery.isLoading;

  // Fetch attendance data based on selected session
  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    isError: attendanceError,
    error: attendanceErrorDetails,
    refetch: refetchAttendance,
  } = useQuery<{ data: AttendanceData }>({
    queryKey: ['attendance', selectedSessionId],
    queryFn: async () => {
      const response = await api.get(
        API_ROUTES.TRAINING.GET_SESSION_ATTENDANCE(selectedSessionId),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      return response.data;
    },
    enabled: !!selectedSessionId,
  });

  // Fetch existing feedback forms
  const { data: feedbackFormsData, isLoading: feedbackFormsLoading } = useQuery({
    queryKey: ['feedbackForms', selectedSessionId],
    queryFn: async () => {
      const response = await api.get(
        API_ROUTES.TRAINING.GET_SESSION_FEEDBACK_FORMS(selectedSessionId),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      return response.data.data;
    },
    enabled: !!selectedSessionId,
  });

  // Fetch training participants if attendance data is empty
  const { data: participantsData, isLoading: participantsLoading } = useQuery({
    queryKey: ['trainingParticipants', training?.id, selectedSessionId],
    queryFn: async () => {
      const response = await api.get(
        API_ROUTES.TRAINING.GET_TRAINING_PARTICIPANTS(training.id),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      return response.data.data;
    },
    enabled:
      !!selectedSessionId &&
      !!attendanceData &&
      (attendanceData?.data?.recorded?.length > 0 ||
        attendanceData?.data?.missing?.length > 0),
  });

  // Initialize attendance records from fetch data
  useEffect(() => {
    if (attendanceData) {
      let records: AttendanceRecord[] = [];

      if (
        attendanceData?.data?.recorded?.length > 0 ||
        attendanceData?.data?.missing?.length > 0
      ) {
        records = [
          ...attendanceData.data.recorded.map((record) => ({
            userId: record.userId,
            status: record.status,
            remarks: record.remarks || '',
            signatureUrl: record.signatureUrl,
            feedbackFormUrl: '',
          })),
          ...attendanceData.data.missing.map((participant) => ({
            userId: participant.userId,
            status: 'ABSENT' as const,
            remarks: '',
            signatureUrl: '',
            feedbackFormUrl: '',
          })),
        ];

        if (attendanceData.data.recorded.length > 0) {
          setShowAttendanceView(true);
          setActiveTab('view');
        }
      } else if (participantsData && participantsData.length > 0) {
        records = participantsData.map((participant: any) => ({
          userId: participant.userId || participant.id,
          status: 'ABSENT' as const,
          remarks: '',
          signatureUrl: '',
          feedbackFormUrl: '',
        }));
      }

      setAttendanceRecords(records);
    }
  }, [attendanceData, participantsData]);

  // Set session info
  useEffect(() => {
    if (sessionData) {
      setSessionInfo({
        title: sessionData.title,
        date: new Date(sessionData.startTime).toLocaleDateString(),
        venue: sessionData.venue,
        description: sessionData.description,
      });
    }
  }, [sessionData]);

  // Handle session change
  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSessionId(e.target.value);
    setAttendanceRecords([]);
    setErrorMessage(null);
    setSuccessMessage(null);
    setUploadedFileNames({});
    setShowAttendanceView(false);
    setActiveTab('edit');
  };

  // Update attendance mutation
  const recordAttendanceMutation = useMutation({
    mutationFn: async (records: AttendanceRecord[]) => {
      return api.post(
        API_ROUTES.TRAINING.RECORD_ATTENDANCE(selectedSessionId),
        { attendanceRecords: records },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
    },
    onSuccess: () => {
      setSuccessMessage('Attendance recorded successfully!');
      queryClient.invalidateQueries({
        queryKey: ['attendance', selectedSessionId],
      });
      onRefresh();

      setShowAttendanceView(true);
      setActiveTab('view');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    },
    onError: (error: any) => {
      setErrorMessage(
        error.response?.data?.message ||
          'There was an error recording attendance. Please try again.'
      );
    },
  });

  // Handle form submission
  const handleSubmit = () => {
    recordAttendanceMutation.mutate(attendanceRecords);
  };

  // Update attendance record
  const updateAttendanceRecord = (
    userId: string,
    field: string,
    value: string
  ) => {
    const updatedRecords = attendanceRecords.map((record) => {
      if (record.userId === userId) {
        return { ...record, [field]: value };
      }
      return record;
    });
    setAttendanceRecords(updatedRecords);
  };

  // Handle feedback form upload
  const handleFeedbackFormUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    userId: string
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('feedbackForm', file);

    try {
      setErrorMessage(null);
      setUploadingFiles((prev) => ({ ...prev, [userId]: true }));

      const uploadResponse = await api.post(
        API_ROUTES.TRAINING.UPLOAD_FEEDBACK_FORM(selectedSessionId, userId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (uploadResponse.data && uploadResponse.data.data) {
        const fileUrl = uploadResponse.data.data.fileUrl;

        updateAttendanceRecord(userId, 'feedbackFormUrl', fileUrl);

        setUploadedFileNames((prev) => ({
          ...prev,
          [userId]: file.name,
        }));

        setSuccessMessage(`Feedback form uploaded successfully: ${file.name}`);
        setTimeout(() => setSuccessMessage(null), 3000);

        queryClient.invalidateQueries({
          queryKey: ['feedbackForms', selectedSessionId],
        });
      } else {
        throw new Error('No file URL returned from server');
      }
    } catch (error: any) {
      console.error('Error uploading feedback form:', error);
      setErrorMessage(
        error.response?.data?.message || error instanceof Error
          ? `Failed to upload feedback form: ${error.message}`
          : 'Failed to upload feedback form. Please try again.'
      );
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // Get existing feedback form URL if available
  const getExistingFeedbackFormUrl = (participantId: string) => {
    if (!feedbackFormsData) return null;
    const form = feedbackFormsData.find(
      (form: any) => form.participantId === participantId
    );
    return form ? form.fileUrl : null;
  };

  // Filter and search records
  const filteredRecords = attendanceRecords.filter((record) => {
    const participant =
      attendanceData?.data?.recorded?.find((r) => r.userId === record.userId)?.user ||
      attendanceData?.data?.missing?.find((p) => p.userId === record.userId)?.user ||
      participantsData?.find((p: any) => p.id === record.userId || p.userId === record.userId);

    const matchesSearch = participant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate attendance statistics


  // Determine if we're in a loading state
  const isLoading =
    sessionsLoading ||
    sessionLoading ||
    attendanceLoading ||
    recordAttendanceMutation.isPending ||
    participantsLoading ||
    feedbackFormsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 via-white-50 to-white-50">
      <div className="container mx-auto px-4 py-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
         

          {/* Loading overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="mb-4"
                  >
                    <RefreshCw size={48} className="text-blue-600" />
                  </motion.div>
                  <p className="text-gray-700 font-medium">Loading attendance data...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Messages */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center text-red-800"
              >
                <XCircle size={20} className="mr-3 text-red-600" />
                <div>
                  <h4 className="font-semibold">Error</h4>
                  <p className="text-sm">{errorMessage}</p>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center text-green-800"
              >
                <CheckCircle size={20} className="mr-3 text-green-600" />
                <div>
                  <h4 className="font-semibold">Success</h4>
                  <p className="text-sm">{successMessage}</p>
                </div>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="ml-auto text-green-600 hover:text-green-800"
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Session Selector */}
          <motion.div
            variants={cardVariants}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b">
              
            </div>
            
            <div className="p-6">
             
                
               
              

              <div className="relative">
                <select
                  value={selectedSessionId}
                  onChange={handleSessionChange}
                  disabled={sessionsLoading}
                  className="w-full p-4 border border-gray-300 rounded-xl bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700"
                >
                  <option value="">Select a session</option>
                  {completedSessions.map((session: Session) => (
                    <option key={session.id} value={session.id}>
                      {session.title} - {format(new Date(session.startTime), 'MMM dd, yyyy')} at{' '}
                      {format(new Date(session.startTime), 'h:mm a')}
                    </option>
                  ))}
                </select>
                <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {completedSessions.length === 0 && !sessionsLoading && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center">
                  <AlertTriangle size={20} className="text-orange-600 mr-3" />
                  <p className="text-orange-800">
                    No completed sessions found. Sessions must be completed before recording attendance.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Enhanced Session Info */}
          {selectedSessionId && sessionInfo && (
            <motion.div
              variants={cardVariants}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <Calendar size={18} className="mr-2 text-indigo-600" />
                  Session Details
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <FileText size={18} className="text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Session Title</p>
                      <p className="font-semibold text-gray-800">{sessionInfo.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock size={18} className="text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-semibold text-gray-800">{sessionInfo.date}</p>
                    </div>
                  </div>
                  {sessionInfo.venue && (
                    <div className="flex items-center">
                      <MapPin size={18} className="text-purple-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Venue</p>
                        <p className="font-semibold text-gray-800">{sessionInfo.venue}</p>
                      </div>
                    </div>
                  )}
                </div>
                {sessionInfo.description && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{sessionInfo.description}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Enhanced Tabs */}
          {selectedSessionId && showAttendanceView && (
            <motion.div
              variants={cardVariants}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="flex border-b bg-gray-50">
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`flex items-center px-6 py-4 font-medium transition-all ${
                    activeTab === 'edit'
                      ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <Edit3 size={18} className="mr-2" />
                  Edit Attendance
                </button>
                <button
                  onClick={() => setActiveTab('view')}
                  className={`flex items-center px-6 py-4 font-medium transition-all ${
                    activeTab === 'view'
                      ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <Eye size={18} className="mr-2" />
                  View Summary
                </button>
              </div>
            </motion.div>
          )}

          {/* Edit Mode */}
          {selectedSessionId && activeTab === 'edit' && (
            <motion.div
              variants={cardVariants}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <Edit3 size={18} className="mr-2 text-blue-600" />
                  Record Attendance
                </h3>
              </div>

              <div className="p-6">
                {/* Enhanced Info Box */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start">
                  <Info size={20} className="text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-blue-800 font-medium">Instructions</p>
                    <p className="text-blue-700 text-sm mt-1">
                      Mark each participant as present, absent, late or excused, and optionally add remarks. 
                      You can also upload feedback forms for participants who were present.
                    </p>
                  </div>
                </div>

                {/* Search and Filter */}
                {attendanceRecords.length > 0 && (
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search participants..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="relative">
                      <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[150px]"
                      >
                        <option value="all">All Status</option>
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="LATE">Late</option>
                        <option value="EXCUSED">Excused</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Enhanced Attendance Table */}
                {attendanceError ? (
                  <div className="p-6 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-800">
                    <AlertCircle size={20} className="mr-3" />
                    <div>
                      <h4 className="font-semibold">Failed to load attendance data</h4>
                      <p className="text-sm">
                        {attendanceErrorDetails instanceof Error
                          ? attendanceErrorDetails.message
                          : 'Unknown error'}
                      </p>
                    </div>
                  </div>
                ) : filteredRecords.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                        <tr>
                          <th className="text-left p-4 font-semibold text-gray-700 border-b border-gray-200">
                            Participant
                          </th>
                          <th className="text-left p-4 font-semibold text-gray-700 border-b border-gray-200">
                            Status
                          </th>
                          <th className="text-left p-4 font-semibold text-gray-700 border-b border-gray-200">
                            Remarks
                          </th>
                          <th className="text-left p-4 font-semibold text-gray-700 border-b border-gray-200">
                            Feedback Form
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {filteredRecords.map((record, index) => {
                            const participant =
                              attendanceData?.data?.recorded?.find(
                                (r) => r.userId === record.userId
                              )?.user ||
                              attendanceData?.data?.missing?.find(
                                (p) => p.userId === record.userId
                              )?.user ||
                              participantsData?.find(
                                (p: any) =>
                                  p.id === record.userId ||
                                  p.userId === record.userId
                              );

                            const existingFormUrl = getExistingFeedbackFormUrl(record.userId);

                            return (
                              <motion.tr
                                key={record.userId}
                                custom={index}
                                variants={tableRowVariants}
                                initial="hidden"
                                animate="visible"
                                className="hover:bg-blue-50 transition-colors border-b border-gray-100"
                              >
                                <td className="p-4">
                                  <div className="flex items-center">
                                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center mr-3 font-semibold">
                                      {participant?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-800">
                                        {participant?.name || 'Unknown'}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {participant?.email || 'Unknown'}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <select
                                    value={record.status}
                                    onChange={(e) =>
                                      updateAttendanceRecord(
                                        record.userId,
                                        'status',
                                        e.target.value
                                      )
                                    }
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="PRESENT">✅ Present</option>
                                    <option value="ABSENT">❌ Absent</option>
                                    <option value="LATE">⏰ Late</option>
                                    <option value="EXCUSED">✋ Excused</option>
                                  </select>
                                </td>
                                <td className="p-4">
                                  <textarea
                                    value={record.remarks || ''}
                                    onChange={(e) =>
                                      updateAttendanceRecord(
                                        record.userId,
                                        'remarks',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Add remarks..."
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    rows={2}
                                  />
                                </td>
                                <td className="p-4">
                                  {record.status === 'PRESENT' || record.status === 'LATE' ? (
                                    <div>
                                      {uploadingFiles[record.userId] ? (
                                        <div className="flex items-center text-blue-600">
                                          <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{
                                              duration: 1,
                                              repeat: Infinity,
                                              ease: 'linear',
                                            }}
                                          >
                                            <RefreshCw size={16} />
                                          </motion.div>
                                          <span className="ml-2 text-sm">Uploading...</span>
                                        </div>
                                      ) : existingFormUrl ? (
                                        <div className="space-y-2">
                                          <a
                                            href={existingFormUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                                          >
                                            <FileText size={16} className="mr-1" />
                                            View Existing Form
                                            <ExternalLink size={12} className="ml-1" />
                                          </a>
                                          <button
                                            onClick={() => {
                                              const fileInput = document.getElementById(
                                                `feedback-form-${record.userId}`
                                              );
                                              if (fileInput) fileInput.click();
                                            }}
                                            className="flex items-center text-gray-600 hover:text-gray-800 text-sm"
                                          >
                                            <Upload size={14} className="mr-1" />
                                            Upload New
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            const fileInput = document.getElementById(
                                              `feedback-form-${record.userId}`
                                            );
                                            if (fileInput) fileInput.click();
                                          }}
                                          className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all ${
                                            uploadedFileNames[record.userId]
                                              ? 'bg-green-100 text-green-800 border border-green-200'
                                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                          }`}
                                        >
                                          {uploadedFileNames[record.userId] ? (
                                            <>
                                              <Check size={14} className="mr-1" />
                                              <span className="truncate max-w-[120px]">
                                                {uploadedFileNames[record.userId]}
                                              </span>
                                            </>
                                          ) : (
                                            <>
                                              <Upload size={14} className="mr-1" />
                                              Upload Form
                                            </>
                                          )}
                                        </button>
                                      )}
                                      <input
                                        id={`feedback-form-${record.userId}`}
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        onChange={(e) =>
                                          handleFeedbackFormUpload(e, record.userId)
                                        }
                                        className="hidden"
                                      />
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500 italic">
                                      Available for present participants
                                    </p>
                                  )}
                                </td>
                              </motion.tr>
                            );
                          })}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                ) : attendanceRecords.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Users size={48} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      No Participants Available
                    </h3>
                    <p className="text-gray-600 mb-6">
                      There are no participants assigned to this session yet.
                      You need to add participants to the training before you can record attendance.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(`/trainings/${training.id}/participants`)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center mx-auto"
                    >
                      <User size={16} className="mr-2" />
                      Manage Participants
                    </motion.button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Search size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No participants match your search criteria.</p>
                  </div>
                )}

                {/* Enhanced Action Buttons */}
                {filteredRecords.length > 0 && (
                  <div className="mt-8 flex flex-col sm:flex-row justify-end gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(-1)}
                      className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      disabled={recordAttendanceMutation.isPending}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {recordAttendanceMutation.isPending ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="mr-2"
                          >
                            <RefreshCw size={16} />
                          </motion.div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Save Attendance
                        </>
                      )}
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* View Mode */}
          {activeTab === 'view' && selectedSessionId && (
            <motion.div
              variants={cardVariants}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <SessionAttendanceViewer
                sessionId={selectedSessionId}
                trainingId={training.id}
                onRefresh={refetchAttendance}
              />
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TrainingAttendance;