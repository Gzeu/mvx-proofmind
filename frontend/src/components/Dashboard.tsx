import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Certificate,
  Users,
  TrendingUp,
  Shield,
  Clock,
  Award,
  Brain,
  BarChart3,
} from 'lucide-react';
import { CertificateData, DashboardStats, CategoryStats } from '@/types';
import blockchainService from '@/services/blockchain';

interface DashboardProps {
  userAddress?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userAddress }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCertificates: 0,
    verifiedCertificates: 0,
    pendingCertificates: 0,
    categoriesCount: 0,
    lastActivityDate: '',
  });
  const [categoryData, setCategoryData] = useState<CategoryStats[]>([]);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    loadDashboardData();
  }, [userAddress]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      if (userAddress) {
        // Load user certificates
        const userCerts = await blockchainService.getUserCertificates(userAddress);
        setCertificates(userCerts);
        
        // Calculate user stats
        const verifiedCount = userCerts.filter(cert => cert.verification_status === 'Verified').length;
        const pendingCount = userCerts.filter(cert => cert.verification_status === 'Pending').length;
        const categories = new Set(userCerts.map(cert => cert.category));
        
        setStats({
          totalCertificates: userCerts.length,
          verifiedCertificates: verifiedCount,
          pendingCertificates: pendingCount,
          categoriesCount: categories.size,
          lastActivityDate: userCerts.length > 0 ? 
            new Date(Math.max(...userCerts.map(cert => cert.timestamp * 1000))).toLocaleDateString() : 
            'No activity',
        });
        
        // Calculate category statistics
        const categoryStats: CategoryStats[] = Array.from(categories).map(category => {
          const count = userCerts.filter(cert => cert.category === category).length;
          return {
            category,
            count,
            percentage: Math.round((count / userCerts.length) * 100),
            trend: 'stable' as const,
          };
        });
        setCategoryData(categoryStats);
      } else {
        // Load global stats
        const totalCerts = await blockchainService.getTotalCertificates();
        setStats(prev => ({ ...prev, totalCertificates: totalCerts }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    change?: string;
  }> = ({ title, value, icon, color, change }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="inline w-3 h-3 mr-1" />
              {change}
            </p>
          )}
        </div>
        <div className="text-2xl" style={{ color }}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Brain className="mr-3 text-primary-600" />
          MVX-ProofMind Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          {userAddress ? 
            `Personal certificate overview for ${userAddress.slice(0, 8)}...${userAddress.slice(-8)}` :
            'Global AI-powered blockchain certification analytics'
          }
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Certificates"
          value={stats.totalCertificates}
          icon={<Certificate />}
          color="#3b82f6"
          change="+12% this month"
        />
        <StatCard
          title="Verified"
          value={stats.verifiedCertificates}
          icon={<Shield />}
          color="#10b981"
          change="+8% this week"
        />
        <StatCard
          title="Pending"
          value={stats.pendingCertificates}
          icon={<Clock />}
          color="#f59e0b"
        />
        <StatCard
          title="Categories"
          value={stats.categoriesCount}
          icon={<Award />}
          color="#8b5cf6"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BarChart3 className="mr-2 text-primary-600" />
              Category Distribution
            </h2>
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <Certificate className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>No certificates to display</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Clock className="mr-2 text-primary-600" />
              Recent Certificates
            </h2>
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {certificates.slice(0, 5).map((cert, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Certificate className="w-5 h-5 text-primary-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {cert.proof_id}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {cert.category} • {new Date(cert.timestamp * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    cert.verification_status === 'Verified' 
                      ? 'bg-green-100 text-green-800'
                      : cert.verification_status === 'Pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {cert.verification_status}
                  </span>
                </div>
              </div>
            ))}
            {certificates.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Clock className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Brain className="mr-2 text-primary-600" />
            AI Insights & Predictions
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">85%</div>
            <div className="text-sm text-gray-600 mt-1">Verification Accuracy</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">+23%</div>
            <div className="text-sm text-gray-600 mt-1">Growth Prediction</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">0.02%</div>
            <div className="text-sm text-gray-600 mt-1">Anomaly Rate</div>
          </div>
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">AI Recommendations</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Consider adding more professional certificates to increase credibility</li>
            <li>• Peak activity detected on weekends - optimal time for new certificates</li>
            <li>• Education category shows highest verification rates (94%)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;