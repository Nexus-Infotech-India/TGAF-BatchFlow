import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Button,
  Table,
  Empty,
  message,
  Modal,
  Avatar,
  Badge,
  Card,
  Space,
  Input,
  Tooltip,
  Tag
} from 'antd';
import {
  FiUserPlus,
  FiMail,
  FiTrash2,
  FiAlertCircle,
  FiInfo,
  FiUserCheck,
  FiSearch
} from 'react-icons/fi';
import api from '../../../../utils/api';
import { API_ROUTES } from '../../../../utils/api';

interface TrainingParticipantsProps {
  training: any;
  onRefresh: () => void;
}

const TrainingParticipants: React.FC<TrainingParticipantsProps> = ({ training, onRefresh }) => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [loadingParticipants, setLoadingParticipants] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const authToken = localStorage.getItem('authToken') || '';
  const getConfig = () => ({
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });

  useEffect(() => {
    fetchParticipants();
  }, [authToken, training.id]);

  const fetchParticipants = async () => {
    try {
      setLoadingParticipants(true);
      const response = await api.get(
        API_ROUTES.TRAINING.GET_PARTICIPANTS(training.id), 
        getConfig()
      );
      setParticipants(response.data.data || []);
    } catch (error) {
      message.error('Failed to fetch participants');
      console.error('Error fetching participants:', error);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleAddParticipants = () => {
    setSelectedParticipants([]);
    setSearchValue('');
    setAddModalVisible(true);
  };

  const handleDeleteParticipant = (participant: any) => {
    setSelectedParticipant(participant);
    setDeleteModalVisible(true);
  };

  const confirmDeleteParticipant = async () => {
    if (!selectedParticipant) return;
    
    try {
      setLoading(true);
      
      await api.delete(
        API_ROUTES.TRAINING.REMOVE_PARTICIPANT(training.id, selectedParticipant.participantId),
        getConfig()
      );
      
      message.success('Participant removed successfully');
      fetchParticipants(); // Refresh the list
      setDeleteModalVisible(false);
      onRefresh();
    } catch (error) {
      message.error('Failed to remove participant');
      console.error('Error removing participant:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAddParticipants = async () => {
    if (selectedParticipants.length === 0) {
      message.warning('Please add at least one participant');
      return;
    }
    
    try {
      setLoading(true);
      
      // Send as-is to the backend - it will handle the parsing
      const payload = {
        participants: selectedParticipants
      };
      
      const response = await api.post(
        API_ROUTES.TRAINING.ADD_PARTICIPANTS(training.id), 
        payload,
        getConfig()
      );
      
      const { added, failed } = response.data.data;
      
      if (failed && failed.length > 0) {
        // Show warning for failed participants
        message.warning(`Added ${added} participants. ${failed.length} failed.`);
      } else {
        message.success(`Successfully added ${added} participants`);
      }
      
      setSelectedParticipants([]);
      setSearchValue('');
      setAddModalVisible(false);
      fetchParticipants();
      onRefresh();
    } catch (error) {
      message.error('Failed to add participants');
      console.error('Error adding participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (participantId: string) => {
    try {
      setLoading(true);
      await api.post(
        API_ROUTES.TRAINING.RESEND_PARTICIPANT_INVITE(training.id, participantId), 
        {},  // Empty body
        getConfig()
      );
      message.success('Invitation sent successfully');
      fetchParticipants();
    } catch (error) {
      message.error('Failed to send invitation');
      console.error('Error sending invitation:', error);
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = (value: string) => {
    if (!value || !value.trim()) return;
    
    // Add if it's not already in the list
    if (!selectedParticipants.includes(value)) {
      setSelectedParticipants([...selectedParticipants, value.trim()]);
      setSearchValue('');
    }
  };

  const removeSelectedParticipant = (participant: string) => {
    setSelectedParticipants(selectedParticipants.filter(p => p !== participant));
  };

  // Check if an email is already in the participants list
  const isEmailAlreadyAdded = (email: string) => {
    return participants.some(p => 
      p.participant && p.participant.email.toLowerCase() === email.toLowerCase()
    );
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue) {
      addParticipant(searchValue);
      e.preventDefault();
    }
  };

  const participantColumns = [
    {
      title: 'Participant',
      key: 'participant',
      render: (record: any) => {
        const name = record.participant?.name;
        const email = record.participant?.email;
        const organization = record.participant?.organization;
          
        return (
          <div className="flex items-center">
            <Avatar 
              className="mr-2 bg-blue-500"
              size="small"
            >
              {name?.charAt(0) || 'U'}
            </Avatar>
            <div>
              <div className="font-medium flex items-center">
                {name || 'Unknown'}
              </div>
              <div className="text-xs text-gray-500">{email}</div>
              {organization && (
                <div className="text-xs text-gray-400">{organization}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Invitation Status',
      key: 'status',
      render: (record: any) => {
        if (record.inviteAccepted) {
          return (
            <Badge 
              status="success" 
              text={
                <span className="flex items-center">
                  Accepted <FiUserCheck className="ml-1" />
                </span>
              }
            />
          );
        } else if (record.inviteSent) {
          return (
            <Badge 
              status="processing" 
              text={`Invited on ${new Date(record.inviteSentAt).toLocaleDateString()}`}
            />
          );
        } else {
          return <Badge status="warning" text="Not Invited" />;
        }
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space>
          {!record.inviteAccepted && (
            <Button 
              type="text" 
              icon={<FiMail className="text-blue-500" />} 
              onClick={() => sendInvitation(record.id)}
              loading={loading}
              className="border border-blue-200 hover:border-blue-500 hover:text-blue-500"
            >
              {record.inviteSent ? 'Resend' : 'Send Invite'}
            </Button>
          )}
          <Button 
            type="text" 
            icon={<FiTrash2 className="text-red-500" />} 
            onClick={() => handleDeleteParticipant(record)}
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
        <h2 className="text-xl font-semibold text-blue-800">Participants</h2>
        <Button 
          type="primary"
          onClick={handleAddParticipants}
          icon={<FiUserPlus className="mr-1" />}
          className="bg-blue-600 hover:bg-blue-700 border-none"
        >
          Add Participants
        </Button>
      </div>
      
      {loadingParticipants ? (
        <Card loading className="min-h-[200px]" />
      ) : participants.length > 0 ? (
        <Table
          columns={participantColumns}
          dataSource={participants}
          rowKey="id"
          loading={loading}
          rowClassName="hover:bg-blue-50 transition-colors"
        />
      ) : (
        <Empty 
          description={
            <span>
              No participants yet
              <br />
              <span className="text-blue-600">Click "Add Participants" to add people to this training</span>
            </span>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className="my-8"
        />
      )}

      {/* Add Participants Modal */}
      <Modal
        title="Add Participants"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Enter email addresses:
          </label>
          <div className="flex items-center">
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Enter an email address and press Enter"
              suffix={<FiSearch className="text-gray-400" />}
              onPressEnter={(e) => handleInputKeyPress(e)}
              allowClear
            />
            <Button 
              type="primary" 
              className="ml-2 bg-blue-500"
              onClick={() => addParticipant(searchValue)}
            >
              Add
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            You can add multiple participants by entering email addresses one at a time, or paste a list separated by commas or line breaks.
          </div>

          <div className="mt-4">
            <label className="block mb-2 font-medium">
              Selected Participants:
            </label>
            <div className="border rounded-md p-2 min-h-[100px]">
              {selectedParticipants.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedParticipants.map(participant => {
                    // Check if it's an email
                    
                    return (
                      <Tag 
                        key={participant}
                        closable
                        onClose={() => removeSelectedParticipant(participant)}
                        className="py-1 px-2"
                        color={isEmailAlreadyAdded(participant) ? 'orange' : 'blue'}
                      >
                        <span className="flex items-center">
                          {participant}
                          {isEmailAlreadyAdded(participant) && (
                            <Tooltip title="This email is already a participant">
                              <FiInfo className="ml-1 text-orange-500" />
                            </Tooltip>
                          )}
                        </span>
                      </Tag>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-400 flex justify-center items-center h-[80px]">
                  No participants selected yet
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={() => setAddModalVisible(false)}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            onClick={submitAddParticipants}
            loading={loading}
            disabled={selectedParticipants.length === 0}
            className="bg-blue-600 hover:bg-blue-700 border-none"
          >
            Add {selectedParticipants.length} Participant{selectedParticipants.length !== 1 ? 's' : ''}
          </Button>
        </div>

        {training.maxParticipants && (
          <div className="mt-4 flex items-start p-3 bg-blue-50 rounded-md">
            <FiInfo className="text-blue-500 mr-3 mt-1" />
            <div>
              <p>
                This training has a maximum capacity of <strong>{training.maxParticipants}</strong> participants.
                Currently <strong>{participants.length}</strong> of {training.maxParticipants} slots are filled.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Participant Confirmation Modal */}
      <Modal
        title="Remove Participant"
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
            onClick={confirmDeleteParticipant}
          >
            Remove
          </Button>
        ]}
      >
        <div className="flex items-start">
          <FiAlertCircle className="text-red-500 mr-3 text-lg mt-1" />
          <div>
            <p>Are you sure you want to remove this participant?</p>
            {selectedParticipant && selectedParticipant.participant && (
              <p className="font-medium mt-2">
                {selectedParticipant.participant.name} ({selectedParticipant.participant.email})
              </p>
            )}
            <p className="text-gray-500 mt-1">This will remove them from this training program.</p>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default TrainingParticipants;