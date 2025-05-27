import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Button,
  Table,
  Space,
  Empty,
  message,
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  Row,
  Col,
  Select,
  Tag,
  Tooltip
} from 'antd';
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiBook,
  FiEdit2,
  FiTrash2,
  FiAlertCircle,
  FiRefreshCw,
  FiCheck,
  FiCamera
} from 'react-icons/fi';
import api from '../../../../utils/api';
import { API_ROUTES } from '../../../../utils/api';
import dayjs from 'dayjs';
import SessionPhotoGallery from '../../../pages/training/sessiongallery';

const { TextArea } = Input;
const { Option } = Select;

interface TrainingSessionsProps {
  training: any;
  onRefresh: () => void;
}

const TrainingSessions: React.FC<TrainingSessionsProps> = ({ training, onRefresh }) => {
  const [sessions, setSessions] = useState(training.sessions || []);
  const [loading, setLoading] = useState(false);
  const [addSessionModalVisible, setAddSessionModalVisible] = useState(false);
  const [deleteSessionModalVisible, setDeleteSessionModalVisible] = useState(false);
  const [editSessionModalVisible, setEditSessionModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [photoGalleryVisible, setPhotoGalleryVisible] = useState(false);

  const handleAddSession = () => {
    form.resetFields();
    setAddSessionModalVisible(true);
  };

  const handleEditSession = (session: any) => {
    setSelectedSession(session);
    
    // Only set form values AFTER the modal is open
    setEditSessionModalVisible(true);
    
    // Use setTimeout to ensure the form is mounted before setting values
    setTimeout(() => {
      // Convert string dates to dayjs objects
      const sessionDate = dayjs(session.startTime);
      const startTime = dayjs(session.startTime);
      const endTime = dayjs(session.endTime);
      
      editForm.setFieldsValue({
        title: session.title,
        venue: session.venue,
        description: session.description,
        sessionDate: sessionDate,
        startTime: startTime,
        endTime: endTime,
      });
    }, 100);
  };

  const handleDeleteSession = (session: any) => {
    setSelectedSession(session);
    setDeleteSessionModalVisible(true);
  };

  const handleUpdateStatus = (session: any) => {
    setSelectedSession(session);
    setStatusModalVisible(true);
    statusForm.setFieldsValue({
      status: session.status || 'SCHEDULED'
    });
  };

  const handleViewPhotos = (session: any) => {
    setSelectedSession(session);
    setPhotoGalleryVisible(true);
  };

  const confirmDeleteSession = async () => {
    if (!selectedSession) return;
    
    try {
      setLoading(true);
      await api.delete(
        API_ROUTES.TRAINING.DELETE_TRAINING_SESSION(selectedSession.id),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      
      message.success('Session deleted successfully');
      setSessions(sessions.filter((s: { id: any; }) => s.id !== selectedSession.id));
      setDeleteSessionModalVisible(false);
      onRefresh();
    } catch (error) {
      message.error('Failed to delete session');
      console.error('Error deleting session:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAddSession = async (values: any) => {
    try {
      setLoading(true);
      
      // Format date and times for submission
      const sessionDate = values.sessionDate.format('YYYY-MM-DD');
      const startTime = `${sessionDate}T${values.startTime.format('HH:mm:00')}`;
      const endTime = `${sessionDate}T${values.endTime.format('HH:mm:00')}`;
      
      const sessionData = {
        trainingId: training.id,
        title: values.title,
        description: values.description,
        venue: values.venue,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        status: values.status || 'SCHEDULED'
      };
      
      await api.post(
        API_ROUTES.TRAINING.ADD_TRAINING_SESSION(training.id), 
        sessionData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      
      message.success('Session added successfully');
      setAddSessionModalVisible(false);
      onRefresh();
    } catch (error) {
      message.error('Failed to add session');
      console.error('Error adding session:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitEditSession = async (values: any) => {
    if (!selectedSession) return;
    
    try {
      setLoading(true);
      
      // Get the date portion from sessionDate
      const date = values.sessionDate.format('YYYY-MM-DD');
      
      // Combine the date with the time values
      const startTime = `${date}T${values.startTime.format('HH:mm:00')}`;
      const endTime = `${date}T${values.endTime.format('HH:mm:00')}`;
      
      const sessionData = {
        title: values.title,
        description: values.description,
        venue: values.venue,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString()
      };
      
      await api.patch(
        API_ROUTES.TRAINING.UPDATE_TRAINING_SESSION(selectedSession.id), 
        sessionData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      
      message.success('Session updated successfully');
      setEditSessionModalVisible(false);
      onRefresh();
    } catch (error) {
      message.error('Failed to update session');
      console.error('Error updating session:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitUpdateStatus = async (values: any) => {
    if (!selectedSession) return;
    
    try {
      setLoading(true);
      
      await api.patch(
        API_ROUTES.TRAINING.UPDATE_SESSION_STATUS(selectedSession.id),
        { status: values.status },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      
      message.success('Session status updated successfully');
      
      // Update local state with new status
      const updatedSessions = sessions.map((session: any) => 
        session.id === selectedSession.id 
          ? { ...session, status: values.status } 
          : session
      );
      setSessions(updatedSessions);
      
      setStatusModalVisible(false);
      onRefresh();
    } catch (error) {
      message.error('Failed to update session status');
      console.error('Error updating session status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to render status tag with appropriate color
  const renderStatusTag = (status: string) => {
    let color;
    
    switch (status) {
      case 'SCHEDULED':
        color = 'blue';
        break;
      case 'IN_PROGRESS':
        color = 'orange';
        break;
      case 'COMPLETED':
        color = 'green';
        break;
      case 'CANCELLED':
        color = 'red';
        break;
      case 'POSTPONED':
        color = 'purple';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Tag color={color}>
        {status?.replace(/_/g, ' ')}
      </Tag>
    );
  };
  
  const sessionColumns = [
    {
      title: 'Session Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <span className="font-medium text-blue-600">{text}</span>
    },
    {
      title: 'Date',
      key: 'date',
      render: (_: any, record: any) => (
        <div className="flex items-center">
          <FiCalendar className="mr-2 text-blue-500" />
          <span>{format(new Date(record.startTime), 'MMM dd, yyyy')}</span>
        </div>
      )
    },
    {
      title: 'Time',
      key: 'time',
      render: (_: any, record: any) => (
        <div className="flex items-center">
          <FiClock className="mr-2 text-blue-500" />
          <span>
            {format(new Date(record.startTime), 'hh:mm a')} - 
            {format(new Date(record.endTime), 'hh:mm a')}
          </span>
        </div>
      )
    },
    {
      title: 'Venue',
      dataIndex: 'venue',
      key: 'venue',
      render: (text: string) => (
        <div className="flex items-center">
          <FiMapPin className="mr-2 text-blue-500" />
          <span>{text}</span>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => renderStatusTag(status || 'SCHEDULED')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Edit Session">
            <Button 
              type="text" 
              icon={<FiEdit2 className="text-blue-500" />} 
              onClick={() => handleEditSession(record)}
              className="border border-blue-200 hover:border-blue-500 hover:text-blue-500"
            />
          </Tooltip>
          <Tooltip title="Update Status">
            <Button
              type="text"
              icon={<FiRefreshCw className="text-green-500" />}
              onClick={() => handleUpdateStatus(record)}
              className="border border-green-200 hover:border-green-500 hover:text-green-500"
            />
          </Tooltip>
          {record.status === 'COMPLETED' && (
            <Tooltip title="Session Photos">
              <Button
                type="text"
                icon={<FiCamera className="text-purple-500" />}
                onClick={() => handleViewPhotos(record)}
                className="border border-purple-200 hover:border-purple-500 hover:text-purple-500"
              />
            </Tooltip>
          )}
          <Tooltip title="Delete Session">
            <Button 
              type="text" 
              icon={<FiTrash2 className="text-red-500" />} 
              onClick={() => handleDeleteSession(record)}
              className="border border-red-200 hover:border-red-500 hover:text-red-500"
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold text-blue-800">Training Sessions</h2>
        <Button 
          type="primary"
          onClick={handleAddSession}
          icon={<FiBook className="mr-1" />}
          className="bg-blue-600 hover:bg-blue-700 border-none"
        >
          Add Session
        </Button>
      </div>
      
      {sessions.length > 0 ? (
        <Table
          columns={sessionColumns}
          dataSource={sessions}
          rowKey="id"
          loading={loading}
          rowClassName="hover:bg-blue-50 transition-colors"
        />
      ) : (
        <Empty 
          description="No sessions found for this training" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className="my-8"
        />
      )}

      {/* Add Session Modal */}
      <Modal
        title="Add New Session"
        open={addSessionModalVisible}
        onCancel={() => setAddSessionModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={submitAddSession}
        >
          <Form.Item
            name="title"
            label="Session Title"
            rules={[{ required: true, message: 'Please enter a session title' }]}
          >
            <Input placeholder="Enter session title" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="sessionDate"
                label="Session Date"
                rules={[{ required: true, message: 'Please select a date' }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startTime"
                label="Start Time"
                rules={[{ required: true, message: 'Please select a start time' }]}
              >
                <TimePicker format="HH:mm" className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endTime"
                label="End Time"
                rules={[{ required: true, message: 'Please select an end time' }]}
              >
                <TimePicker format="HH:mm" className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="venue"
            label="Venue"
            rules={[{ required: true, message: 'Please enter a venue' }]}
          >
            <Input placeholder="Enter venue" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter session description (optional)" />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="Status"
            initialValue="SCHEDULED"
          >
            <Select>
              <Option value="SCHEDULED">Scheduled</Option>
              <Option value="IN_PROGRESS">In Progress</Option>
              <Option value="COMPLETED">Completed</Option>
              <Option value="CANCELLED">Cancelled</Option>
              <Option value="POSTPONED">Postponed</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setAddSessionModalVisible(false)}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              className="bg-blue-600 hover:bg-blue-700 border-none"
            >
              Add Session
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Session Modal */}
      <Modal
        title="Edit Session"
        open={editSessionModalVisible}
        onCancel={() => setEditSessionModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={submitEditSession}
        >
          <Form.Item
            name="title"
            label="Session Title"
            rules={[{ required: true, message: 'Please enter a session title' }]}
          >
            <Input placeholder="Enter session title" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="sessionDate"
                label="Session Date"
                rules={[{ required: true, message: 'Please select a date' }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startTime"
                label="Start Time"
                rules={[{ required: true, message: 'Please select a start time' }]}
              >
                <TimePicker format="HH:mm" className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endTime"
                label="End Time"
                rules={[{ required: true, message: 'Please select an end time' }]}
              >
                <TimePicker format="HH:mm" className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="venue"
            label="Venue"
            rules={[{ required: true, message: 'Please enter a venue' }]}
          >
            <Input placeholder="Enter venue" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter session description (optional)" />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setEditSessionModalVisible(false)}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              className="bg-blue-600 hover:bg-blue-700 border-none"
            >
              Update Session
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        title="Update Session Status"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={statusForm}
          layout="vertical"
          onFinish={submitUpdateStatus}
        >
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select>
              <Option value="SCHEDULED">Scheduled</Option>
              <Option value="IN_PROGRESS">In Progress</Option>
              <Option value="COMPLETED">Completed</Option>
              <Option value="CANCELLED">Cancelled</Option>
              <Option value="POSTPONED">Postponed</Option>
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="notes" 
            label="Status Update Notes"
          >
            <TextArea 
              rows={3} 
              placeholder="Add optional notes about this status change"
            />
          </Form.Item>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setStatusModalVisible(false)}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              icon={<FiCheck className="mr-1" />}
              className="bg-green-600 hover:bg-green-700 border-none"
            >
              Update Status
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Delete Session Confirmation Modal */}
      <Modal
        title="Delete Session"
        open={deleteSessionModalVisible}
        onCancel={() => setDeleteSessionModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteSessionModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="delete" 
            danger 
            loading={loading}
            onClick={confirmDeleteSession}
          >
            Delete
          </Button>
        ]}
      >
        <div className="flex items-start">
          <FiAlertCircle className="text-red-500 mr-3 text-lg mt-1" />
          <div>
            <p>Are you sure you want to delete this session?</p>
            {selectedSession && (
              <p className="font-medium mt-2">{selectedSession.title}</p>
            )}
            <p className="text-gray-500 mt-1">This action cannot be undone.</p>
          </div>
        </div>
      </Modal>
      
      {/* Session Photo Gallery Component */}
      {selectedSession && (
        <SessionPhotoGallery
          sessionId={selectedSession.id}
          visible={photoGalleryVisible}
          onClose={() => setPhotoGalleryVisible(false)}
          sessionTitle={selectedSession.title}
        />
      )}
    </motion.div>
  );
};

export default TrainingSessions;