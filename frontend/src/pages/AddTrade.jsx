import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Select, Button, DatePicker, InputNumber, Typography, Space, Alert, Tag } from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import moment from 'moment';
import api from '../services/api';

const { Title } = Typography;
const { TextArea } = Input;

const AddTrade = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [addingAnother, setAddingAnother] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [mistakeTags, setMistakeTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMistakeTags();
  }, []);

  const fetchMistakeTags = async () => {
    try {
      const response = await api.get('/metrics/tags');
      console.log('Fetched tags:', response.data);
      setMistakeTags(response.data);
    } catch (err) {
      console.error('Failed to fetch mistake tags:', err);
      // Fallback to hardcoded tags if API fails
      const fallbackTags = [
        { tag_name: 'fomo-entry', category: 'entry', description: 'Fear of missing out entry' },
        { tag_name: 'impulse-entry', category: 'entry', description: 'Impulsive entry without proper setup' },
        { tag_name: 'chasing-breakout', category: 'entry', description: 'Chasing price after breakout' },
        { tag_name: 'no-setup-entry', category: 'entry', description: 'Entry without proper setup' },
        { tag_name: 'poor-entry-level', category: 'entry', description: 'Entered near resistance/support level' },
        { tag_name: 'poor-entry-timing', category: 'entry', description: 'Entry timing too early/late' },
        { tag_name: 'contrarian-entry', category: 'entry', description: 'Entry against the trend' },
        { tag_name: 'early-exit', category: 'exit', description: 'Exited too early before target' },
        { tag_name: 'late-exit', category: 'exit', description: 'Exited too late after reversal' },
        { tag_name: 'moved-stop-loss', category: 'exit', description: 'Moved stop loss against position' },
        { tag_name: 'no-stop-loss', category: 'exit', description: 'Traded without stop loss' },
        { tag_name: 'poor-target', category: 'exit', description: 'Target too small/large for setup' },
        { tag_name: 'emotional-exit', category: 'exit', description: 'Exited based on emotions/panic' },
        { tag_name: 'poor-position-size', category: 'position', description: 'Position size too large/small' },
        { tag_name: 'averaging-mistake', category: 'position', description: 'Averaged down/up incorrectly' },
        { tag_name: 'poor-stop-placement', category: 'position', description: 'Stop too tight/wide for volatility' },
        { tag_name: 'fear-driven', category: 'psychology', description: 'Decision driven by fear' },
        { tag_name: 'greed-driven', category: 'psychology', description: 'Decision driven by greed' },
        { tag_name: 'overconfident', category: 'psychology', description: 'Overconfident in trade setup' },
        { tag_name: 'revenge-mode', category: 'psychology', description: 'Trading to recover losses' },
        { tag_name: 'tilted', category: 'psychology', description: 'Emotional and irrational trading' },
        { tag_name: 'impatient', category: 'psychology', description: 'Impatient with trade execution' },
        { tag_name: 'ignored-plan', category: 'plan', description: 'Ignored predetermined trading plan' },
        { tag_name: 'changed-plan-mid-trade', category: 'plan', description: 'Changed plan during trade' },
        { tag_name: 'no-plan', category: 'plan', description: 'Traded without a plan' },
        { tag_name: 'rushed-decision', category: 'plan', description: 'Made rushed trading decision' },
        { tag_name: 'poor-risk-sizing', category: 'risk', description: 'Risk too high/low for account' },
        { tag_name: 'no-risk-calculation', category: 'risk', description: 'No proper risk calculation done' },
        { tag_name: 'violated-risk-rules', category: 'risk', description: 'Violated risk management rules' }
      ];
      setMistakeTags(fallbackTags);
    }
  };

  const handleSubmit = async (values, saveAndAddAnother = false) => {
    if (saveAndAddAnother) {
      setAddingAnother(true);
    } else {
      setLoading(true);
    }
    setError('');
    setSuccessMessage('');

    try {
      await api.post('/trades', {
        ...values,
        trade_date: values.trade_date.format('YYYY-MM-DD'),
        mistakes: selectedTags.join(', ')
      });
      
      if (saveAndAddAnother) {
        // Keep the form values but reset specific fields for new trade
        const currentValues = form.getFieldsValue();
        form.resetFields(['entry_price', 'exit_price', 'stop_loss', 'mistakes', 'notes']);
        form.setFieldsValue({
          ...currentValues,
          entry_price: null,
          exit_price: null,
          stop_loss: null,
          notes: '',
          trade_date: moment() // Reset to today
        });
        setSelectedTags([]); // Reset tags
        
        setSuccessMessage('Trade saved successfully! Ready for next trade.');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        navigate('/trades');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save trade');
    } finally {
      setLoading(false);
      setAddingAnother(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={3} style={{ fontSize: window.innerWidth < 768 ? '20px' : '24px' }}>Add New Trade</Title>
      
      {error && (
        <Alert message={error} type="error" showIcon />
      )}

      {successMessage && (
        <Alert message={successMessage} type="success" showIcon />
      )}

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            option_type: 'call',
            breakout_type: 'vertical',
            nifty_range: 'inside_day',
            trade_date: moment(),
            followed_plan: true
          }}
        >
          <Form.Item
            label="Underlying"
            name="underlying"
            rules={[{ required: true, message: 'Please enter the underlying!' }]}
          >
            <Input placeholder="e.g., Nifty, Bank Nifty, RELIANCE" />
          </Form.Item>

          <Form.Item
            label="Option Type"
            name="option_type"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="call">Call</Select.Option>
              <Select.Option value="put">Put</Select.Option>
              <Select.Option value="none">None</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Breakout Type"
            name="breakout_type"
          >
            <Select>
              <Select.Option value="vertical">Vertical</Select.Option>
              <Select.Option value="horizontal">Horizontal</Select.Option>
              <Select.Option value="none">None</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Nifty Range"
            name="nifty_range"
          >
            <Select>
              <Select.Option value="inside_day">Inside Day</Select.Option>
              <Select.Option value="outside_bullish">Outside (Bullish)</Select.Option>
              <Select.Option value="outside_bearish">Outside (Bearish)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Entry Price"
            name="entry_price"
            rules={[{ required: true, message: 'Please enter entry price!' }]}
          >
            <InputNumber style={{ width: '100%' }} step={0.01} />
          </Form.Item>

          <Form.Item
            label="Stop Loss (Optional)"
            name="stop_loss"
            extra="Leave empty if no stop loss was set for this trade"
          >
            <InputNumber style={{ width: '100%' }} step={0.01} placeholder="No stop loss" />
          </Form.Item>

          <Form.Item
            label="Exit Price"
            name="exit_price"
            rules={[{ required: true, message: 'Please enter exit price!' }]}
          >
            <InputNumber style={{ width: '100%' }} step={0.01} />
          </Form.Item>

          <Form.Item
            label="Quantity (units)"
            name="quantity"
            rules={[{ required: true, message: 'Please enter quantity!' }]}
            extra="Enter individual units (e.g., Nifty: 25 units = 1 lot, Bank Nifty: 15 units = 1 lot)"
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="e.g., 25 units for 1 lot of Nifty" />
          </Form.Item>

          <Form.Item
            label="Trade Date"
            name="trade_date"
            rules={[{ required: true, message: 'Please select trade date!' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>


          <Form.Item
            label="Followed Trading Plan"
            name="followed_plan"
          >
            <Select>
              <Select.Option value={true}>Yes</Select.Option>
              <Select.Option value={false}>No</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={
              <span>
                Mistakes{' '}
                <a 
                  href="/mistake-guide" 
                  target="_blank" 
                  style={{ fontSize: '12px', marginLeft: '8px' }}
                >
                  View Mistake Guide
                </a>
              </span>
            }
          >
            <div style={{ marginBottom: 8 }}>
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Type to search or add new mistake tags..."
                value={selectedTags}
                onChange={setSelectedTags}
                showSearch
                filterOption={(input, option) => {
                  // Handle the complex children structure
                  const tagName = option?.value?.toLowerCase();
                  return tagName?.includes(input.toLowerCase());
                }}
                dropdownRender={(menu) => (
                  <div>
                    {menu}
                    <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0', fontSize: '12px', color: '#666' }}>
                      Start typing to add custom tags or select from suggestions
                    </div>
                  </div>
                )}
              >
                {mistakeTags.map(tag => (
                  <Select.Option key={tag.tag_name} value={tag.tag_name}>
                    <div>
                      <span>{tag.tag_name}</span>
                      <br />
                      <small style={{ color: '#666' }}>{tag.description}</small>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div style={{ marginTop: 8 }}>
              {selectedTags.map(tag => {
                const tagInfo = mistakeTags.find(t => t.tag_name === tag);
                const categoryColors = {
                  entry: 'blue',
                  exit: 'green',
                  position: 'orange',
                  psychology: 'red',
                  plan: 'purple',
                  risk: 'volcano'
                };
                return (
                  <Tag 
                    key={tag} 
                    color={categoryColors[tagInfo?.category] || 'default'}
                    closable
                    onClose={() => setSelectedTags(tags => tags.filter(t => t !== tag))}
                    style={{ marginBottom: 4 }}
                  >
                    {tag}
                  </Tag>
                );
              })}
            </div>
          </Form.Item>

          <Form.Item
            label="Notes"
            name="notes"
          >
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Space direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'} style={{ width: '100%' }}>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/trades')}
                block={window.innerWidth < 768}
              >
                Cancel
              </Button>
              <Button 
                type="default" 
                onClick={() => form.validateFields().then(values => handleSubmit(values, true))}
                loading={addingAnother}
                icon={<PlusOutlined />}
                block={window.innerWidth < 768}
              >
                {addingAnother ? 'Saving...' : window.innerWidth < 768 ? 'Save & Add Another' : 'Save & Add Another'}
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<PlusOutlined />}
                block={window.innerWidth < 768}
              >
                {loading ? 'Saving...' : 'Save Trade'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
};

export default AddTrade;