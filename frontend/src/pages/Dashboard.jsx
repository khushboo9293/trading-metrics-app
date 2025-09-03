import { useState, useEffect } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Card, Select, Statistic, Row, Col, Spin, Typography, Space, Tag, Progress, Modal, Divider } from 'antd';
import { 
  TrophyOutlined, 
  DollarOutlined, 
  PercentageOutlined, 
  BarChartOutlined, 
  SafetyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RiseOutlined,
  FallOutlined 
} from '@ant-design/icons';
import api from '../services/api';

const { Title: AntTitle, Text, Paragraph } = Typography;

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('current-month');
  
  // Get current month names for dropdown
  const currentDate = new Date();
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
  const lastMonthName = lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const twoMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2);
  const twoMonthsAgoName = twoMonthsAgo.toLocaleString('default', { month: 'long', year: 'numeric' });
  const [pnlModalVisible, setPnlModalVisible] = useState(false);
  const [winRateModalVisible, setWinRateModalVisible] = useState(false);
  const [rMultipleModalVisible, setRMultipleModalVisible] = useState(false);
  const [weeklyRMultipleData, setWeeklyRMultipleData] = useState([]);
  const [weeklyRMultipleVisible, setWeeklyRMultipleVisible] = useState(false);
  const [planFollowModalVisible, setPlanFollowModalVisible] = useState(false);
  const [deviationData, setDeviationData] = useState({ totalDeviationTrades: 0, topDeviations: [] });

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, trendRes] = await Promise.all([
        api.get(`/metrics/summary?period=${period}`),
        api.get(`/metrics/performance-trend?period=${period}`)
      ]);
      setSummary(summaryRes.data);
      setTrend(trendRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyRMultipleData = async () => {
    try {
      const response = await api.get('/metrics/weekly-r-multiple');
      setWeeklyRMultipleData(response.data);
      setWeeklyRMultipleVisible(true);
    } catch (error) {
      console.error('Error fetching weekly R-Multiple data:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!summary) {
    return <div>No data available</div>;
  }

  const equityChartData = {
    labels: trend.map(t => new Date(t.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Cumulative P&L',
        data: trend.map(t => t.cumulativePnl),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.1
      }
    ]
  };

  const rMultipleChartData = {
    labels: trend.map(t => new Date(t.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Winners R-Multiple',
        data: trend.map(t => t.winnersRMultiple || 0),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointRadius: 3,
        pointBackgroundColor: 'rgb(34, 197, 94)'
      },
      {
        label: 'Losers R-Multiple',
        data: trend.map(t => t.losersRMultiple || 0),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointRadius: 3,
        pointBackgroundColor: 'rgb(239, 68, 68)'
      }
    ]
  };

  // Color function for Plan Follow Rate
  const getPlanFollowColor = (rate) => {
    if (rate >= 80) return '#00ff88';
    if (rate >= 50) return '#ffaa00';
    return '#ff4757';
  };

  const getPlanFollowText = (rate) => {
    if (rate >= 80) return 'Excellent discipline';
    if (rate >= 50) return 'Good, but can improve';
    return 'Need more discipline';
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row justify="space-between" align="middle">
        <AntTitle level={2} style={{ margin: 0 }}>Trading Performance</AntTitle>
        <Space>
          <Text type="secondary">Period:</Text>
          <Select
            value={period}
            onChange={(value) => setPeriod(value)}
            style={{ width: 150 }}
            size="large"
          >
            <Select.Option value="today">Today</Select.Option>
            <Select.Option value="15">Last 15 days</Select.Option>
            <Select.Option value="current-month">{currentMonthName}</Select.Option>
            <Select.Option value="last-month">{lastMonthName}</Select.Option>
            <Select.Option value="two-months-ago">{twoMonthsAgoName}</Select.Option>
          </Select>
        </Space>
      </Row>

      {/* Main Behavioral Metrics */}
      <Row gutter={[16, 16]}>
        {/* Plan Follow Rate - First Priority */}
        <Col xs={24} sm={12} md={8} lg={8}>
          <Card 
            hoverable
            onClick={async () => {
              try {
                const response = await api.get('/metrics/plan-deviation-analysis');
                setDeviationData(response.data);
                setPlanFollowModalVisible(true);
              } catch (error) {
                console.error('Error fetching deviation data:', error);
                setPlanFollowModalVisible(true); // Still show modal even if deviation data fails
              }
            }}
            style={{ 
              height: '100%', 
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Plan Follow Rate</Text>
              <Progress
                type="circle"
                percent={summary.planFollowRate}
                strokeColor={getPlanFollowColor(summary.planFollowRate)}
                format={(percent) => `${percent.toFixed(0)}%`}
                width={window.innerWidth < 768 ? 80 : 120}
                strokeWidth={window.innerWidth < 768 ? 8 : 6}
              />
              <div style={{ marginTop: '8px' }}>
                <Text 
                  style={{ 
                    fontSize: '12px', 
                    color: getPlanFollowColor(summary.planFollowRate) 
                  }}
                >
                  {getPlanFollowText(summary.planFollowRate)}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {summary.tradesWithPlanFollowed}/{summary.totalTrades} trades
                </Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* R-Multiple - Second Priority */}
        <Col xs={24} sm={12} md={8} lg={8}>
          <Card 
            hoverable 
            onClick={fetchWeeklyRMultipleData}
            style={{ 
              cursor: 'pointer', 
              height: '100%',
              transition: 'all 0.2s ease',
              border: '1px solid #3a3a3a'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ff006b';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 0, 107, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#3a3a3a';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ pointerEvents: 'none' }}>
              <Statistic
                title="Avg R-Multiple"
                value={summary.avgRMultiple || 'N/A'}
                precision={summary.avgRMultiple ? 2 : 0}
                suffix={summary.avgRMultiple ? "R" : ""}
                prefix={<TrophyOutlined />}
                valueStyle={{
                  color: summary.avgRMultiple >= 0 ? '#00ff88' : '#ff4757',
                  fontSize: window.innerWidth < 768 ? '20px' : '28px'
                }}
              />
              <Space direction="vertical" size="small" style={{ width: '100%', marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    <CheckCircleOutlined style={{ color: '#00ff88' }} /> Winners
                  </Text>
                  <Text style={{ fontSize: '12px', color: '#00ff88' }}>
                    {summary.avgRMultipleWinning.toFixed(2)}R
                  </Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    <CloseCircleOutlined style={{ color: '#ff4757' }} /> Losers
                  </Text>
                  <Text style={{ fontSize: '12px', color: '#ff4757' }}>
                    {summary.avgRMultipleLosing.toFixed(2)}R
                  </Text>
                </div>
              </Space>
            </div>
          </Card>
        </Col>

        {/* Win Rate - Third Priority */}
        <Col xs={24} sm={12} md={8} lg={8}>
          <Card 
            hoverable 
            onClick={() => setWinRateModalVisible(true)}
            style={{ 
              cursor: 'pointer', 
              height: '100%',
              transition: 'all 0.2s ease',
              border: '1px solid #3a3a3a'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ff006b';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 0, 107, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#3a3a3a';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
              <Text type="secondary">Win Rate</Text>
              <Progress
                type="circle"
                percent={summary.winRate}
                strokeColor={{
                  '0%': '#ff4757',
                  '100%': '#00ff88'
                }}
                format={(percent) => `${percent.toFixed(1)}%`}
                width={window.innerWidth < 768 ? 80 : 120}
                strokeWidth={window.innerWidth < 768 ? 8 : 6}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {summary.winningTrades}W / {summary.losingTrades}L
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Secondary Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card>
            <Statistic
              title="Stop Loss Usage"
              value={summary.stopLossUsageRate || 0}
              precision={1}
              suffix="%"
              prefix={<SafetyOutlined />}
              valueStyle={{ 
                color: summary.stopLossUsageRate >= 80 ? '#00ff88' : 
                       summary.stopLossUsageRate >= 50 ? '#ffaa00' : '#ff4757',
                fontSize: window.innerWidth < 768 ? '20px' : '24px'
              }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card>
            <Statistic
              title="Current Win Streak"
              value={summary.streaks?.currentWinStreak || 0}
              suffix="trades"
              valueStyle={{ 
                color: '#00ff88',
                fontSize: window.innerWidth < 768 ? '20px' : '24px'
              }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card>
            <Statistic
              title="Max Drawdown"
              value={summary.maxDrawdown}
              prefix="₹"
              valueStyle={{ 
                color: '#ff4757',
                fontSize: window.innerWidth < 768 ? '20px' : '24px'
              }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card>
            <Statistic
              title="Total Trades"
              value={summary.totalTrades}
              prefix={<BarChartOutlined />}
              valueStyle={{
                fontSize: window.innerWidth < 768 ? '20px' : '24px'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="Equity Curve"
            hoverable
            onClick={() => setPnlModalVisible(true)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ height: window.innerWidth < 768 ? '250px' : '300px', pointerEvents: 'none' }}>
              <Line 
                data={equityChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: window.innerWidth >= 768
                    },
                    tooltip: {
                      callbacks: {
                        afterBody: () => ['Click for detailed P&L analysis']
                      }
                    }
                  },
                  scales: {
                    x: {
                      ticks: {
                        maxTicksLimit: window.innerWidth < 768 ? 4 : 8
                      }
                    }
                  }
                }} 
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Winners vs Losers R-Multiple">
            <div style={{ height: window.innerWidth < 768 ? '250px' : '300px' }}>
              <Line 
                data={rMultipleChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index',
                    intersect: false
                  },
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        boxWidth: 6
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const value = context.parsed.y;
                          const label = context.dataset.label;
                          return `${label}: ${value >= 0 ? '+' : ''}${value.toFixed(2)}R`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      grid: {
                        color: (context) => {
                          if (context.tick.value === 0) {
                            return 'rgba(255, 255, 255, 0.3)';
                          }
                          return 'rgba(255, 255, 255, 0.1)';
                        }
                      },
                      ticks: {
                        callback: (value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}R`
                      }
                    },
                    x: {
                      ticks: {
                        maxTicksLimit: window.innerWidth < 768 ? 4 : 8
                      }
                    }
                  }
                }} 
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* P&L Details Modal */}
      <Modal
        title="P&L Breakdown"
        visible={pnlModalVisible}
        onCancel={() => setPnlModalVisible(false)}
        footer={null}
        width={window.innerWidth < 768 ? '95vw' : 600}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card style={{ backgroundColor: '#1a3d1a' }}>
                <Statistic
                  title="Total Profit"
                  value={summary.totalProfit}
                  precision={2}
                  prefix="₹"
                  valueStyle={{ color: '#00ff88' }}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  From {summary.winningTrades} winning trades
                </Text>
              </Card>
            </Col>
            <Col span={12}>
              <Card style={{ backgroundColor: '#3d1a1a' }}>
                <Statistic
                  title="Total Loss"
                  value={summary.totalLoss}
                  precision={2}
                  prefix="₹"
                  valueStyle={{ color: '#ff4757' }}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  From {summary.losingTrades} losing trades
                </Text>
              </Card>
            </Col>
          </Row>
          
          <Divider />
          
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Statistic
                title="Net P&L"
                value={summary.totalPnl}
                precision={2}
                prefix="₹"
                valueStyle={{ 
                  color: summary.totalPnl >= 0 ? '#00ff88' : '#ff4757'
                }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Profit Factor"
                value={summary.totalLoss > 0 ? (summary.totalProfit / summary.totalLoss).toFixed(2) : 'N/A'}
                valueStyle={{ 
                  color: summary.totalProfit / summary.totalLoss >= 1 ? '#00ff88' : '#ff4757'
                }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Avg Trade P&L"
                value={summary.totalTrades > 0 ? (summary.totalPnl / summary.totalTrades).toFixed(2) : 0}
                prefix="₹"
                valueStyle={{ 
                  color: (summary.totalPnl / summary.totalTrades) >= 0 ? '#00ff88' : '#ff4757'
                }}
              />
            </Col>
          </Row>

          <Divider />

          <div>
            <Text strong>Performance Insights:</Text>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              {summary.totalProfit / summary.totalLoss >= 2 && (
                <li style={{ color: '#00ff88' }}>Excellent profit factor! Your winners significantly outweigh losers.</li>
              )}
              {summary.totalProfit / summary.totalLoss >= 1 && summary.totalProfit / summary.totalLoss < 2 && (
                <li style={{ color: '#ffaa00' }}>Good profit factor. Aim for 2:1 or better.</li>
              )}
              {summary.totalProfit / summary.totalLoss < 1 && (
                <li style={{ color: '#ff4757' }}>Losses exceed profits. Review your entry/exit strategy.</li>
              )}
              {summary.winRate >= 50 && (
                <li style={{ color: '#00ff88' }}>Win rate above 50% - maintain this consistency.</li>
              )}
              {summary.winRate < 50 && summary.avgRMultiple > 2 && (
                <li style={{ color: '#ffaa00' }}>Low win rate compensated by good R-multiple.</li>
              )}
            </ul>
          </div>
        </Space>
      </Modal>

      {/* Win Rate Details Modal */}
      <Modal
        title="Win Rate Analysis"
        visible={winRateModalVisible}
        onCancel={() => setWinRateModalVisible(false)}
        footer={null}
        width={window.innerWidth < 768 ? '95vw' : 600}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Progress
              type="dashboard"
              percent={summary.winRate}
              strokeColor={{
                '0%': '#ff4757',
                '100%': '#00ff88'
              }}
              format={(percent) => (
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{percent.toFixed(1)}%</div>
                  <div style={{ fontSize: '14px', color: '#999' }}>Win Rate</div>
                </div>
              )}
              width={200}
            />
          </div>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card style={{ backgroundColor: '#1a3d1a' }}>
                <Statistic
                  title="Winning Trades"
                  value={summary.winningTrades}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#00ff88' }}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Avg Win: ₹{summary.winningTrades > 0 ? (summary.totalProfit / summary.winningTrades).toFixed(2) : 0}
                </Text>
              </Card>
            </Col>
            <Col span={12}>
              <Card style={{ backgroundColor: '#3d1a1a' }}>
                <Statistic
                  title="Losing Trades"
                  value={summary.losingTrades}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: '#ff4757' }}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Avg Loss: ₹{summary.losingTrades > 0 ? (summary.totalLoss / summary.losingTrades).toFixed(2) : 0}
                </Text>
              </Card>
            </Col>
          </Row>

          <Divider />

          <div>
            <Text strong>Win Rate Insights:</Text>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              {summary.winRate >= 60 && (
                <li style={{ color: '#00ff88' }}>Excellent win rate! Focus on maintaining consistency.</li>
              )}
              {summary.winRate >= 40 && summary.winRate < 60 && (
                <li style={{ color: '#ffaa00' }}>Decent win rate. Ensure your winners are bigger than losers.</li>
              )}
              {summary.winRate < 40 && (
                <li style={{ color: '#ff4757' }}>Low win rate. Review your entry criteria and setups.</li>
              )}
              {summary.streaks?.currentWinStreak >= 3 && (
                <li style={{ color: '#00ff88' }}>You're on a {summary.streaks.currentWinStreak}-trade win streak!</li>
              )}
            </ul>
          </div>

          <Divider />

          <div>
            <Text strong>Expectancy per Trade:</Text>
            <div style={{ marginTop: '8px', fontSize: '18px', fontWeight: 'bold' }}>
              ₹{((summary.winRate/100 * (summary.totalProfit/summary.winningTrades || 0)) - 
                 ((1-summary.winRate/100) * (summary.totalLoss/summary.losingTrades || 0))).toFixed(2)}
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              This is your mathematical edge per trade
            </Text>
          </div>
        </Space>
      </Modal>

      {/* R-Multiple Analysis Modal */}
      <Modal
        title="Risk Management Analysis"
        visible={rMultipleModalVisible}
        onCancel={() => setRMultipleModalVisible(false)}
        footer={null}
        width={window.innerWidth < 768 ? '95vw' : 700}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header with overall R-Multiple */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>
              <span style={{ color: summary.avgRMultiple >= 0 ? '#00ff88' : '#ff4757' }}>
                {summary.avgRMultiple ? summary.avgRMultiple.toFixed(2) : 'N/A'}R
              </span>
            </div>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Average Risk-Reward Ratio
            </Text>
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Based on {summary.tradesWithStopLoss} trades with stop loss out of {summary.totalTrades} total trades
              </Text>
            </div>
          </div>

          <Divider />

          {/* Winners vs Losers R-Multiple */}
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card style={{ backgroundColor: '#1a3d1a', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00ff88', marginBottom: '8px' }}>
                  {summary.avgRMultipleWinning?.toFixed(2) || 'N/A'}R
                </div>
                <Text style={{ color: '#cccccc' }}>Average Winners</Text>
                <div style={{ marginTop: '8px' }}>
                  <CheckCircleOutlined style={{ color: '#00ff88', fontSize: '16px' }} />
                  <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                    Winning trades with stop loss
                  </Text>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card style={{ backgroundColor: '#3d1a1a', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff4757', marginBottom: '8px' }}>
                  {summary.avgRMultipleLosing?.toFixed(2) || 'N/A'}R
                </div>
                <Text style={{ color: '#cccccc' }}>Average Losers</Text>
                <div style={{ marginTop: '8px' }}>
                  <CloseCircleOutlined style={{ color: '#ff4757', fontSize: '16px' }} />
                  <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                    Losing trades with stop loss
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          <Divider />

          {/* Risk Management Metrics */}
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card style={{ textAlign: 'center' }}>
                <Statistic
                  title="Stop Loss Usage"
                  value={summary.stopLossUsageRate || 0}
                  precision={1}
                  suffix="%"
                  valueStyle={{ 
                    color: summary.stopLossUsageRate >= 80 ? '#00ff88' : 
                           summary.stopLossUsageRate >= 50 ? '#ffaa00' : '#ff4757'
                  }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{ textAlign: 'center' }}>
                <Statistic
                  title="Risk-Reward Ratio"
                  value={summary.avgRMultipleWinning && summary.avgRMultipleLosing ? 
                    Math.abs(summary.avgRMultipleWinning / summary.avgRMultipleLosing).toFixed(2) : 'N/A'}
                  suffix=":1"
                  valueStyle={{ 
                    color: (summary.avgRMultipleWinning / Math.abs(summary.avgRMultipleLosing)) >= 2 ? '#00ff88' : '#ffaa00'
                  }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{ textAlign: 'center' }}>
                <Statistic
                  title="Max Risk Per Trade"
                  value={summary.avgRMultiple ? `${Math.abs(summary.avgRMultipleLosing || 1).toFixed(1)}R` : 'N/A'}
                  valueStyle={{ color: '#ff4757' }}
                />
              </Card>
            </Col>
          </Row>

          <Divider />

          {/* Risk Management Insights */}
          <div>
            <Text strong style={{ fontSize: '16px' }}>Risk Management Assessment:</Text>
            <ul style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: '1.6' }}>
              {/* R-Multiple Analysis */}
              {summary.avgRMultiple >= 1.5 && (
                <li style={{ color: '#00ff88', marginBottom: '8px' }}>
                  <strong>Excellent Risk Management!</strong> Your average R-Multiple of {summary.avgRMultiple.toFixed(2)}R shows you're letting winners run.
                </li>
              )}
              {summary.avgRMultiple >= 0.5 && summary.avgRMultiple < 1.5 && (
                <li style={{ color: '#ffaa00', marginBottom: '8px' }}>
                  <strong>Good but room for improvement.</strong> Try to let winners run longer or cut losses earlier.
                </li>
              )}
              {summary.avgRMultiple < 0.5 && summary.avgRMultiple >= 0 && (
                <li style={{ color: '#ff4757', marginBottom: '8px' }}>
                  <strong>Poor Risk Management.</strong> You're cutting winners short and letting losses run.
                </li>
              )}

              {/* Stop Loss Usage */}
              {summary.stopLossUsageRate < 80 && (
                <li style={{ color: '#ff4757', marginBottom: '8px' }}>
                  <strong>Increase Stop Loss Usage:</strong> Only {summary.stopLossUsageRate?.toFixed(1)}% of your trades have stop losses. Consider using stops on more trades.
                </li>
              )}
              {summary.stopLossUsageRate >= 80 && (
                <li style={{ color: '#00ff88', marginBottom: '8px' }}>
                  <strong>Great Risk Discipline:</strong> {summary.stopLossUsageRate?.toFixed(1)}% of your trades have defined stop losses.
                </li>
              )}

              {/* Winner vs Loser Analysis */}
              {summary.avgRMultipleWinning > 2 && (
                <li style={{ color: '#00ff88', marginBottom: '8px' }}>
                  <strong>Excellent at letting winners run:</strong> Your winning trades average {summary.avgRMultipleWinning.toFixed(2)}R.
                </li>
              )}
              {Math.abs(summary.avgRMultipleLosing) < 1 && (
                <li style={{ color: '#00ff88', marginBottom: '8px' }}>
                  <strong>Good at cutting losses:</strong> Your losing trades average {summary.avgRMultipleLosing.toFixed(2)}R - you're keeping losses manageable.
                </li>
              )}
              {Math.abs(summary.avgRMultipleLosing) > 1 && (
                <li style={{ color: '#ff4757', marginBottom: '8px' }}>
                  <strong>Work on cutting losses:</strong> Your losing trades average {summary.avgRMultipleLosing.toFixed(2)}R - losses are running beyond your stops.
                </li>
              )}
            </ul>
          </div>

          <Divider />

          {/* R-Multiple Education */}
          <div>
            <Text strong style={{ fontSize: '16px' }}>What is R-Multiple?</Text>
            <div style={{ marginTop: '12px', padding: '16px', backgroundColor: '#2d2d2d', borderRadius: '8px' }}>
              <Text style={{ lineHeight: '1.6' }}>
                <strong>R-Multiple</strong> measures your profit/loss relative to your initial risk (stop loss distance).
              </Text>
              <div style={{ marginTop: '12px' }}>
                <Text style={{ fontSize: '14px', color: '#cccccc' }}>
                  <strong>Formula:</strong> R = (Exit Price - Entry Price) ÷ (Entry Price - Stop Loss) × Position Size
                </Text>
              </div>
              <ul style={{ marginTop: '12px', paddingLeft: '20px', color: '#cccccc' }}>
                <li><strong>+2R:</strong> You made 2x your initial risk</li>
                <li><strong>+1R:</strong> You made exactly what you risked</li>
                <li><strong>-1R:</strong> You lost exactly what you planned to risk</li>
                <li><strong>-2R:</strong> You lost 2x what you planned to risk (bad!)</li>
              </ul>
              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#1a3d1a', borderRadius: '6px' }}>
                <Text style={{ fontSize: '13px', color: '#00ff88' }}>
                  <strong>Professional Target:</strong> Average R-Multiple above +1.0R with consistent stop loss usage
                </Text>
              </div>
            </div>
          </div>
        </Space>
      </Modal>

      {/* Enhanced Common Mistakes Analysis */}
      {summary.mistakePatterns && summary.mistakePatterns.length > 0 && (
        <Card 
          title={
            <Space>
              <span style={{ fontSize: '20px' }}>🚨</span>
              <Text strong style={{ fontSize: '18px', color: '#ffffff' }}>
                Common Mistakes Analysis
              </Text>
              <Tag color="volcano" style={{ marginLeft: '8px' }}>
                {summary.mistakePatterns.reduce((sum, m) => sum + m.frequency, 0)} Total Mistakes
              </Tag>
            </Space>
          }
          style={{ 
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1b1b 100%)',
            border: '1px solid #ff4757'
          }}
        >
          {/* Modern Card Grid Layout */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            {summary.mistakePatterns.slice(0, 6).map((mistake, index) => {
              const getGradientColors = (avgPnl, frequency) => {
                if (avgPnl < -2000) return { from: '#ff1744', to: '#d50000', border: '#ff1744' }; // Very costly
                if (avgPnl < -1000) return { from: '#ff4757', to: '#ff1744', border: '#ff4757' }; // Costly
                if (avgPnl < -500) return { from: '#ff6b35', to: '#ff4757', border: '#ff6b35' }; // Moderate
                if (avgPnl < 0) return { from: '#ffa726', to: '#ff6b35', border: '#ffa726' }; // Minor
                return { from: '#ffcc02', to: '#ffa726', border: '#ffcc02' }; // Neutral/positive
              };

              const getIcon = (mistake) => {
                const m = mistake.toLowerCase();
                if (m.includes('fear') || m.includes('panic') || m.includes('anxious')) return '😰';
                if (m.includes('greed') || m.includes('fomo')) return '🤑';
                if (m.includes('stop') || m.includes('risk')) return '⚠️';
                if (m.includes('exit') || m.includes('early')) return '🏃‍♂️';
                if (m.includes('entry') || m.includes('timing')) return '🎯';
                if (m.includes('plan') || m.includes('ignore')) return '📋';
                if (m.includes('position') || m.includes('size')) return '📏';
                return '🔴';
              };

              const colors = getGradientColors(mistake.avgPnl, mistake.frequency);
              const severity = mistake.avgPnl < -1000 ? 'HIGH' : mistake.avgPnl < -500 ? 'MEDIUM' : 'LOW';
              const severityColor = severity === 'HIGH' ? '#ff1744' : severity === 'MEDIUM' ? '#ff6b35' : '#ffa726';

              return (
                <Col xs={24} sm={12} md={8} lg={6} xl={4} key={index}>
                  <Card
                    size="small"
                    hoverable
                    style={{
                      background: `linear-gradient(135deg, ${colors.from}15 0%, ${colors.to}25 100%)`,
                      border: `2px solid ${colors.border}`,
                      borderRadius: '12px',
                      height: '100%',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = `0 8px 25px ${colors.border}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0px)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ textAlign: 'center', padding: '8px' }}>
                      {/* Severity Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <Tag 
                          color={severity === 'HIGH' ? 'red' : severity === 'MEDIUM' ? 'orange' : 'yellow'}
                          style={{ fontSize: '10px', margin: 0 }}
                        >
                          {severity}
                        </Tag>
                        <Text style={{ fontSize: '12px', color: '#999' }}>
                          #{index + 1}
                        </Text>
                      </div>

                      {/* Mistake Icon */}
                      <div style={{ 
                        fontSize: '32px', 
                        marginBottom: '12px',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                      }}>
                        {getIcon(mistake.mistake)}
                      </div>

                      {/* Mistake Name */}
                      <Text 
                        strong 
                        style={{ 
                          fontSize: '13px', 
                          color: '#ffffff', 
                          textTransform: 'capitalize',
                          display: 'block',
                          marginBottom: '8px',
                          minHeight: '32px'
                        }}
                      >
                        {mistake.mistake}
                      </Text>

                      {/* Frequency Display */}
                      <div style={{ 
                        background: `linear-gradient(45deg, ${colors.border}30, ${colors.border}50)`,
                        borderRadius: '8px',
                        padding: '8px',
                        marginBottom: '8px'
                      }}>
                        <Text style={{ fontSize: '20px', fontWeight: 'bold', color: colors.border }}>
                          {mistake.frequency}
                        </Text>
                        <Text style={{ fontSize: '12px', color: '#cccccc', display: 'block' }}>
                          occurrences
                        </Text>
                      </div>

                      {/* P&L Impact */}
                      <div style={{ 
                        padding: '6px',
                        borderRadius: '6px',
                        background: mistake.avgPnl < 0 ? '#ff475710' : '#ffaa0010'
                      }}>
                        <Text style={{ 
                          fontSize: '12px', 
                          color: mistake.avgPnl < 0 ? '#ff4757' : '#ffaa00',
                          fontWeight: 'bold'
                        }}>
                          ₹{mistake.avgPnl.toFixed(0)} avg impact
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* Summary Statistics */}
          <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
            <Col span={6}>
              <div style={{ 
                textAlign: 'center', 
                padding: '16px', 
                background: 'linear-gradient(135deg, #ff4757 0%, #ff1744 100%)', 
                borderRadius: '12px',
                color: 'white'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🔥</div>
                <Text style={{ color: 'white', fontSize: '11px' }}>MOST FREQUENT</Text>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
                  {summary.mistakePatterns[0]?.mistake}
                </div>
                <Text style={{ color: '#ffcccc', fontSize: '11px' }}>
                  {summary.mistakePatterns[0]?.frequency} times
                </Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ 
                textAlign: 'center', 
                padding: '16px', 
                background: 'linear-gradient(135deg, #ff1744 0%, #b71c1c 100%)', 
                borderRadius: '12px',
                color: 'white'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>💸</div>
                <Text style={{ color: 'white', fontSize: '11px' }}>MOST COSTLY</Text>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
                  {summary.mistakePatterns.reduce((min, m) => m.avgPnl < min.avgPnl ? m : min, summary.mistakePatterns[0])?.mistake}
                </div>
                <Text style={{ color: '#ffcccc', fontSize: '11px' }}>
                  ₹{summary.mistakePatterns.reduce((min, m) => m.avgPnl < min.avgPnl ? m : min, summary.mistakePatterns[0])?.avgPnl.toFixed(0)} avg
                </Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ 
                textAlign: 'center', 
                padding: '16px', 
                background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)', 
                borderRadius: '12px',
                color: 'white'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>📊</div>
                <Text style={{ color: 'white', fontSize: '11px' }}>TOTAL MISTAKES</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>
                  {summary.mistakePatterns.reduce((sum, m) => sum + m.frequency, 0)}
                </div>
                <Text style={{ color: '#bbdefb', fontSize: '11px' }}>
                  across {summary.totalTrades} trades
                </Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ 
                textAlign: 'center', 
                padding: '16px', 
                background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)', 
                borderRadius: '12px',
                color: 'white'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>📉</div>
                <Text style={{ color: 'white', fontSize: '11px' }}>TOTAL IMPACT</Text>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
                  ₹{summary.mistakePatterns.reduce((sum, m) => sum + (m.avgPnl * m.frequency), 0).toFixed(0)}
                </div>
                <Text style={{ color: '#e1bee7', fontSize: '11px' }}>
                  cumulative loss
                </Text>
              </div>
            </Col>
          </Row>

          {/* Interactive Chart with Modern Styling */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text strong style={{ fontSize: '16px', color: '#ffffff' }}>
                📈 Frequency & Impact Analysis
              </Text>
              <Tag color="processing">
                Hover bars for details
              </Tag>
            </div>
            <div style={{ 
              height: window.innerWidth < 768 ? '300px' : Math.max(300, summary.mistakePatterns.length * 60) + 'px',
              padding: '16px',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
              borderRadius: '12px',
              border: '1px solid #3a3a3a'
            }}>
              <Bar
                data={{
                  labels: summary.mistakePatterns.map(m => m.mistake),
                  datasets: [
                    {
                      label: 'Frequency',
                      data: summary.mistakePatterns.map(m => m.frequency),
                      backgroundColor: summary.mistakePatterns.map((m, i) => {
                        const severity = m.avgPnl < -1000 ? 'high' : m.avgPnl < -500 ? 'medium' : 'low';
                        return severity === 'high' ? '#ff475780' : 
                               severity === 'medium' ? '#ff6b3580' : '#ffa72680';
                      }),
                      borderColor: summary.mistakePatterns.map((m, i) => {
                        const severity = m.avgPnl < -1000 ? 'high' : m.avgPnl < -500 ? 'medium' : 'low';
                        return severity === 'high' ? '#ff4757' : 
                               severity === 'medium' ? '#ff6b35' : '#ffa726';
                      }),
                      borderWidth: 3,
                      borderRadius: 8,
                      barThickness: window.innerWidth < 768 ? 30 : 40,
                      borderSkipped: false
                    }
                  ]
                }}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  layout: {
                    padding: {
                      right: 60,
                      left: 10,
                      top: 10,
                      bottom: 10
                    }
                  },
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      borderColor: '#ff4757',
                      borderWidth: 1,
                      titleColor: '#ffffff',
                      bodyColor: '#ffffff',
                      cornerRadius: 8,
                      callbacks: {
                        title: (context) => {
                          const mistake = summary.mistakePatterns[context[0].dataIndex];
                          return `${mistake.mistake.toUpperCase()}`;
                        },
                        label: (context) => {
                          const mistake = summary.mistakePatterns[context.dataIndex];
                          return [
                            `🔢 Frequency: ${mistake.frequency} times`,
                            `💰 Avg Impact: ₹${mistake.avgPnl.toFixed(2)}`,
                            `💸 Total Cost: ₹${(mistake.avgPnl * mistake.frequency).toFixed(2)}`,
                            `📊 ${((mistake.frequency / summary.mistakePatterns.reduce((sum, m) => sum + m.frequency, 0)) * 100).toFixed(1)}% of all mistakes`
                          ];
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        lineWidth: 1
                      },
                      ticks: {
                        stepSize: 1,
                        color: '#cccccc',
                        font: {
                          size: 12,
                          weight: 'bold'
                        },
                        callback: (value) => Math.floor(value) === value ? value : ''
                      },
                      title: {
                        display: true,
                        text: 'Frequency Count',
                        color: '#ffffff',
                        font: {
                          size: 14,
                          weight: 'bold'
                        }
                      }
                    },
                    y: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        autoSkip: false,
                        color: '#ffffff',
                        font: {
                          size: window.innerWidth < 768 ? 11 : 13,
                          weight: 'bold'
                        },
                        callback: function(value, index) {
                          const label = this.getLabelForValue(value);
                          return label.length > 15 ? label.substring(0, 15) + '...' : label;
                        }
                      }
                    }
                  },
                  onHover: (event, activeElements) => {
                    event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                  }
                }}
                plugins={[{
                  id: 'modernLabels',
                  afterDatasetsDraw: (chart) => {
                    const ctx = chart.ctx;
                    chart.data.datasets.forEach((dataset, i) => {
                      const meta = chart.getDatasetMeta(i);
                      meta.data.forEach((bar, index) => {
                        const mistake = summary.mistakePatterns[index];
                        const y = bar.y;
                        
                        // Modern count label with background
                        ctx.save();
                        
                        // Draw background circle
                        const radius = 16;
                        ctx.beginPath();
                        ctx.arc(bar.x + bar.width + 25, y, radius, 0, 2 * Math.PI);
                        ctx.fillStyle = mistake.avgPnl < -1000 ? '#ff4757' : 
                                        mistake.avgPnl < -500 ? '#ff6b35' : '#ffa726';
                        ctx.fill();
                        
                        // Draw count text
                        ctx.fillStyle = '#ffffff';
                        ctx.font = `bold ${window.innerWidth < 768 ? '12px' : '14px'} sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(mistake.frequency, bar.x + bar.width + 25, y);
                        
                        ctx.restore();
                      });
                    });
                  }
                }]}
              />
            </div>
          </div>

          {/* Actionable Insights */}
          <div style={{ marginTop: '24px' }}>
            <Card 
              size="small" 
              style={{ 
                background: 'linear-gradient(135deg, #1a3d5c 0%, #2d4a66 100%)',
                border: '1px solid #00d9ff'
              }}
            >
              <Text strong style={{ fontSize: '16px', color: '#00d9ff' }}>
                💡 Key Improvement Areas
              </Text>
              <Row gutter={[12, 12]} style={{ marginTop: '12px' }}>
                {summary.mistakePatterns.slice(0, 3).map((mistake, index) => {
                  const getRecommendation = (mistake) => {
                    const m = mistake.mistake.toLowerCase();
                    if (m.includes('fear') || m.includes('panic')) return 'Practice meditation before trading';
                    if (m.includes('greed') || m.includes('fomo')) return 'Set daily profit targets and stick to them';
                    if (m.includes('stop') || m.includes('risk')) return 'Always set stop loss before entry';
                    if (m.includes('exit') || m.includes('early')) return 'Use trailing stops instead of manual exits';
                    if (m.includes('entry') || m.includes('timing')) return 'Wait for complete setup confirmation';
                    if (m.includes('plan')) return 'Write down plan before market open';
                    return 'Review trading journal for patterns';
                  };

                  return (
                    <Col span={8} key={index}>
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#2d4a66',
                        borderRadius: '8px',
                        border: '1px solid #00d9ff30',
                        textAlign: 'center'
                      }}>
                        <Text style={{ fontSize: '12px', color: '#00d9ff', fontWeight: 'bold', textTransform: 'capitalize' }}>
                          {mistake.mistake}
                        </Text>
                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#b3e5fc' }}>
                          {getRecommendation(mistake)}
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          </div>
        </Card>
      )}

      {/* Weekly R-Multiple Analysis Modal */}
      <Modal
        title="Week-on-Week R-Multiple Trend"
        open={weeklyRMultipleVisible}
        onCancel={() => setWeeklyRMultipleVisible(false)}
        footer={null}
        width={window.innerWidth < 768 ? '95vw' : 900}
      >
        <div style={{ height: '400px', marginBottom: '20px' }}>
          <Line
            data={{
              labels: weeklyRMultipleData.map(w => w.weekLabel),
              datasets: [
                {
                  label: 'All Trades Average',
                  data: weeklyRMultipleData.map(w => w.avgRMultiple),
                  borderColor: 'rgb(99, 102, 241)',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  borderWidth: 3,
                  tension: 0.3,
                  pointRadius: 4,
                  pointBackgroundColor: 'rgb(99, 102, 241)'
                },
                {
                  label: 'Winners Average',
                  data: weeklyRMultipleData.map(w => w.avgWinnersRMultiple),
                  borderColor: 'rgb(34, 197, 94)',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderWidth: 2,
                  tension: 0.3,
                  pointRadius: 3,
                  pointBackgroundColor: 'rgb(34, 197, 94)'
                },
                {
                  label: 'Losers Average',
                  data: weeklyRMultipleData.map(w => w.avgLosersRMultiple),
                  borderColor: 'rgb(239, 68, 68)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderWidth: 2,
                  tension: 0.3,
                  pointRadius: 3,
                  pointBackgroundColor: 'rgb(239, 68, 68)'
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: 'index',
                intersect: false
              },
              plugins: {
                legend: {
                  display: true,
                  position: 'top'
                },
                tooltip: {
                  callbacks: {
                    afterLabel: (context) => {
                      const week = weeklyRMultipleData[context.dataIndex];
                      return [
                        `Total Trades: ${week.totalTrades}`,
                        `Winners: ${week.winningTrades}`,
                        `Losers: ${week.losingTrades}`
                      ];
                    }
                  }
                }
              },
              scales: {
                y: {
                  grid: {
                    color: (context) => {
                      if (context.tick.value === 0) {
                        return 'rgba(255, 255, 255, 0.3)';
                      }
                      return 'rgba(255, 255, 255, 0.1)';
                    }
                  },
                  ticks: {
                    callback: (value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}R`
                  },
                  title: {
                    display: true,
                    text: 'R-Multiple'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Week'
                  }
                }
              }
            }}
          />
        </div>
        <Divider />
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card style={{ textAlign: 'center' }}>
              <Statistic
                title="Latest Week Avg"
                value={weeklyRMultipleData.length > 0 ? weeklyRMultipleData[weeklyRMultipleData.length - 1]?.avgRMultiple.toFixed(2) : 'N/A'}
                suffix="R"
                valueStyle={{ 
                  color: weeklyRMultipleData.length > 0 && weeklyRMultipleData[weeklyRMultipleData.length - 1]?.avgRMultiple >= 0 ? '#00ff88' : '#ff4757'
                }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card style={{ textAlign: 'center' }}>
              <Statistic
                title="12-Week Avg"
                value={weeklyRMultipleData.length > 0 ? 
                  (weeklyRMultipleData.reduce((sum, w) => sum + w.avgRMultiple, 0) / weeklyRMultipleData.length).toFixed(2) : 'N/A'}
                suffix="R"
                valueStyle={{ 
                  color: weeklyRMultipleData.length > 0 && 
                    (weeklyRMultipleData.reduce((sum, w) => sum + w.avgRMultiple, 0) / weeklyRMultipleData.length) >= 0 ? '#00ff88' : '#ff4757'
                }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card style={{ textAlign: 'center' }}>
              <Statistic
                title="Best Week"
                value={weeklyRMultipleData.length > 0 ? 
                  Math.max(...weeklyRMultipleData.map(w => w.avgRMultiple)).toFixed(2) : 'N/A'}
                suffix="R"
                valueStyle={{ color: '#00ff88' }}
              />
            </Card>
          </Col>
        </Row>
        
        {/* R-Multiple Insights Section */}
        <Divider />
        <Card style={{ backgroundColor: '#1a1a1a', marginTop: '20px' }}>
          <Text strong style={{ fontSize: '18px', color: '#ffffff' }}>📊 R-Multiple Insights & Analysis</Text>
          
          {/* Educational Section */}
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#2d2d2d', borderRadius: '8px' }}>
            <Text strong style={{ color: '#00d9ff' }}>What is R-Multiple?</Text>
            <Paragraph style={{ marginTop: '8px', color: '#cccccc', marginBottom: 0 }}>
              R-Multiple measures your profit/loss relative to your initial risk. For example, if you risk ₹1,000 (1R) 
              and make ₹2,000 profit, that's a 2R win. If you lose ₹500, that's a -0.5R loss.
            </Paragraph>
          </div>

          {/* Trend Analysis */}
          {weeklyRMultipleData.length > 1 && (() => {
            const recentTrend = weeklyRMultipleData.slice(-4);
            const isImproving = recentTrend.length > 1 && 
              recentTrend[recentTrend.length - 1].avgRMultiple > recentTrend[0].avgRMultiple;
            const avgWinners = weeklyRMultipleData.reduce((sum, w) => sum + w.avgWinnersRMultiple, 0) / weeklyRMultipleData.length;
            const avgLosers = weeklyRMultipleData.reduce((sum, w) => sum + w.avgLosersRMultiple, 0) / weeklyRMultipleData.length;
            const riskRewardRatio = Math.abs(avgWinners / avgLosers);
            
            return (
              <div style={{ marginTop: '20px' }}>
                <Text strong style={{ fontSize: '16px', color: '#ffffff' }}>📈 Performance Analysis</Text>
                <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
                  {/* Trend Direction */}
                  <li style={{ marginBottom: '10px', color: isImproving ? '#00ff88' : '#ff4757' }}>
                    <strong>4-Week Trend:</strong> Your R-Multiple is {isImproving ? 'improving' : 'declining'} 
                    ({recentTrend[0].avgRMultiple.toFixed(2)}R → {recentTrend[recentTrend.length - 1].avgRMultiple.toFixed(2)}R)
                  </li>
                  
                  {/* Risk-Reward Assessment */}
                  <li style={{ marginBottom: '10px', color: riskRewardRatio >= 2 ? '#00ff88' : riskRewardRatio >= 1.5 ? '#ffaa00' : '#ff4757' }}>
                    <strong>Risk-Reward Ratio:</strong> {riskRewardRatio.toFixed(2)}:1 
                    {riskRewardRatio >= 2 ? ' (Excellent!)' : riskRewardRatio >= 1.5 ? ' (Good)' : ' (Needs improvement)'}
                  </li>
                  
                  {/* Winners Analysis */}
                  {avgWinners >= 2 && (
                    <li style={{ marginBottom: '10px', color: '#00ff88' }}>
                      <strong>Winner Management:</strong> Excellent! Your winners average {avgWinners.toFixed(2)}R - you're letting profits run
                    </li>
                  )}
                  {avgWinners < 2 && avgWinners >= 1 && (
                    <li style={{ marginBottom: '10px', color: '#ffaa00' }}>
                      <strong>Winner Management:</strong> Your winners average {avgWinners.toFixed(2)}R - consider holding winners longer
                    </li>
                  )}
                  
                  {/* Losers Analysis */}
                  {Math.abs(avgLosers) <= 1 && (
                    <li style={{ marginBottom: '10px', color: '#00ff88' }}>
                      <strong>Loss Control:</strong> Great discipline! Losses average {avgLosers.toFixed(2)}R - you're cutting losses effectively
                    </li>
                  )}
                  {Math.abs(avgLosers) > 1 && (
                    <li style={{ marginBottom: '10px', color: '#ff4757' }}>
                      <strong>Loss Control:</strong> Losses averaging {avgLosers.toFixed(2)}R - work on cutting losses at -1R
                    </li>
                  )}
                </ul>
              </div>
            );
          })()}

          {/* Recommendations */}
          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#2d2d2d', borderRadius: '8px' }}>
            <Text strong style={{ fontSize: '16px', color: '#ffaa00' }}>💡 Recommendations</Text>
            {weeklyRMultipleData.length > 0 && (() => {
              const avgAll = weeklyRMultipleData.reduce((sum, w) => sum + w.avgRMultiple, 0) / weeklyRMultipleData.length;
              const avgWinners = weeklyRMultipleData.reduce((sum, w) => sum + w.avgWinnersRMultiple, 0) / weeklyRMultipleData.length;
              const avgLosers = weeklyRMultipleData.reduce((sum, w) => sum + w.avgLosersRMultiple, 0) / weeklyRMultipleData.length;
              
              return (
                <ul style={{ marginTop: '12px', paddingLeft: '20px', color: '#cccccc' }}>
                  {avgAll < 0.5 && (
                    <>
                      <li style={{ marginBottom: '8px' }}>🎯 Focus on risk management - ensure stop losses are always in place</li>
                      <li style={{ marginBottom: '8px' }}>📊 Review your entry criteria - are you entering trades with clear edge?</li>
                    </>
                  )}
                  {avgWinners < 2 && (
                    <li style={{ marginBottom: '8px' }}>📈 Let winners run longer - consider trailing stops instead of fixed targets</li>
                  )}
                  {Math.abs(avgLosers) > 1.2 && (
                    <li style={{ marginBottom: '8px' }}>✂️ Cut losses quicker - stick to your -1R stop loss strictly</li>
                  )}
                  {avgAll >= 1 && (
                    <li style={{ marginBottom: '8px' }}>✅ Maintain your current approach - your risk management is working well!</li>
                  )}
                  <li style={{ marginBottom: '8px' }}>📝 Target: Aim for average R-Multiple above 1.5R with consistent -1R max loss</li>
                </ul>
              );
            })()}
          </div>

          {/* Key Metrics Grid */}
          <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
            <Col span={6}>
              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#2d2d2d', borderRadius: '8px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Target R-Multiple</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00ff88', marginTop: '4px' }}>
                  1.5R+
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#2d2d2d', borderRadius: '8px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Max Loss Target</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff4757', marginTop: '4px' }}>
                  -1.0R
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#2d2d2d', borderRadius: '8px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Win Target</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00ff88', marginTop: '4px' }}>
                  2.0R+
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#2d2d2d', borderRadius: '8px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Risk:Reward</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00d9ff', marginTop: '4px' }}>
                  1:2+
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </Modal>

      {/* Plan Follow Rate Insights Modal */}
      <Modal
        title="Plan Follow Rate Analysis"
        open={planFollowModalVisible}
        onCancel={() => setPlanFollowModalVisible(false)}
        footer={null}
        width={window.innerWidth < 768 ? '95vw' : 800}
      >
        {/* Overall Plan Follow Rate Display */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Progress
            type="circle"
            percent={summary.planFollowRate}
            strokeColor={getPlanFollowColor(summary.planFollowRate)}
            format={(percent) => `${percent.toFixed(0)}%`}
            width={150}
            strokeWidth={8}
          />
          <div style={{ marginTop: '16px' }}>
            <Text strong style={{ fontSize: '18px', color: getPlanFollowColor(summary.planFollowRate) }}>
              {getPlanFollowText(summary.planFollowRate)}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {summary.tradesWithPlanFollowed}/{summary.totalTrades} trades followed your plan
            </Text>
          </div>
        </div>

        <Divider />

        {/* Insights Section */}
        <Card style={{ backgroundColor: '#1a1a1a' }}>
          <Text strong style={{ fontSize: '18px', color: '#ffffff' }}>📋 Plan Follow Rate Insights</Text>
          
          {/* Educational Section */}
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#2d2d2d', borderRadius: '8px' }}>
            <Text strong style={{ color: '#00d9ff' }}>What is Plan Follow Rate?</Text>
            <Paragraph style={{ marginTop: '8px', color: '#cccccc', marginBottom: 0 }}>
              Plan Follow Rate measures how consistently you stick to your predetermined trading plan. It tracks whether you 
              followed your entry/exit rules, position sizing, and risk management guidelines for each trade.
            </Paragraph>
          </div>

          {/* Performance Analysis */}
          <div style={{ marginTop: '20px' }}>
            <Text strong style={{ fontSize: '16px', color: '#ffffff' }}>📈 Discipline Analysis</Text>
            <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
              {/* Plan Follow Rate Assessment */}
              <li style={{ marginBottom: '10px', color: summary.planFollowRate >= 80 ? '#00ff88' : summary.planFollowRate >= 60 ? '#ffaa00' : '#ff4757' }}>
                <strong>Discipline Level:</strong> {
                  summary.planFollowRate >= 90 ? 'Exceptional discipline!' :
                  summary.planFollowRate >= 80 ? 'Strong discipline' :
                  summary.planFollowRate >= 60 ? 'Moderate discipline - room for improvement' :
                  summary.planFollowRate >= 40 ? 'Poor discipline - needs immediate attention' :
                  'Very poor discipline - major focus needed'
                } ({summary.planFollowRate.toFixed(1)}%)
              </li>
              
              {/* Impact on Performance */}
              {summary.planFollowRate >= 80 && summary.avgRMultiple > 0 && (
                <li style={{ marginBottom: '10px', color: '#00ff88' }}>
                  <strong>Performance Impact:</strong> Your high discipline is likely contributing to your positive R-Multiple!
                </li>
              )}
              {summary.planFollowRate < 60 && summary.avgRMultiple < 0 && (
                <li style={{ marginBottom: '10px', color: '#ff4757' }}>
                  <strong>Performance Impact:</strong> Poor plan adherence may be hurting your overall performance
                </li>
              )}
              
              {/* Trades Outside Plan */}
              {summary.totalTrades > summary.tradesWithPlanFollowed && (
                <li style={{ marginBottom: '10px', color: '#ffaa00' }}>
                  <strong>Trades Outside Plan:</strong> {summary.totalTrades - summary.tradesWithPlanFollowed} trades deviated from your plan
                </li>
              )}
            </ul>
          </div>

          {/* Recommendations */}
          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#2d2d2d', borderRadius: '8px' }}>
            <Text strong style={{ fontSize: '16px', color: '#ffaa00' }}>💡 Recommendations</Text>
            <ul style={{ marginTop: '12px', paddingLeft: '20px', color: '#cccccc' }}>
              {summary.planFollowRate < 50 && (
                <>
                  <li style={{ marginBottom: '8px' }}>📝 Write down your trading plan before market open</li>
                  <li style={{ marginBottom: '8px' }}>⏰ Set alerts for entry/exit points to avoid emotional decisions</li>
                  <li style={{ marginBottom: '8px' }}>🚫 Use position sizing calculator to stick to risk limits</li>
                </>
              )}
              {summary.planFollowRate >= 50 && summary.planFollowRate < 80 && (
                <>
                  <li style={{ marginBottom: '8px' }}>🎯 Review trades where you deviated - identify patterns</li>
                  <li style={{ marginBottom: '8px' }}>📱 Use trade alerts/reminders to stay disciplined</li>
                  <li style={{ marginBottom: '8px' }}>🧘 Practice emotional control techniques</li>
                </>
              )}
              {summary.planFollowRate >= 80 && (
                <>
                  <li style={{ marginBottom: '8px' }}>✅ Excellent discipline! Keep maintaining this consistency</li>
                  <li style={{ marginBottom: '8px' }}>📊 Fine-tune your plan based on what's working well</li>
                </>
              )}
              <li style={{ marginBottom: '8px' }}>🎯 Target: Maintain 90%+ plan follow rate for consistent profitability</li>
            </ul>
          </div>

          {/* Deviation Analysis with Patterns */}
          <div style={{ marginTop: '20px' }}>
            <Text strong style={{ fontSize: '16px', color: '#ffffff' }}>🔍 Your Plan Deviation Analysis</Text>
            {deviationData.totalDeviationTrades > 0 ? (
              <>
                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#2d2d2d', borderRadius: '8px' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Deviation Trades</Text>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4757', marginTop: '4px' }}>
                          {deviationData.totalDeviationTrades}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Avg R-Multiple</Text>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: deviationData.avgRMultipleDeviations >= 0 ? '#00ff88' : '#ff4757', marginTop: '4px' }}>
                          {deviationData.avgRMultipleDeviations ? deviationData.avgRMultipleDeviations.toFixed(2) : 'N/A'}R
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Total Impact</Text>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: deviationData.totalPnlFromDeviations >= 0 ? '#00ff88' : '#ff4757', marginTop: '4px' }}>
                          ₹{deviationData.totalPnlFromDeviations ? deviationData.totalPnlFromDeviations.toFixed(0) : 0}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Pattern-Based Insights */}
                {deviationData.insights && deviationData.insights.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <Text strong style={{ fontSize: '16px', color: '#ffaa00' }}>🧠 Deviation Pattern Insights</Text>
                    <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: '12px' }}>
                      {deviationData.insights.map((insight, index) => {
                        const getInsightColor = (type) => {
                          switch (type) {
                            case 'emotional': return '#ff4757';
                            case 'risk': return '#ff6b35';
                            case 'performance': return '#ffa726';
                            default: return '#00d9ff';
                          }
                        };
                        
                        const getInsightIcon = (type) => {
                          switch (type) {
                            case 'emotional': return '😰';
                            case 'risk': return '⚠️';
                            case 'performance': return '📉';
                            default: return '💡';
                          }
                        };

                        return (
                          <Card 
                            key={index} 
                            size="small" 
                            style={{ backgroundColor: '#1a1a1a', border: `1px solid ${getInsightColor(insight.type)}` }}
                          >
                            <Space align="start">
                              <div style={{ fontSize: '20px' }}>{getInsightIcon(insight.type)}</div>
                              <div style={{ flex: 1 }}>
                                <Text strong style={{ color: getInsightColor(insight.type), fontSize: '14px' }}>
                                  {insight.title}
                                </Text>
                                <div style={{ marginTop: '4px' }}>
                                  <Text style={{ color: '#cccccc', fontSize: '13px' }}>
                                    {insight.description}
                                  </Text>
                                </div>
                                <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#2d2d2d', borderRadius: '4px' }}>
                                  <Text style={{ color: '#00d9ff', fontSize: '12px' }}>
                                    💡 {insight.recommendation}
                                  </Text>
                                </div>
                              </div>
                            </Space>
                          </Card>
                        );
                      })}
                    </Space>
                  </div>
                )}

                {/* Top Deviations Grid */}
                <div style={{ marginTop: '20px' }}>
                  <Text strong style={{ fontSize: '16px', color: '#ffffff' }}>📊 Most Common Deviations</Text>
                  <Row gutter={[12, 12]} style={{ marginTop: '16px' }}>
                    {deviationData.topDeviations.slice(0, 5).map((deviation, index) => {
                      const colors = ['#ff4757', '#ff6b35', '#ffa726', '#ffcc02', '#00d9ff'];
                      const getIcon = (mistake) => {
                        if (mistake.includes('fear') || mistake.includes('panic') || mistake.includes('anxious')) return '😰';
                        if (mistake.includes('greed') || mistake.includes('fomo')) return '🤑';
                        if (mistake.includes('stop') || mistake.includes('risk')) return '⚠️';
                        if (mistake.includes('exit') || mistake.includes('early')) return '🏃‍♂️';
                        if (mistake.includes('entry') || mistake.includes('timing')) return '🎯';
                        return '📝';
                      };
                      
                      return (
                        <Col span={deviationData.topDeviations.length >= 4 ? 12 : 8} key={index}>
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '16px', 
                            backgroundColor: '#2d2d2d', 
                            borderRadius: '8px',
                            border: `2px solid ${colors[index]}`,
                            height: '100%'
                          }}>
                            <div style={{ fontSize: '24px', color: colors[index], marginBottom: '8px' }}>
                              {getIcon(deviation.mistake)}
                            </div>
                            <Text style={{ fontSize: '13px', color: '#cccccc', textTransform: 'capitalize', fontWeight: 'bold' }}>
                              {deviation.mistake}
                            </Text>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors[index], marginTop: '8px' }}>
                              {deviation.count} times
                            </div>
                            <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                              {deviation.percentage}% of deviations
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </div>

                {/* Additional Deviations */}
                {deviationData.topDeviations.length > 5 && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#2d2d2d', borderRadius: '8px' }}>
                    <Text style={{ fontSize: '14px', color: '#cccccc' }}>Other deviations: </Text>
                    {deviationData.topDeviations.slice(5).map((deviation, index) => (
                      <Tag key={index} color="orange" style={{ margin: '2px' }}>
                        {deviation.mistake} ({deviation.count}x)
                      </Tag>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#2d2d2d', borderRadius: '8px', marginTop: '16px' }}>
                <div style={{ fontSize: '48px', color: '#00ff88', marginBottom: '16px' }}>🎉</div>
                <Text strong style={{ fontSize: '16px', color: '#00ff88' }}>Perfect Discipline!</Text>
                <br />
                <Text style={{ fontSize: '14px', color: '#cccccc', marginTop: '8px' }}>
                  No recorded deviations from your trading plan. Keep up the excellent discipline!
                </Text>
              </div>
            )}
          </div>

          {/* Target Metrics */}
          <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
            <Col span={12}>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#2d2d2d', borderRadius: '8px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Target Plan Follow Rate</Text>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ff88', marginTop: '8px' }}>
                  90%+
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#2d2d2d', borderRadius: '8px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Professional Standard</Text>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00d9ff', marginTop: '8px' }}>
                  95%+
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </Modal>
    </Space>
  );
};

export default Dashboard;