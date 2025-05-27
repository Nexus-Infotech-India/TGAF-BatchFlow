import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Button,
  Table,
  Empty,
  message,
  Modal,
  Form,
  Select,
  Upload,
  Input,
  Avatar,
  Tag,
  Space,
  Card
} from 'antd';
import {
  FiUpload,
  FiDownload,
  FiTrash2,
  FiAlertCircle,
} from 'react-icons/fi';
import { UploadOutlined } from '@ant-design/icons';
import api from '../../../../utils/api';
import { API_ROUTES } from '../../../../utils/api';

const { TextArea } = Input;

interface TrainingDocumentsProps {
  training: any;
  onRefresh: () => void;
}

const TrainingDocuments: React.FC<TrainingDocumentsProps> = ({ training, onRefresh }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [form] = Form.useForm();
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [fileList, setFileList] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchSessions();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const response = await api.get(API_ROUTES.TRAINING.GET_TRAINING_DOCUMENTS(training.id), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      setDocuments(response.data.data || []);
    } catch (error) {
      message.error('Failed to fetch documents');
      console.error('Error fetching documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await api.get(API_ROUTES.TRAINING.GET_TRAINING_SESSIONS(training.id), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      setSessions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      message.error('Failed to fetch training sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleDocumentUpload = () => {
    form.resetFields();
    setFileList([]);
    setUploadModalVisible(true);
  };

  const handleDeleteDocument = (document: any) => {
    setSelectedDocument(document);
    setDeleteModalVisible(true);
  };

  const confirmDeleteDocument = async () => {
    if (!selectedDocument) return;
    
    try {
      setLoading(true);
      await api.delete(API_ROUTES.TRAINING.DELETE_DOCUMENT(selectedDocument.id), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      
      message.success('Document deleted successfully');
      setDocuments(documents.filter(d => d.id !== selectedDocument.id));
      setDeleteModalVisible(false);
      onRefresh();
    } catch (error) {
      message.error('Failed to delete document');
      console.error('Error deleting document:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitUploadDocument = async (values: any) => {
    if (fileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }
    
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description || '');
      formData.append('documentType', values.documentType);
      formData.append('file', fileList[0].originFileObj);
      
      if (values.sessionId) {
        formData.append('sessionId', values.sessionId);
      }
      
      await api.post(API_ROUTES.TRAINING.UPLOAD_DOCUMENT(training.id), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      message.success('Document uploaded successfully');
      setUploadModalVisible(false);
      fetchDocuments();
      onRefresh();
    } catch (error) {
      message.error('Failed to upload document');
      console.error('Error uploading document:', error);
    } finally {
      setLoading(false);
    }
  };

  const documentColumns = [
    {
      title: 'Document Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <span className="font-medium text-blue-600">{text}</span>
    },
    {
      title: 'Type',
      dataIndex: 'documentType',
      key: 'documentType',
      render: (type: string) => (
        <Tag color="blue">
          {type}
        </Tag>
      )
    },
    {
      title: 'Session',
      key: 'session',
      render: (record: any) => (
        record.sessionId ? (
          <Tag color="green">
            {sessions.find(s => s.id === record.sessionId)?.title || 'Session ' + record.sessionId}
          </Tag>
        ) : (
          <Tag color="default">General</Tag>
        )
      )
    },
    {
      title: 'Uploaded By',
      key: 'uploadedBy',
      render: (record: any) => (
        <div className="flex items-center">
          <Avatar 
            className="mr-2 bg-blue-500"
            size="small"
          >
            {record.uploadedBy?.name.charAt(0)}
          </Avatar>
          <span>{record.uploadedBy?.name}</span>
        </div>
      )
    },
    {
      title: 'Uploaded On',
      key: 'uploadedOn',
      render: (record: any) => (
        <span>{format(new Date(record.createdAt), 'MMM dd, yyyy')}</span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Button 
            type="text" 
            icon={<FiDownload className="text-blue-500" />} 
            onClick={() => window.open(record.fileUrl, '_blank')}
            className="border border-blue-200 hover:border-blue-500 hover:text-blue-500"
          />
          <Button 
            type="text" 
            icon={<FiTrash2 className="text-red-500" />} 
            onClick={() => handleDeleteDocument(record)}
            className="border border-red-200 hover:border-red-500 hover:text-red-500"
          />
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
        <h2 className="text-xl font-semibold text-blue-800">Training Documents</h2>
        <Button 
          type="primary"
          onClick={handleDocumentUpload}
          icon={<FiUpload className="mr-1" />}
          className="bg-blue-600 hover:bg-blue-700 border-none"
        >
          Upload Document
        </Button>
      </div>
      
      {loadingDocuments ? (
        <Card loading className="min-h-[200px]" />
      ) : documents.length > 0 ? (
        <Table
          columns={documentColumns}
          dataSource={documents}
          rowKey="id"
          loading={loading}
          rowClassName="hover:bg-blue-50 transition-colors"
        />
      ) : (
        <Empty 
          description={
            <span>
              No documents available
              <br />
              <span className="text-blue-600">Click "Upload Document" to add materials to this training</span>
            </span>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className="my-8"
        />
      )}

      {/* Upload Document Modal */}
      <Modal
        title="Upload Document"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={submitUploadDocument}
        >
          <Form.Item
            name="title"
            label="Document Title"
            rules={[{ required: true, message: 'Please enter a document title' }]}
          >
            <Input placeholder="Enter document title" />
          </Form.Item>

          <Form.Item
            name="sessionId"
            label="Associated Session (Optional)"
          >
            <Select 
              placeholder="Select a session (leave blank for general training document)" 
              loading={loadingSessions}
              allowClear
            >
              {sessions.map(session => (
                <Select.Option key={session.id} value={session.id}>
                  {session.title || `Session on ${format(new Date(session.date), 'MMM dd, yyyy')}`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="documentType"
            label="Document Type"
            rules={[{ required: true, message: 'Please select a document type' }]}
          >
            <Select placeholder="Select document type">
              <Select.Option value="COURSE_MATERIAL">Training Material</Select.Option>
              <Select.Option value="PRESENTATION">Presentation</Select.Option>
              <Select.Option value="AGENDA">Agenda</Select.Option>
              <Select.Option value="GUIDELINE">Guidelines</Select.Option>
              <Select.Option value="CERTIFICATE">Certificate</Select.Option>
              <Select.Option value="OTHER">Other</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter document description (optional)" />
          </Form.Item>

          <Form.Item
            name="file"
            label="Document File"
            rules={[{ required: true, message: 'Please select a file to upload' }]}
          >
            <Upload
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList }) => setFileList(fileList)}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setUploadModalVisible(false)}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              className="bg-blue-600 hover:bg-blue-700 border-none"
              disabled={fileList.length === 0}
            >
              Upload Document
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Delete Document Confirmation Modal */}
      <Modal
        title="Delete Document"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="delete" 
            danger 
            loading={loading}
            onClick={confirmDeleteDocument}
          >
            Delete
          </Button>
        ]}
      >
        <div className="flex items-start">
          <FiAlertCircle className="text-red-500 mr-3 text-lg mt-1" />
          <div>
            <p>Are you sure you want to delete this document?</p>
            {selectedDocument && (
              <p className="font-medium mt-2">{selectedDocument.title}</p>
            )}
            <p className="text-gray-500 mt-1">This action cannot be undone.</p>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default TrainingDocuments;