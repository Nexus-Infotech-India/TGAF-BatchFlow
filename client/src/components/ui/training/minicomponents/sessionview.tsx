import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserCheck, Clock, FileText, 
  ExternalLink, RefreshCw, 
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { format } from 'date-fns';
import api, { API_ROUTES } from '../../../../utils/api';

// Types
interface SessionAttendanceViewerProps {
  sessionId: string;
  trainingId: string;
  onRefresh: () => void;
}


type FeedbackForm = {
  id: string;
  sessionId: string;
  participantId: string;
  fileUrl: string;
  submittedAt: string;
  participant: {
    id: string;
    name: string;
    email: string;
    organization?: string;
  };
};

// Styled Components
const Container = styled(motion.div)`
  padding: 1.5rem;
  background-color: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  margin-top: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e40af;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const StyledButton = styled(motion.button)<{ variant?: 'primary' | 'secondary' | 'outline' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  gap: 0.5rem;
  
  ${props => {
    if (props.variant === 'primary') {
      return `
        background-color: #2563eb;
        color: white;
        border: none;
        &:hover {
          background-color: #1d4ed8;
        }
      `;
    } else if (props.variant === 'outline') {
      return `
        background-color: transparent;
        color: #2563eb;
        border: 1px solid #2563eb;
        &:hover {
          background-color: #eff6ff;
        }
      `;
    } else {
      return `
        background-color: #f1f5f9;
        color: #334155;
        border: 1px solid #cbd5e1;
        &:hover {
          background-color: #e2e8f0;
        }
      `;
    }
  }}
`;

const Stats = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const StatCard = styled.div<{ status: 'present' | 'absent' | 'late' | 'excused' }>`
  background-color: ${props => {
    switch (props.status) {
      case 'present': return '#ecfdf5'; // green-50
      case 'absent': return '#fef2f2'; // red-50
      case 'late': return '#fff7ed'; // orange-50
      case 'excused': return '#eef2ff'; // indigo-50
      default: return '#f8fafc'; // slate-50
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'present': return '#a7f3d0'; // green-200
      case 'absent': return '#fecaca'; // red-200
      case 'late': return '#fed7aa'; // orange-200
      case 'excused': return '#c7d2fe'; // indigo-200
      default: return '#e2e8f0'; // slate-200
    }
  }};
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 180px;
  flex-grow: 1;
`;

const StatIcon = styled.div<{ status: 'present' | 'absent' | 'late' | 'excused' }>`
  color: ${props => {
    switch (props.status) {
      case 'present': return '#059669'; // green-600
      case 'absent': return '#dc2626'; // red-600
      case 'late': return '#ea580c'; // orange-600
      case 'excused': return '#4f46e5'; // indigo-600
      default: return '#475569'; // slate-600
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatText = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatLabel = styled.span`
  font-size: 0.875rem;
  color: #64748b; // slate-500
`;

const StatValue = styled.span`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b; // slate-800
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
`;

const TableHeader = styled.thead`
  background-color: #f1f5f9; // slate-100
`;

const TableHeaderCell = styled.th`
  text-align: left;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: #334155; // slate-700
  border-bottom: 1px solid #e2e8f0;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f8fafc; // slate-50
  }
  
  &:hover {
    background-color: #f1f5f9; // slate-100
  }
`;

const TableCell = styled.td`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #334155; // slate-700
`;

const StatusBadge = styled.div<{ status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch(props.status) {
      case 'PRESENT':
        return `
          background-color: #dcfce7;
          color: #15803d;
        `;
      case 'ABSENT':
        return `
          background-color: #fee2e2;
          color: #b91c1c;
        `;
      case 'LATE':
        return `
          background-color: #ffedd5;
          color: #c2410c;
        `;
      case 'EXCUSED':
        return `
          background-color: #e0e7ff;
          color: #4338ca;
        `;
      default:
        return `
          background-color: #f1f5f9;
          color: #475569;
        `;
    }
  }}
`;

const LoadingState = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #2563eb;
`;

const ErrorState = styled.div`
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  color: #b91c1c;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  background-color: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 0.5rem;
  color: #64748b;
`;

const TabsContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #e2e8f0;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.75rem 1rem;
  margin-right: 0.5rem;
  border: none;
  background-color: transparent;
  font-weight: ${props => props.active ? '600' : '400'};
  color: ${props => props.active ? '#2563eb' : '#64748b'};
  border-bottom: ${props => props.active ? '2px solid #2563eb' : 'none'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.active ? '#2563eb' : '#334155'};
  }
`;

const SessionInfo = styled.div`
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const SessionInfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1e40af;
  font-size: 0.875rem;
`;

const FeedbackCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
`;

const FeedbackCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
`;

const FeedbackCardHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
`;

const FeedbackCardBody = styled.div`
  padding: 1rem;
`;

const FeedbackCardFooter = styled.div`
  padding: 0.75rem 1rem;
  border-top: 1px solid #e2e8f0;
  background-color: #f8fafc;
  display: flex;
  justify-content: flex-end;
`;

const SessionAttendanceViewer: React.FC<SessionAttendanceViewerProps> = ({
  sessionId,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'feedback'>('attendance');

  // Fetch session info
  const sessionQuery = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const response = await api.get(API_ROUTES.TRAINING.GET_SESSION_BY_ID(sessionId), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      return response.data.data;
    }
  });

  // Fetch attendance data
  const attendanceQuery = useQuery({
    queryKey: ['attendance', sessionId],
    queryFn: async () => {
      const response = await api.get(API_ROUTES.TRAINING.GET_SESSION_ATTENDANCE(sessionId), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      return response.data.data;
    }
  });

  // Fetch feedback forms
  const feedbackQuery = useQuery({
    queryKey: ['feedbackForms', sessionId],
    queryFn: async () => {
      const response = await api.get(API_ROUTES.TRAINING.GET_SESSION_FEEDBACK_FORMS(sessionId), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      return response.data.data;
    },
    enabled: activeTab === 'feedback'
  });

  // Session info
  const session = sessionQuery.data;
  
  // Calculate attendance stats
  const attendanceStats = React.useMemo(() => {
    if (!attendanceQuery.data?.recorded) {
      return {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0
      };
    }

    const records = attendanceQuery.data.recorded;
    return {
      total: records.length,
      present: records.filter((r: { status: string; }) => r.status === 'PRESENT').length,
      absent: records.filter((r: { status: string; }) => r.status === 'ABSENT').length,
      late: records.filter((r: { status: string; }) => r.status === 'LATE').length,
      excused: records.filter((r: { status: string; }) => r.status === 'EXCUSED').length
    };
  }, [attendanceQuery.data]);

  // Handle refresh
  const handleRefresh = () => {
    attendanceQuery.refetch();
    feedbackQuery.refetch();
    onRefresh();
  };

  // Loading state
  if (sessionQuery.isLoading || attendanceQuery.isLoading || 
      (activeTab === 'feedback' && feedbackQuery.isLoading)) {
    return (
      <Container>
        <LoadingState
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <RefreshCw size={36} />
          <div className="ml-2">Loading attendance data...</div>
        </LoadingState>
      </Container>
    );
  }

  // Error state
  if (sessionQuery.isError || attendanceQuery.isError || 
      (activeTab === 'feedback' && feedbackQuery.isError)) {
    return (
      <Container>
        <ErrorState>
          <AlertCircle size={24} />
          <div>
            <div className="font-medium">Failed to load attendance data</div>
            <div className="text-sm">Please try refreshing the page</div>
          </div>
        </ErrorState>
        <StyledButton onClick={handleRefresh} variant="primary">
          <RefreshCw size={16} />
          Refresh Data
        </StyledButton>
      </Container>
    );
  }

  // Empty state
  if (!attendanceQuery.data?.recorded || attendanceQuery.data.recorded.length === 0) {
    return (
      <Container>
        <Header>
          <Title>
            <UserCheck size={20} />
            Session Attendance
          </Title>
          <Actions>
            <StyledButton onClick={handleRefresh}>
              <RefreshCw size={16} />
              Refresh
            </StyledButton>
          </Actions>
        </Header>
        <EmptyState>
          <AlertCircle size={40} className="mb-3 opacity-60" />
          <div className="text-lg font-medium mb-1">No attendance records found</div>
          <div className="max-w-md text-center mb-3">
            Attendance hasn't been recorded for this session yet.
          </div>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <Title>
          <UserCheck size={20} />
          Session Attendance
        </Title>
        <Actions>
         
          <StyledButton onClick={handleRefresh}>
            <RefreshCw size={16} />
            Refresh
          </StyledButton>
        </Actions>
      </Header>

      {session && (
        <SessionInfo>
          <SessionInfoItem>
            <Clock size={16} />
            Date: {format(new Date(session.startTime), 'MMM dd, yyyy')}
          </SessionInfoItem>
          <SessionInfoItem>
            <Clock size={16} />
            Time: {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
          </SessionInfoItem>
          {session.venue && (
            <SessionInfoItem>
              <Clock size={16} />
              Venue: {session.venue}
            </SessionInfoItem>
          )}
        </SessionInfo>
      )}

      <Stats>
        <StatCard status="present">
          <StatIcon status="present">
            <CheckCircle size={24} />
          </StatIcon>
          <StatText>
            <StatLabel>Present</StatLabel>
            <StatValue>{attendanceStats.present}</StatValue>
          </StatText>
        </StatCard>
        <StatCard status="absent">
          <StatIcon status="absent">
            <XCircle size={24} />
          </StatIcon>
          <StatText>
            <StatLabel>Absent</StatLabel>
            <StatValue>{attendanceStats.absent}</StatValue>
          </StatText>
        </StatCard>
        <StatCard status="late">
          <StatIcon status="late">
            <Clock size={24} />
          </StatIcon>
          <StatText>
            <StatLabel>Late</StatLabel>
            <StatValue>{attendanceStats.late}</StatValue>
          </StatText>
        </StatCard>
        <StatCard status="excused">
          <StatIcon status="excused">
            <AlertCircle size={24} />
          </StatIcon>
          <StatText>
            <StatLabel>Excused</StatLabel>
            <StatValue>{attendanceStats.excused}</StatValue>
          </StatText>
        </StatCard>
      </Stats>

      <TabsContainer>
        <Tabs>
          <Tab 
            active={activeTab === 'attendance'} 
            onClick={() => setActiveTab('attendance')}
          >
            Attendance Records
          </Tab>
          <Tab 
            active={activeTab === 'feedback'} 
            onClick={() => setActiveTab('feedback')}
          >
            Feedback Forms
            {feedbackQuery.data && feedbackQuery.data.length > 0 && 
              ` (${feedbackQuery.data.length})`}
          </Tab>
        </Tabs>
      </TabsContainer>

      {activeTab === 'attendance' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Organization</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Remarks</TableHeaderCell>
              </tr>
            </TableHeader>
            <tbody>
              {attendanceQuery.data.recorded.map((record: any) => (
                <TableRow key={record.userId}>
                  <TableCell>{record.user.name}</TableCell>
                  <TableCell>{record.user.email}</TableCell>
                  <TableCell>{record.user.organization || '-'}</TableCell>
                  <TableCell>
                    <StatusBadge status={record.status}>
                      {record.status === 'PRESENT' && <CheckCircle size={14} />}
                      {record.status === 'ABSENT' && <XCircle size={14} />}
                      {record.status === 'LATE' && <Clock size={14} />}
                      {record.status === 'EXCUSED' && <AlertCircle size={14} />}
                      {record.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{record.remarks || '-'}</TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </motion.div>
      )}

      {activeTab === 'feedback' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {feedbackQuery.data && feedbackQuery.data.length > 0 ? (
            <FeedbackCards>
              {feedbackQuery.data.map((form: FeedbackForm) => (
                <FeedbackCard key={form.id}>
                  <FeedbackCardHeader>
                    <div className="text-sm font-medium">{form.participant.name}</div>
                    <div className="text-xs text-gray-500">{form.participant.email}</div>
                  </FeedbackCardHeader>
                  <FeedbackCardBody>
                    <div className="text-sm">
                      <div className="mb-2">
                        <span className="text-gray-500">Submitted:</span>{' '}
                        {format(new Date(form.submittedAt), 'MMM dd, yyyy h:mm a')}
                      </div>
                      {form.participant.organization && (
                        <div className="mb-2">
                          <span className="text-gray-500">Organization:</span>{' '}
                          {form.participant.organization}
                        </div>
                      )}
                    </div>
                  </FeedbackCardBody>
                  <FeedbackCardFooter>
                    <StyledButton 
                      as="a" 
                      href={form.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      variant="outline"
                    >
                      <FileText size={14} />
                      View Form
                      <ExternalLink size={12} />
                    </StyledButton>
                  </FeedbackCardFooter>
                </FeedbackCard>
              ))}
            </FeedbackCards>
          ) : (
            <EmptyState>
              <FileText size={40} className="mb-3 opacity-60" />
              <div className="text-lg font-medium mb-1">No feedback forms submitted</div>
              <div className="max-w-md text-center">
                No participants have submitted feedback forms for this session yet.
              </div>
            </EmptyState>
          )}
        </motion.div>
      )}
    </Container>
  );
};

export default SessionAttendanceViewer;