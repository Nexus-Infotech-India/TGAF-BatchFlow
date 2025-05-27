import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  message,
  Divider,
  InputNumber,
  Typography,
  Tooltip,
  Row,
  Col,
  Spin,
  Result,
  Alert,
  Badge,
  Avatar,
  Empty
} from 'antd';
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiBookOpen,
  FiChevronLeft,
  FiSave,
  FiInfo,
  FiEdit3,
  FiMessageCircle,
  FiHelpCircle,
  FiUserPlus,
  FiX
} from 'react-icons/fi';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { API_ROUTES } from '../../../utils/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      when: "beforeChildren",
      staggerChildren: 0.15,
      ease: "easeOut"
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      type: "spring",
      damping: 12,
      stiffness: 100
    }
  }
};

const cardHoverVariants = {
  rest: { scale: 1, boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" },
  hover: { 
    scale: 1.01,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

const CreateTraining: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [, setUsers] = useState<any[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  // Get current month and year for the calendar
  const currentMonth = dayjs().month() + 1; // 1-12
  const currentYear = dayjs().year();

  useEffect(() => {
    const fetchData = async () => {
      setFetchingUsers(true);
      try {
        await Promise.all([fetchTrainers(), fetchUsers()]);
      } finally {
        setFetchingUsers(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    // Update form value when selectedParticipants changes
    form.setFieldsValue({ participants: selectedParticipants });
  }, [selectedParticipants, form]);

  const fetchTrainers = async () => {
    try {
      const response = await api.get(API_ROUTES.AUTH.GET_ALL_USERS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      const filteredTrainers = response.data.users.filter((user: any) => 
        (user.role && user.role.name === 'Trainer') || 
        (user.role && user.role.name === 'Admin') || 
        user.canTeach
      );
      
      setTrainers(filteredTrainers);
    } catch (error) {
      message.error('Failed to fetch trainers');
      console.error('Error fetching trainers:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get(API_ROUTES.AUTH.GET_ALL_USERS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      setUsers(response.data.users);
    } catch (error) {
      message.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    }
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setDateRange([dates[0], dates[1]]);
      // Update form values
      form.setFieldsValue({
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      });

      // If session dates are not yet set, suggest them based on the training dates
      const sessionStartTime = form.getFieldValue(['session', 'startTime']);
      if (!sessionStartTime) {
        const suggestedStartTime = dates[0].hour(9).minute(0); // 9:00 AM on first day
        const suggestedEndTime = dates[0].hour(17).minute(0); // 5:00 PM on first day
        
        form.setFieldsValue({
          session: {
            ...form.getFieldValue('session'),
            startTime: suggestedStartTime,
            endTime: suggestedEndTime,
          }
        });
      }
    } else {
      setDateRange(null);
    }
  };


  const handleSubmit = async () => {
    try {
      await form.validateFields();
      
      setLoading(true);
      setIsSubmitting(true);
      
      // Format the data according to the API requirements
      
      
      setSuccess(true);
      message.success('Training created successfully');
      
      // Show success state for a moment before redirecting
      setTimeout(() => {
        navigate('/trainings'); // Redirect to training list
      }, 1500);
    } catch (error) {
      console.error('Error creating training:', error);
      message.error('Failed to create training. Please check your inputs and try again.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="p-6 bg-white rounded-lg shadow-sm"
      >
        <Result
          status="success"
          title="Training Created Successfully!"
          subTitle="Your new training program has been set up and is ready to go."
          extra={[
            <Button 
              type="primary" 
              key="trainings" 
              onClick={() => navigate('/trainings')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Training List
            </Button>,
            <Button 
              key="create-another" 
              onClick={() => {
                setSuccess(false);
                form.resetFields();
                setSelectedParticipants([]);
              }}
            >
              Create Another Training
            </Button>,
          ]}
        />
      </motion.div>
    );
  }

  // Helper function to get user by ID

  // Filter users not yet selected

  return (
    <motion.div
      className="p-6 bg-white rounded-lg shadow-sm"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div 
        className="mb-6 flex justify-between items-center"
        variants={itemVariants}
      >
        <div>
          <Button 
            type="text" 
            icon={<FiChevronLeft />}
            onClick={() => navigate('/trainings')}
            className="mb-2 flex items-center hover:text-blue-600"
          >
            Back to Trainings
          </Button>
          <Title level={2} className="text-blue-700 m-0">Create New Training</Title>
          <Text type="secondary">Complete all sections to create a new training program</Text>
        </div>
        
        <div className="hidden md:flex items-center bg-blue-50 rounded-lg px-4 py-2 border border-blue-100">
          <FiInfo className="text-blue-600 mr-2" />
          <Text className="text-blue-600">
            <span className="font-medium">Fields marked with * are required</span>
          </Text>
        </div>
      </motion.div>

      <Row gutter={24} className="mt-4">
        {/* Main Form Content - Left Side (2/3) */}
        <Col xs={24} lg={16}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              month: currentMonth,
              year: currentYear,
            }}
            className="space-y-6"
          >
            {/* Basic Information Section */}
            <motion.div 
              variants={cardHoverVariants}
              whileHover="hover"
              initial="rest"
              className="mb-6"
            >
              <Card 
                className="shadow-sm border-blue-100 transition-all duration-300"
                title={
                  <span className="text-lg text-blue-700 flex items-center">
                    <FiBookOpen className="mr-2" />
                    Basic Training Information
                  </span>
                }
                headStyle={{ borderBottomColor: '#E0E7FF', backgroundColor: '#F5F8FF' }}
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="title"
                      label="Training Title"
                      rules={[{ required: true, message: 'Please enter a title' }]}
                    >
                      <Input 
                        placeholder="Enter training title"
                        className="rounded-md hover:border-blue-400 focus:border-blue-500"
                        prefix={<FiEdit3 className="text-blue-400 mr-2" />}
                        size="large"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      name="trainingType"
                      label="Training Type"
                      rules={[{ required: true, message: 'Please select a training type' }]}
                    >
                      <Select 
                        placeholder="Select type"
                        size="large"
                        className="rounded-md"
                        optionLabelProp="label"
                      >
                        <Option value="WORKSHOP" label="Workshop">
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                            Workshop
                          </div>
                        </Option>
                        <Option value="SEMINAR" label="Seminar">
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                            Seminar
                          </div>
                        </Option>
                        <Option value="COURSE" label="Course">
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                            Course
                          </div>
                        </Option>
                        <Option value="CERTIFICATION" label="Certification">
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                            Certification
                          </div>
                        </Option>
                        <Option value="WEBINAR" label="Webinar">
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                            Webinar
                          </div>
                        </Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      label={
                        <div className="flex items-center">
                          <FiCalendar className="mr-1 text-blue-500" />
                          Training Date Range
                        </div>
                      }
                      rules={[{ required: true, message: 'Please select date range' }]}
                    >
                      <RangePicker 
                        className="w-full"
                        onChange={handleDateRangeChange}
                        format="YYYY-MM-DD"
                        size="large"
                        placeholder={['Start Date', 'End Date']}
                        ranges={{
                          'Next Week': [dayjs().add(7, 'd'), dayjs().add(14, 'd')],
                          'Next Month': [dayjs().add(1, 'month'), dayjs().add(1, 'month').add(7, 'd')]
                        }}
                        allowClear={true}
                      />
                    </Form.Item>

                    {/* Hidden fields to store the actual dates for submission */}
                    <Form.Item name="startDate" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name="endDate" hidden>
                      <Input />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      name="location"
                      label={
                        <span className="flex items-center">
                          <FiMapPin className="mr-1 text-blue-500" />
                          Location
                        </span>
                      }
                      rules={[{ required: true, message: 'Please enter a location' }]}
                    >
                      <Input 
                        placeholder="Training location"
                        size="large"
                        className="rounded-md"
                      />
                    </Form.Item>
                  </Col>
                  
                  <Col span={12}>
                    <Form.Item
                      name="maxParticipants"
                      label={
                        <span className="flex items-center">
                          <FiUsers className="mr-1 text-blue-500" />
                          Maximum Participants
                        </span>
                      }
                      tooltip="Leave empty for unlimited participants"
                    >
                      <InputNumber 
                        className="w-full" 
                        min={1} 
                        placeholder="No limit" 
                        size="large"
                        addonAfter="participants"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item
                      name="trainerId"
                      label={
                        <span className="flex items-center">
                          <FiUsers className="mr-1 text-blue-500" />
                          Trainer
                        </span>
                      }
                      rules={[{ required: true, message: 'Please select a trainer' }]}
                    >
                      <Select 
                        placeholder={fetchingUsers ? "Loading trainers..." : "Select trainer"}
                        showSearch
                        loading={fetchingUsers}
                        size="large"
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={trainers?.map(trainer => ({
                          value: trainer.id,
                          label: trainer.name,
                          key: trainer.id
                        }))}
                        notFoundContent={fetchingUsers ? <Spin size="small" /> : "No trainers found"}
                        className="rounded-md"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item
                      name="description"
                      label={
                        <span className="flex items-center">
                          <FiMessageCircle className="mr-1 text-blue-500" />
                          Description
                        </span>
                      }
                      rules={[{ required: true, message: 'Please provide a description' }]}
                    >
                      <TextArea 
                        rows={4}
                        placeholder="Describe the training program (goals, prerequisites, outcomes, etc.)"
                        className="rounded-md"
                        showCount
                        maxLength={1000}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item
                      name="calendarDescription"
                      label={
                        <span className="flex items-center">
                          <FiCalendar className="mr-1 text-blue-500" />
                          Calendar Note
                          <Tooltip title="Additional information for the training calendar">
                            <FiHelpCircle className="ml-1 text-blue-500" />
                          </Tooltip>
                        </span>
                      }
                    >
                      <Input 
                        placeholder="Optional calendar description"
                        size="large"
                        className="rounded-md"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </motion.div>

            {/* Session Details Section */}
            <motion.div 
              variants={cardHoverVariants}
              whileHover="hover"
              initial="rest"
              className="mb-6"
            >
              <Card 
                className="shadow-sm border-blue-100 transition-all duration-300"
                title={
                  <span className="text-lg text-blue-700 flex items-center">
                    <FiClock className="mr-2" />
                    Initial Session Details
                  </span>
                }
                headStyle={{ borderBottomColor: '#E0E7FF', backgroundColor: '#F5F8FF' }}
              >
                <Alert
                  message="This will be the first session of your training program"
                  description="You can add more sessions after creating the training."
                  type="info"
                  showIcon
                  className="mb-4"
                />
                
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name={['session', 'title']}
                      label="Session Title"
                      rules={[{ required: true, message: 'Please enter a session title' }]}
                    >
                      <Input 
                        placeholder="e.g., Introduction Session"
                        size="large"
                        className="rounded-md"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      name={['session', 'startTime']}
                      label={
                        <span className="flex items-center">
                          <FiClock className="mr-1 text-blue-500" />
                          Start Time
                        </span>
                      }
                      rules={[{ required: true, message: 'Start time is required' }]}
                    >
                      <DatePicker 
                        showTime 
                        format="YYYY-MM-DD HH:mm"
                        className="w-full"
                        size="large"
                        placeholder="Select start time"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      name={['session', 'endTime']}
                      label={
                        <span className="flex items-center">
                          <FiClock className="mr-1 text-blue-500" />
                          End Time
                        </span>
                      }
                      rules={[
                        { required: true, message: 'End time is required' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const startTime = getFieldValue(['session', 'startTime']);
                            if (!value || !startTime || value.isAfter(startTime)) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('End time must be after start time'));
                          },
                        }),
                      ]}
                    >
                      <DatePicker 
                        showTime 
                        format="YYYY-MM-DD HH:mm"
                        className="w-full"
                        size="large"
                        placeholder="Select end time"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item
                      name={['session', 'venue']}
                      label={
                        <span className="flex items-center">
                          <FiMapPin className="mr-1 text-blue-500" />
                          Session Venue
                        </span>
                      }
                      rules={[{ required: true, message: 'Venue is required' }]}
                      extra="If different from the main training location"
                    >
                      <Input 
                        placeholder="Where will this session take place?"
                        size="large"
                        className="rounded-md"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item
                      name={['session', 'description']}
                      label={
                        <span className="flex items-center">
                          <FiMessageCircle className="mr-1 text-blue-500" />
                          Session Description
                        </span>
                      }
                    >
                      <TextArea 
                        rows={3} 
                        placeholder="Describe what this session will cover"
                        showCount
                        maxLength={500}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </motion.div>

            {/* Hidden form field to store participants */}
            <Form.Item name="participants" hidden>
              <Input />
            </Form.Item>

            {/* Summary Section */}
            <motion.div 
              whileHover="hover"
              initial="rest"
              variants={cardHoverVariants}
              className="mb-6"
            >
              <Card 
                className="shadow-sm border-indigo-100 bg-indigo-50 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Title level={5} className="text-indigo-800 m-0">Ready to Create Your Training?</Title>
                    <Text className="text-indigo-600">
                      Please review all details before submitting.
                    </Text>
                  </div>
                  <Button 
                    type="primary" 
                    onClick={handleSubmit} 
                    loading={loading}
                    icon={<FiSave className="mr-1" />}
                    className="flex items-center bg-indigo-600 hover:bg-indigo-700 border-none transition-colors"
                    size="large"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create Training"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </Form>
        </Col>
<Col xs={24} lg={8}>
  <motion.div 
    variants={cardHoverVariants}
    initial="rest"
    className="sticky top-4"
    style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}
  >
    <Card 
      className="shadow-sm border-blue-100 transition-all duration-300 h-full flex flex-col"
      title={
        <span className="text-lg text-blue-700 flex items-center">
          <FiUsers className="mr-2" />
          Participants
          <Badge 
            count={selectedParticipants.length} 
            style={{ backgroundColor: '#4F46E5', marginLeft: 8 }} 
            showZero
          />
        </span>
      }
      extra={
        <Badge 
          count="Optional" 
          style={{ backgroundColor: '#047857' }} 
        />
      }
      headStyle={{ borderBottomColor: '#E0E7FF', backgroundColor: '#F5F8FF' }}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Email input area */}
        <div className="mb-4">
          <Form.Item
            name="participantEmail"
            label="Add Participant Email"
            help="Enter email address and press Enter to add"
          >
            <Input.Search
              placeholder="participant@example.com"
              enterButton={<FiUserPlus />}
              size="large"
              className="rounded-md"
              onSearch={(value) => {
                if (value && value.includes('@')) {
                  setSelectedParticipants(prev => [...prev, value.trim()]);
                  form.setFieldsValue({ participantEmail: '' });
                } else if (value) {
                  message.error('Please enter a valid email address');
                }
              }}
              onPressEnter={(e) => {
                const target = e.target as HTMLInputElement;
                const value = target.value;
                if (value && value.includes('@')) {
                  setSelectedParticipants(prev => [...prev, value.trim()]);
                  form.setFieldsValue({ participantEmail: '' });
                } else if (value) {
                  message.error('Please enter a valid email address');
                }
                e.preventDefault();
              }}
            />
          </Form.Item>
        </div>

        <Divider className="my-2" />
        

        {/* Selected participants section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <Text strong className="text-blue-700">Added Participants</Text>
            <Text type="secondary">{selectedParticipants.length} added</Text>
          </div>
          
          <div className="overflow-y-auto bg-gray-50 p-2 rounded-md mb-4" style={{ maxHeight: '30%', minHeight: '120px' }}>
            {selectedParticipants.length > 0 ? (
              <div className="space-y-2">
                {selectedParticipants.map((email, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between bg-white p-2 rounded-md border border-gray-100 hover:border-blue-200"
                  >
                    <div className="flex items-center">
                      <Avatar 
                        size="small" 
                        style={{ backgroundColor: '#1890ff' }}
                      >
                        {email.charAt(0).toUpperCase()}
                      </Avatar>
                      <Text className="ml-2 truncate" style={{ maxWidth: '150px' }}>
                        {email}
                      </Text>
                    </div>
                    <Button 
                      type="text"
                      icon={<FiX className="text-gray-500 hover:text-red-500" />}
                      onClick={() => {
                        setSelectedParticipants(prev => prev.filter((_, i) => i !== index));
                      }}
                      size="small"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description="No participants added yet"
              />
            )}
          </div>
        </div>
        
        <Divider className="my-2" />
        
        {/* Informational text */}
        <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-100">
          <Text type="secondary" className="flex items-start text-sm text-blue-600">
            <FiInfo className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            Participants will be notified once the training is created. You can add or remove participants later.
          </Text>
        </div>
      </div>
    </Card>
  </motion.div>
</Col>
      </Row>
    </motion.div>
  );
};

export default CreateTraining;