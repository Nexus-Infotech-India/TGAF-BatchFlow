import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Select, DatePicker, InputNumber, Card, message, Spin } from 'antd';
import { motion } from 'framer-motion';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import moment from 'moment';
import api from '../../../utils/api';
import { API_ROUTES } from '../../../utils/api';

const { TextArea } = Input;
const { Option } = Select;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

const EditTraining: React.FC = () => {
  const { trainingId } = useParams<{ trainingId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [trainers, setTrainers] = useState<any[]>([]);

  useEffect(() => {
    // Fetch training data and trainers when component mounts
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch training details
        const trainingResponse = await api.get(API_ROUTES.TRAINING.GET_TRAINING_BY_ID(trainingId!), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        
        const trainingData = trainingResponse.data.data;
        
        // Fetch all users who can be trainers (you might need to adjust this API)
        const trainersResponse = await api.get(API_ROUTES.AUTH.GET_ALL_USERS, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        
        // Set initial form values
        form.setFieldsValue({
          title: trainingData.title,
          description: trainingData.description,
          trainingType: trainingData.trainingType,
          startDate: moment(trainingData.startDate),
          endDate: moment(trainingData.endDate),
          location: trainingData.location,
          maxParticipants: trainingData.maxParticipants,
          trainerId: trainingData.trainerId
        });
        
        setTrainers(trainersResponse.data.users || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        message.error('Failed to load training details');
        navigate('/trainings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [trainingId, form, navigate]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      const updatedTraining = {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD')
      };
      
      await api.put(API_ROUTES.TRAINING.UPDATE_TRAINING(trainingId!), updatedTraining, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      message.success('Training updated successfully');
      navigate('/trainings');
    } catch (error) {
      console.error('Error updating training:', error);
      message.error('Failed to update training');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 bg-white rounded-lg shadow-sm"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            icon={<FiArrowLeft />} 
            onClick={() => navigate('/trainings')}
            className="mr-4"
          >
            Back to Trainings
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
            Edit Training
          </h1>
        </div>
      </div>

      <Card className="shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="Training Title"
            rules={[{ required: true, message: 'Please enter training title' }]}
          >
            <Input placeholder="Enter training title" size="large" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={4} placeholder="Enter description" />
          </Form.Item>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="trainingType"
              label="Training Type"
              rules={[{ required: true, message: 'Please select training type' }]}
            >
              <Select placeholder="Select training type" size="large">
                <Option value="WORKSHOP">Workshop</Option>
                <Option value="SEMINAR">Seminar</Option>
                <Option value="COURSE">Course</Option>
                <Option value="CERTIFICATION">Certification</Option>
                <Option value="WEBINAR">Webinar</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="trainerId"
              label="Trainer"
              rules={[{ required: true, message: 'Please select trainer' }]}
            >
              <Select placeholder="Select trainer" size="large">
                {trainers.map(trainer => (
                  <Option key={trainer.id} value={trainer.id}>{trainer.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="startDate"
              label="Start Date"
              rules={[{ required: true, message: 'Please select start date' }]}
            >
              <DatePicker className="w-full" size="large" />
            </Form.Item>
            
            <Form.Item
              name="endDate"
              label="End Date"
              rules={[{ required: true, message: 'Please select end date' }]}
            >
              <DatePicker className="w-full" size="large" />
            </Form.Item>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="location"
              label="Location"
              rules={[{ required: true, message: 'Please enter location' }]}
            >
              <Input placeholder="Enter location" size="large" />
            </Form.Item>
            
            <Form.Item
              name="maxParticipants"
              label="Maximum Participants"
            >
              <InputNumber min={1} placeholder="Enter maximum participants" size="large" className="w-full" />
            </Form.Item>
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="default" 
              className="mr-2"
              onClick={() => navigate('/trainings')}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={submitting}
              icon={<FiSave className="mr-1" />}
              className="bg-indigo-600 hover:bg-indigo-700 border-none"
            >
              Save Changes
            </Button>
          </div>
        </Form>
      </Card>
    </motion.div>
  );
};

export default EditTraining;