import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Typography, Tag, Space, Spin, Card, Statistic, Upload, message, Select, Row, Col } from 'antd';
import { EditOutlined, PlusOutlined, DownloadOutlined, UploadOutlined, CalendarOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;

const TradeLogs = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTrades();
  }, [timeFilter, pagination.current, pagination.pageSize]);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/trades?page=${pagination.current}&pageSize=${pagination.pageSize}&timeFilter=${timeFilter}`);
      setTrades(response.data.trades || response.data);
      
      // Handle pagination response
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total
        }));
      } else {
        // Fallback if pagination not implemented yet
        setPagination(prev => ({
          ...prev,
          total: response.data.length
        }));
      }
      console.log('Trades fetched successfully:', (response.data.trades || response.data).length, 'trades');
    } catch (error) {
      console.error('Error fetching trades:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/trades/export', {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `trades_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Trades exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export trades');
    }
  };

  const handleImport = async (file) => {
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post('/trades/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const { imported, skipped, total } = response.data;
      
      if (imported > 0) {
        message.success(`Successfully imported ${imported} trades. ${skipped > 0 ? `Skipped ${skipped} duplicates.` : ''}`);
        fetchTrades(); // Refresh the trades list
      } else {
        message.info(`All ${total} trades were already present (duplicates)`);
      }
    } catch (error) {
      console.error('Import error:', error);
      message.error('Failed to import trades. Please ensure the file is in the correct format.');
    } finally {
      setImporting(false);
    }
    
    return false; // Prevent default upload behavior
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'trade_date',
      key: 'trade_date',
      render: (date) => new Date(date).toLocaleDateString(),
      fixed: 'left',
      width: 100,
    },
    {
      title: 'Symbol',
      dataIndex: 'underlying',
      key: 'underlying',
      render: (underlying) => (
        <Text strong style={{ color: '#ff006b', fontSize: '14px' }}>
          {underlying?.toUpperCase()}
        </Text>
      ),
      fixed: 'left',
      width: 100,
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
      width: 80,
    },
    {
      title: 'Entry',
      dataIndex: 'entry_price',
      key: 'entry_price',
      render: (price) => `₹${price?.toFixed(2)}`,
      width: 100,
    },
    {
      title: 'Exit',
      dataIndex: 'exit_price',
      key: 'exit_price',
      render: (price) => `₹${price?.toFixed(2)}`,
      width: 100,
    },
    {
      title: 'Stop Loss',
      dataIndex: 'stop_loss',
      key: 'stop_loss',
      render: (stopLoss) => (
        <Text style={{ color: stopLoss ? '#ffaa00' : '#666' }}>
          {stopLoss ? `₹${stopLoss.toFixed(2)}` : 'N/A'}
        </Text>
      ),
      width: 100,
    },
    {
      title: 'P&L',
      dataIndex: 'pnl',
      key: 'pnl',
      render: (pnl) => (
        <Text strong style={{ 
          color: pnl >= 0 ? '#00ff88' : '#ff4757', 
          fontSize: '14px' 
        }}>
          ₹{pnl?.toFixed(2) || '0.00'}
        </Text>
      ),
      width: 120,
      sorter: (a, b) => a.pnl - b.pnl,
    },
    {
      title: 'R-Multiple',
      dataIndex: 'r_multiple',
      key: 'r_multiple',
      render: (rMultiple) => (
        <Text style={{ 
          color: rMultiple >= 0 ? '#00ff88' : '#ff4757', 
          fontWeight: 'bold' 
        }}>
          {rMultiple ? `${rMultiple.toFixed(2)}R` : 'N/A'}
        </Text>
      ),
      width: 100,
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
      width: 100,
    },
    {
      title: 'Plan Followed',
      dataIndex: 'followed_plan',
      key: 'followed_plan',
      render: (followed) => (
        <Text style={{ 
          color: followed ? '#00ff88' : '#ff4757', 
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {followed ? 'YES' : 'NO'}
        </Text>
      ),
      width: 100,
      align: 'center',
    },
    {
      title: 'Emotion',
      dataIndex: 'emotional_state',
      key: 'emotional_state',
      render: (state) => (
        <Tag color={
          state === 'calm' ? 'green' : 
          state === 'fearful' ? 'red' : 
          state === 'overconfident' ? 'orange' : 
          'default'
        }>
          {state || '-'}
        </Tag>
      ),
      width: 100,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, trade) => (
        <Button
          type="primary"
          ghost
          icon={<EditOutlined />}
          onClick={() => navigate(`/edit-trade/${trade.id}`)}
          size="small"
        >
          Edit
        </Button>
      ),
      fixed: 'right',
      width: 80,
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

  // Generate month filter options
  const getMonthOptions = () => {
    const options = [{ label: 'All Trades', value: 'all' }];
    const now = new Date();
    
    // Add current month
    options.push({
      label: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      value: 'current-month'
    });
    
    // Add last 11 months
    for (let i = 1; i <= 11; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        label: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
        value: `month-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      });
    }
    
    return options;
  };

  const handleTableChange = (paginationConfig) => {
    setPagination({
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
      total: pagination.total
    });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12}>
          <div>
            <Title level={3} style={{ margin: 0, fontSize: window.innerWidth < 768 ? '20px' : '24px' }}>
              Trade History
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {timeFilter === 'all' ? 
                `Showing ${totalTrades} of ${pagination.total} total trades` :
                `Showing ${totalTrades} trades for selected period`
              }
            </Text>
          </div>
        </Col>
        <Col xs={24} sm={12}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            <Select
              value={timeFilter}
              onChange={(value) => {
                setTimeFilter(value);
                setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
              }}
              style={{ minWidth: 200 }}
              prefix={<CalendarOutlined />}
              placeholder="Filter by time period"
              options={getMonthOptions()}
            />
          </div>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            <Space wrap>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/add-trade')}
                size={window.innerWidth < 768 ? 'middle' : 'large'}
              >
                Add Trade
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                size={window.innerWidth < 768 ? 'middle' : 'large'}
              >
                Export
              </Button>
              <Upload
                beforeUpload={handleImport}
                showUploadList={false}
                accept=".xlsx,.xls"
                disabled={importing}
              >
                <Button
                  icon={<UploadOutlined />}
                  loading={importing}
                  size={window.innerWidth < 768 ? 'middle' : 'large'}
                >
                  Import
                </Button>
              </Upload>
            </Space>
          </div>
        </Col>
      </Row>

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
        <Card style={{ overflowX: 'auto' }}>
          <Table
            columns={columns}
            dataSource={trades}
            rowKey="id"
            scroll={{ 
              x: 1500,
              y: window.innerHeight - 400
            }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} trades`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) => {
                setPagination(prev => ({ ...prev, current: page, pageSize }));
              },
              onShowSizeChange: (current, size) => {
                setPagination(prev => ({ ...prev, current: 1, pageSize: size }));
              }
            }}
            onChange={handleTableChange}
            size={window.innerWidth < 768 ? 'small' : 'middle'}
            rowClassName={(record) => record.pnl >= 0 ? 'profitable-row' : 'loss-row'}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={6}>
                    <Text strong>Total</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong style={{ 
                      color: totalPnl >= 0 ? '#00ff88' : '#ff4757',
                      fontSize: '16px'
                    }}>
                      ₹{totalPnl.toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} colSpan={5} />
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
          <div style={{ marginTop: '10px', textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Tip: Scroll horizontally to see all columns. Date and Symbol are fixed for easy reference.
            </Text>
          </div>
        </Card>
      )}
    </Space>
  );
};

export default TradeLogs;