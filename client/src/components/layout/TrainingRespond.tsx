import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Result, Spin, Card, Button, Typography, Divider, Layout } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, LoadingOutlined } from '@ant-design/icons';
import api, { API_ROUTES } from '../../utils/api';

const { Title, Paragraph, Text } = Typography;
const { Content } = Layout;

const TrainingRespond: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [responseData, setResponseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');
  const action = searchParams.get('action');

  useEffect(() => {
    const processToken = async () => {
      try {
        if (!token) {
          setError('No invitation token provided');
          setLoading(false);
          return;
        }

        const response = await api.get(
          API_ROUTES.TRAINING.HANDLE_INVITATION_RESPONSE,
          { 
            params: { token, action }
            
          }
        );
        
        setResponseData(response.data);
      } catch (err: any) {
        console.error('Error processing token:', err);
        setError(err.response?.data?.message || 'Error processing invitation response');
      } finally {
        setLoading(false);
      }
    };

    processToken();
  }, [token, action]);

  const isAccepting = action === 'accept';

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-4 md:p-8 flex items-center justify-center">
        {loading ? (
          <Card className="w-full max-w-md shadow-lg rounded-lg flex items-center justify-center p-8">
            <div className="text-center">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
              <Paragraph className="mt-4 text-gray-500">Processing your response...</Paragraph>
            </div>
          </Card>
        ) : error ? (
          <Card className="w-full max-w-md shadow-lg rounded-lg">
            <Result
              status="error"
              title="Unable to Process Invitation"
              subTitle={error}
              extra={[
                <Button type="primary" key="home" href="/">
                  Return to Home
                </Button>,
              ]}
            />
          </Card>
        ) : (
          <Card className="w-full max-w-md shadow-lg rounded-lg">
            <Result
              icon={isAccepting ? 
                <CheckCircleFilled className="text-green-500 text-6xl" /> : 
                <CloseCircleFilled className="text-red-500 text-6xl" />
              }
              title={isAccepting ? 
                "You've Successfully Accepted the Invitation" : 
                "You've Declined the Invitation"
              }
              subTitle={
                <div className="text-center mt-2">
                  {responseData?.training && (
                    <div className="mt-4 text-left bg-gray-50 p-4 rounded-lg">
                      <Title level={4} className="mb-3">{responseData.training.title}</Title>
                      <Divider className="my-3" />
                      {responseData.training.startDate && (
                        <Paragraph>
                          <Text strong>Date:</Text> {new Date(responseData.training.startDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Paragraph>
                      )}
                      {responseData.training.location && (
                        <Paragraph>
                          <Text strong>Location:</Text> {responseData.training.location}
                        </Paragraph>
                      )}
                      {responseData.training.trainer && (
                        <Paragraph>
                          <Text strong>Trainer:</Text> {responseData.training.trainer.name}
                        </Paragraph>
                      )}
                      {responseData.training.description && (
                        <div className="mt-3">
                          <Text strong>Description:</Text>
                          <Paragraph className="mt-1">{responseData.training.description}</Paragraph>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              }
              extra={
                <div className="text-center mt-4">
                  {isAccepting ? (
                    <Paragraph className="text-green-600">
                      Thank you for accepting! We look forward to seeing you at the training.
                      You will receive additional information as the date approaches.
                    </Paragraph>
                  ) : (
                    <Paragraph className="text-gray-600">
                      We understand that not all trainings fit your schedule.
                      Thank you for letting us know.
                    </Paragraph>
                  )}
                  <Button type="primary" className="mt-4">
                    <Link to="/">Return to Home</Link>
                  </Button>
                </div>
              }
            />
          </Card>
        )}
      </Content>
    </Layout>
  );
};

export default TrainingRespond;