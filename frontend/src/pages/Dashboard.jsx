import { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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

const { Title: AntTitle, Text } = Typography;

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');
  const [pnlModalVisible, setPnlModalVisible] = useState(false);
  const [winRateModalVisible, setWinRateModalVisible] = useState(false);
  const [rMultipleModalVisible, setRMultipleModalVisible] = useState(false);

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

  const callPutChartData = {
    labels: ['Calls', 'Puts'],
    datasets: [
      {
        data: [summary.callPutRatio.calls, summary.callPutRatio.puts],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderWidth: 1
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
            <Select.Option value="7">Last 7 days</Select.Option>
            <Select.Option value="30">Last 30 days</Select.Option>
            <Select.Option value="90">Last 90 days</Select.Option>
            <Select.Option value="365">All time</Select.Option>
          </Select>
        </Space>
      </Row>

      {/* Main Behavioral Metrics */}
      <Row gutter={[16, 16]}>
        {/* Total P&L - Clickable */}
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card 
            hoverable 
            onClick={() => setPnlModalVisible(true)}
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
                title={
                  <div>
                    Total P&L
                    <Text type="secondary" style={{ fontSize: '11px', marginLeft: '8px' }}>
                      ({summary.totalTrades} trades)
                    </Text>
                  </div>
                }
                value={summary.totalPnl}
                precision={2}
                prefix="₹"
                valueStyle={{
                  color: summary.totalPnl >= 0 ? '#00ff88' : '#ff4757',
                  fontSize: window.innerWidth < 768 ? '20px' : '28px'
                }}
                suffix={
                  summary.totalPnl >= 0 ? 
                  <RiseOutlined style={{ fontSize: '18px' }} /> : 
                  <FallOutlined style={{ fontSize: '18px' }} />
                }
              />
            </div>
          </Card>
        </Col>

        {/* Win Rate - Circular Progress */}
        <Col xs={12} sm={12} md={6} lg={6}>
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

        {/* Avg R-Multiple - Clickable */}
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card 
            hoverable 
            onClick={() => setRMultipleModalVisible(true)}
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

        {/* Plan Follow Rate - Circular Progress with Color */}
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card style={{ height: '100%' }}>
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
          <Card title="Equity Curve">
            <div style={{ height: window.innerWidth < 768 ? '250px' : '300px' }}>
              <Line 
                data={equityChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: window.innerWidth >= 768
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
          <Card title="Call/Put Distribution">
            <div style={{ height: window.innerWidth < 768 ? '250px' : '300px' }}>
              <Doughnut 
                data={callPutChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: window.innerWidth < 768 ? 'bottom' : 'right'
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

      {/* Additional Analysis Sections */}
      {summary.mistakePatterns && summary.mistakePatterns.length > 0 && (
        <Card title="Common Mistakes">
          <Space direction="vertical" style={{ width: '100%' }}>
            {summary.mistakePatterns.map((mistake, index) => (
              <Card key={index} size="small" style={{ backgroundColor: '#3d1a1a' }}>
                <Row justify="space-between" align="middle">
                  <Col>
                    <strong>{mistake.mistake}</strong>
                  </Col>
                  <Col>
                    <Space>
                      <span style={{ color: '#666' }}>{mistake.frequency} times</span>
                      <span style={{ color: mistake.avgPnl < 0 ? '#ff4757' : '#00ff88', fontWeight: 'bold' }}>
                        Avg: ₹{mistake.avgPnl.toFixed(2)}
                      </span>
                    </Space>
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        </Card>
      )}
    </Space>
  );
};

export default Dashboard;