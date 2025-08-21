import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Alert, Tag, Progress } from 'antd';
import { Column, Pie } from '@ant-design/plots';
import { RiseOutlined, FallOutlined, BarChartOutlined, PieChartOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Text, Paragraph } = Typography;

const Insights = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const response = await api.get('/trades');
      setTrades(response.data);
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate breakout type vs R-multiple correlation
  const getBreakoutAnalysis = () => {
    const analysis = {
      vertical: { trades: [], avgRMultiple: 0, winRate: 0, totalPnl: 0 },
      horizontal: { trades: [], avgRMultiple: 0, winRate: 0, totalPnl: 0 }
    };

    trades.forEach(trade => {
      if (trade.breakout_type && trade.r_multiple !== null) {
        const type = trade.breakout_type.toLowerCase();
        if (analysis[type]) {
          analysis[type].trades.push(trade);
        }
      }
    });

    // Calculate metrics for each breakout type
    Object.keys(analysis).forEach(type => {
      const typeTrades = analysis[type].trades;
      if (typeTrades.length > 0) {
        analysis[type].avgRMultiple = typeTrades.reduce((sum, t) => sum + t.r_multiple, 0) / typeTrades.length;
        analysis[type].winRate = (typeTrades.filter(t => t.pnl > 0).length / typeTrades.length) * 100;
        analysis[type].totalPnl = typeTrades.reduce((sum, t) => sum + t.pnl, 0);
      }
    });

    return analysis;
  };

  // Calculate emotional state analysis
  const getEmotionalAnalysis = () => {
    const emotions = {};
    trades.forEach(trade => {
      if (trade.emotional_state) {
        const emotion = trade.emotional_state;
        if (!emotions[emotion]) {
          emotions[emotion] = { trades: [], avgRMultiple: 0, winRate: 0, totalPnl: 0 };
        }
        emotions[emotion].trades.push(trade);
      }
    });

    Object.keys(emotions).forEach(emotion => {
      const emotionTrades = emotions[emotion].trades;
      emotions[emotion].avgRMultiple = emotionTrades.reduce((sum, t) => sum + (t.r_multiple || 0), 0) / emotionTrades.length;
      emotions[emotion].winRate = (emotionTrades.filter(t => t.pnl > 0).length / emotionTrades.length) * 100;
      emotions[emotion].totalPnl = emotionTrades.reduce((sum, t) => sum + t.pnl, 0);
    });

    return emotions;
  };

  // Plan adherence analysis
  const getPlanAnalysis = () => {
    const planFollowed = trades.filter(t => t.followed_plan).length;
    const planNotFollowed = trades.length - planFollowed;
    
    const followedTrades = trades.filter(t => t.followed_plan);
    const notFollowedTrades = trades.filter(t => !t.followed_plan);
    
    const followedAvgR = followedTrades.length > 0 ? 
      followedTrades.reduce((sum, t) => sum + (t.r_multiple || 0), 0) / followedTrades.length : 0;
    const notFollowedAvgR = notFollowedTrades.length > 0 ? 
      notFollowedTrades.reduce((sum, t) => sum + (t.r_multiple || 0), 0) / notFollowedTrades.length : 0;
    
    return {
      planFollowed,
      planNotFollowed,
      followedAvgR,
      notFollowedAvgR,
      followedWinRate: followedTrades.length > 0 ? 
        (followedTrades.filter(t => t.pnl > 0).length / followedTrades.length) * 100 : 0,
      notFollowedWinRate: notFollowedTrades.length > 0 ? 
        (notFollowedTrades.filter(t => t.pnl > 0).length / notFollowedTrades.length) * 100 : 0
    };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <Card style={{ textAlign: 'center', padding: '40px' }}>
        <BarChartOutlined style={{ fontSize: '48px', color: '#999', marginBottom: '16px' }} />
        <Title level={4}>No Trading Data</Title>
        <Paragraph type="secondary">
          Start logging trades to receive detailed insights and performance analysis
        </Paragraph>
      </Card>
    );
  }

  const breakoutAnalysis = getBreakoutAnalysis();
  const emotionalAnalysis = getEmotionalAnalysis();
  const planAnalysis = getPlanAnalysis();

  // Data for charts
  const breakoutChartData = Object.keys(breakoutAnalysis)
    .filter(type => breakoutAnalysis[type].trades.length > 0)
    .map(type => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      avgRMultiple: breakoutAnalysis[type].avgRMultiple,
      trades: breakoutAnalysis[type].trades.length
    }));

  const emotionalPieData = Object.keys(emotionalAnalysis).map(emotion => ({
    type: emotion.charAt(0).toUpperCase() + emotion.slice(1),
    value: emotionalAnalysis[emotion].trades.length,
    avgRMultiple: emotionalAnalysis[emotion].avgRMultiple
  }));

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, fontSize: '28px' }}>
          Trading Insights
        </Title>
        <Text type="secondary">
          Advanced analytics and correlations from your {trades.length} trades
        </Text>
      </div>

      {/* Breakout Type Analysis */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <BarChartOutlined style={{ marginRight: '8px', color: '#ff006b' }} />
                Breakout Type vs R-Multiple Analysis
              </div>
            }
          >
            {breakoutChartData.length > 0 ? (
              <>
                <Row gutter={16} style={{ marginBottom: '20px' }}>
                  {Object.keys(breakoutAnalysis).filter(type => breakoutAnalysis[type].trades.length > 0).map(type => (
                    <Col xs={12} sm={8} key={type}>
                      <Card size="small" style={{ background: type === 'vertical' ? '#f6ffed' : '#fff1f0' }}>
                        <Statistic
                          title={`${type.charAt(0).toUpperCase() + type.slice(1)} Breakouts`}
                          value={breakoutAnalysis[type].avgRMultiple}
                          suffix="R"
                          precision={2}
                          valueStyle={{ 
                            color: breakoutAnalysis[type].avgRMultiple >= 0 ? '#00ff88' : '#ff4757',
                            fontSize: '18px'
                          }}
                        />
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                          {breakoutAnalysis[type].trades.length} trades • {breakoutAnalysis[type].winRate.toFixed(1)}% win rate
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
                
                <div style={{ height: '300px' }}>
                  <Column
                    data={breakoutChartData}
                    xField="type"
                    yField="avgRMultiple"
                    meta={{
                      avgRMultiple: { alias: 'Average R-Multiple' },
                      type: { alias: 'Breakout Type' },
                    }}
                    color={({ avgRMultiple }) => avgRMultiple >= 0 ? '#00ff88' : '#ff4757'}
                    columnStyle={{
                      radius: [4, 4, 0, 0],
                    }}
                    label={{
                      position: 'top',
                      formatter: (datum) => `${datum.avgRMultiple.toFixed(2)}R`,
                      style: {
                        fill: '#333',
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </div>

                <Alert
                  style={{ marginTop: '16px' }}
                  message="Insight"
                  description={
                    breakoutAnalysis.vertical.avgRMultiple > breakoutAnalysis.horizontal.avgRMultiple ?
                      `Vertical breakouts are performing better with ${breakoutAnalysis.vertical.avgRMultiple.toFixed(2)}R vs ${breakoutAnalysis.horizontal.avgRMultiple.toFixed(2)}R average. Consider focusing more on vertical setups.` :
                      `Horizontal breakouts are performing better with ${breakoutAnalysis.horizontal.avgRMultiple.toFixed(2)}R vs ${breakoutAnalysis.vertical.avgRMultiple.toFixed(2)}R average. Consider focusing more on horizontal setups.`
                  }
                  type="info"
                  showIcon
                />
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <BarChartOutlined style={{ fontSize: '32px', marginBottom: '16px' }} />
                <div>No breakout type data available</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Emotional State Analysis */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <PieChartOutlined style={{ marginRight: '8px', color: '#ff006b' }} />
                Emotional State Distribution
              </div>
            }
            style={{ height: '400px' }}
          >
            {emotionalPieData.length > 0 ? (
              <Pie
                data={emotionalPieData}
                angleField="value"
                colorField="type"
                radius={0.8}
                label={{
                  type: 'inner',
                  offset: '-30%',
                  content: ({percent}) => `${(percent * 100).toFixed(0)}%`,
                  style: {
                    fontSize: 14,
                    textAlign: 'center',
                  },
                }}
                color={['#00ff88', '#ff4757', '#ffaa00', '#1890ff']}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                No emotional state data available
              </div>
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title="Emotional Performance"
            style={{ height: '400px' }}
          >
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {Object.keys(emotionalAnalysis).map(emotion => (
                <div key={emotion} style={{ marginBottom: '16px', padding: '12px', background: '#fafafa', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Tag color={
                      emotion === 'calm' ? 'green' :
                      emotion === 'fearful' ? 'red' :
                      emotion === 'overconfident' ? 'orange' : 'blue'
                    }>
                      {emotion.toUpperCase()}
                    </Tag>
                    <Text strong style={{ 
                      color: emotionalAnalysis[emotion].avgRMultiple >= 0 ? '#00ff88' : '#ff4757' 
                    }}>
                      {emotionalAnalysis[emotion].avgRMultiple.toFixed(2)}R
                    </Text>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {emotionalAnalysis[emotion].trades.length} trades • {emotionalAnalysis[emotion].winRate.toFixed(1)}% win rate
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Plan Adherence Analysis */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card 
            title="Trading Plan Adherence Impact"
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  <Statistic
                    title="Plan Followed"
                    value={planAnalysis.followedAvgR}
                    suffix="R avg"
                    precision={2}
                    valueStyle={{ color: '#00ff88' }}
                    prefix={<RiseOutlined />}
                  />
                  <Progress 
                    percent={(planAnalysis.planFollowed / trades.length) * 100} 
                    strokeColor="#00ff88"
                    showInfo={false}
                    size="small"
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    {planAnalysis.planFollowed} trades • {planAnalysis.followedWinRate.toFixed(1)}% win rate
                  </div>
                </Card>
              </Col>
              
              <Col xs={24} sm={12}>
                <Card size="small" style={{ background: '#fff1f0', border: '1px solid #ffa39e' }}>
                  <Statistic
                    title="Plan Not Followed"
                    value={planAnalysis.notFollowedAvgR}
                    suffix="R avg"
                    precision={2}
                    valueStyle={{ color: '#ff4757' }}
                    prefix={<FallOutlined />}
                  />
                  <Progress 
                    percent={(planAnalysis.planNotFollowed / trades.length) * 100} 
                    strokeColor="#ff4757"
                    showInfo={false}
                    size="small"
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    {planAnalysis.planNotFollowed} trades • {planAnalysis.notFollowedWinRate.toFixed(1)}% win rate
                  </div>
                </Card>
              </Col>
            </Row>

            <Alert
              style={{ marginTop: '16px' }}
              message="Key Insight"
              description={
                planAnalysis.followedAvgR > planAnalysis.notFollowedAvgR ?
                  `Following your trading plan results in ${(planAnalysis.followedAvgR - planAnalysis.notFollowedAvgR).toFixed(2)}R better performance on average. Stick to your plan!` :
                  `Your plan adherence needs improvement. Review your trading rules and focus on discipline.`
              }
              type={planAnalysis.followedAvgR > planAnalysis.notFollowedAvgR ? "success" : "warning"}
              showIcon
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Insights;