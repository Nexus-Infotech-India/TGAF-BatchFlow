import React, { useEffect, useState } from 'react';
import OverviewStats from '../../ui/dashboard/Overview';
import BatchTrends from '../../ui/dashboard/TrendData';
import ProductPerformance from '../../ui/dashboard/ProductStat';
import UserActivity from '../../ui/dashboard/UserActivity';
import QualityMetrics from '../../ui/dashboard/Qualitymetric';
import MonthlyBatchSummary from '../../ui/dashboard/BatchSummary';
import StandardUsageMetrics from '../../ui/dashboard/Standarddata';


const Dashboard: React.FC = () => {
  const [, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Authentication required');
      setIsLoading(false);
    }
  }, []);

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      
      <div className="dashboard-grid">
        <div className="dashboard-row">
          <OverviewStats />
        </div>
        
        <div className="dashboard-row">
          <BatchTrends />
        </div>
        
        <div className="dashboard-row">
          <div className="dashboard-col">
            <ProductPerformance />
          </div>
          <div className="dashboard-col">
            <UserActivity />
          </div>
        </div>
        
        <div className="dashboard-row">
          <QualityMetrics />
        </div>
        
        <div className="dashboard-row">
          <MonthlyBatchSummary />
        </div>
        
        <div className="dashboard-row">
          <StandardUsageMetrics />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;