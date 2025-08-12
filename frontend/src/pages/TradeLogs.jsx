import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Typography, Tag, Space, Spin, Card, Statistic } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;

const TradeLogs = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const columns = [
    {
      title: 'Date',
      dataIndex: 'trade_date',
      key: 'trade_date',
      render: (date) => new Date(date).toLocaleDateString(),
      responsive: ['sm'],
    },
    {
      title: 'Underlying',
      dataIndex: 'underlying',
      key: 'underlying',
      responsive: ['xs'],
    },
    {
      title: 'Type',
      dataIndex: 'option_type',
      key: 'option_type',
      render: (type) => (
        <Tag color={type === 'call' ? 'green' : 'red'}>
          {type?.toUpperCase()}
        </Tag>
      ),
      responsive: ['md'],
    },
    {
      title: 'Breakout',
      dataIndex: 'breakout_type',
      key: 'breakout_type',
      render: (type) => (
        <Tag color={type === 'vertical' ? 'blue' : 'purple'}>
          {type ? type.charAt(0).toUpperCase() + type.slice(1) : '-'}
        </Tag>
      ),
      responsive: ['lg'],
    },
    {
      title: 'Entry',
      dataIndex: 'entry_price',
      key: 'entry_price',
      render: (price) => `₹${price}`,
      responsive: ['sm'],
    },
    {
      title: 'Exit',
      dataIndex: 'exit_price',
      key: 'exit_price',
      render: (price) => `₹${price}`,
      responsive: ['sm'],
    },
    {
      title: 'P&L',
      dataIndex: 'pnl',
      key: 'pnl',
      render: (pnl) => (
        <Text style={{ color: pnl >= 0 ? '#00ff88' : '#ff4757', fontWeight: 'bold' }}>
          ₹{pnl?.toFixed(2) || '0.00'}
        </Text>
      ),
      responsive: ['xs'],
    },
    {
      title: 'R-Multiple',
      dataIndex: 'r_multiple',
      key: 'r_multiple',
      render: (rMultiple) => (
        <Text style={{ color: rMultiple >= 0 ? '#00ff88' : '#ff4757', fontWeight: 'bold' }}>
          {rMultiple?.toFixed(2) || '0.00'}R
        </Text>
      ),
      responsive: ['md'],
    },
    {
      title: 'Plan',
      dataIndex: 'followed_plan',
      key: 'followed_plan',
      render: (followed) => (
        <Text style={{ color: followed ? '#00ff88' : '#ff4757', fontSize: '16px' }}>
          {followed ? '✓' : '✗'}
        </Text>
      ),
      responsive: ['lg'],
    },
    {
      title: 'Emotion',
      dataIndex: 'emotional_state',
      key: 'emotional_state',
      render: (state) => state || '-',
      responsive: ['lg'],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, trade) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => navigate(`/edit-trade/${trade.id}`)}
          size="small"
        >
          {window.innerWidth < 768 ? '' : 'Edit'}
        </Button>
      ),
      responsive: ['xs'],
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Calculate quick stats
  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => t.pnl > 0).length;
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <Title level={3} style={{ margin: 0, fontSize: window.innerWidth < 768 ? '20px' : '24px' }}>
          Trade History
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/add-trade')}
          size={window.innerWidth < 768 ? 'middle' : 'large'}
        >
          Add Trade
        </Button>
      </div>

      {/* Quick Stats Cards - Mobile Friendly */}
      {totalTrades > 0 && (
        <Card>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth < 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
            gap: '16px' 
          }}>
            <Statistic 
              title="Total Trades" 
              value={totalTrades} 
              valueStyle={{ fontSize: window.innerWidth < 768 ? '18px' : '20px' }}
            />
            <Statistic 
              title="Win Rate" 
              value={`${((winningTrades / totalTrades) * 100).toFixed(1)}%`}
              valueStyle={{ 
                color: winningTrades / totalTrades >= 0.5 ? '#00ff88' : '#ff4757',
                fontSize: window.innerWidth < 768 ? '18px' : '20px'
              }}
            />
            <Statistic 
              title="Total P&L" 
              value={`₹${totalPnl.toFixed(2)}`}
              valueStyle={{ 
                color: totalPnl >= 0 ? '#00ff88' : '#ff4757',
                fontSize: window.innerWidth < 768 ? '18px' : '20px'
              }}
            />
            <Statistic 
              title="Avg P&L" 
              value={`₹${(totalPnl / totalTrades).toFixed(2)}`}
              valueStyle={{ 
                color: (totalPnl / totalTrades) >= 0 ? '#00ff88' : '#ff4757',
                fontSize: window.innerWidth < 768 ? '18px' : '20px'
              }}
            />
          </div>
        </Card>
      )}
      
      {trades.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Text type="secondary">No trades recorded yet</Text>
          <div style={{ marginTop: '16px' }}>
            <Button type="primary" onClick={() => navigate('/add-trade')}>
              Add Your First Trade
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <Table
            columns={columns}
            dataSource={trades}
            rowKey="id"
            scroll={{ x: true }}
            pagination={{
              pageSize: window.innerWidth < 768 ? 10 : 20,
              showSizeChanger: window.innerWidth >= 768,
              showQuickJumper: window.innerWidth >= 768,
              showTotal: (total, range) => 
                window.innerWidth >= 768 
                  ? `${range[0]}-${range[1]} of ${total} trades`
                  : `${total} trades`
            }}
            size={window.innerWidth < 768 ? 'small' : 'middle'}
          />
        </Card>
      )}
    </Space>
  );
};

export default TradeLogs;