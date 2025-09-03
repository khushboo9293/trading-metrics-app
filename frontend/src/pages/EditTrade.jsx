import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, Select, Button, DatePicker, InputNumber, Typography, Space, Alert, Spin, Tag } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import api from '../services/api';
import EntryEmotionalStatesGuide from '../guides/EntryEmotionalStates';
import ExitEmotionalStatesGuide from '../guides/ExitEmotionalStates';

const { Title } = Typography;
const { TextArea } = Input;

const EditTrade = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [mistakeTags, setMistakeTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [emotionTags, setEmotionTags] = useState([]);
  const [selectedEntryEmotions, setSelectedEntryEmotions] = useState([]);
  const [selectedExitEmotions, setSelectedExitEmotions] = useState([]);
  const [entryGuideVisible, setEntryGuideVisible] = useState(false);
  const [exitGuideVisible, setExitGuideVisible] = useState(false);

  useEffect(() => {
    fetchTrade();
    fetchMistakeTags();
    fetchEmotionTags();
  }, [id]);

  const fetchMistakeTags = async () => {
    try {
      const response = await api.get('/metrics/tags');
      setMistakeTags(response.data);
    } catch (err) {
      console.error('Failed to fetch mistake tags:', err);
      // Fallback to hardcoded tags if API fails
      const fallbackTags = [
        { tag_name: 'fomo-entry', category: 'entry', description: 'Fear of missing out entry' },
        { tag_name: 'impulse-entry', category: 'entry', description: 'Impulsive entry without proper setup' },
        { tag_name: 'early-exit', category: 'exit', description: 'Exited too early before target' },
        { tag_name: 'late-exit', category: 'exit', description: 'Exited too late after reversal' },
        { tag_name: 'poor-position-size', category: 'position', description: 'Position size too large/small' },
        { tag_name: 'fear-driven', category: 'psychology', description: 'Decision driven by fear' },
        { tag_name: 'ignored-plan', category: 'plan', description: 'Ignored predetermined trading plan' },
        { tag_name: 'poor-risk-sizing', category: 'risk', description: 'Risk too high/low for account' }
      ];
      setMistakeTags(fallbackTags);
    }
  };

  const fetchEmotionTags = async () => {
    try {
      const response = await api.get('/metrics/emotion-tags');
      setEmotionTags(response.data);
    } catch (err) {
      console.error('Failed to fetch emotion tags:', err);
      // Fallback to default emotion tags
      const fallbackEmotions = [
        { tag_name: 'confident', category: 'positive' },
        { tag_name: 'focused', category: 'positive' },
        { tag_name: 'calm', category: 'positive' },
        { tag_name: 'anxious', category: 'negative' },
        { tag_name: 'greedy', category: 'negative' },
        { tag_name: 'fearful', category: 'negative' },
        { tag_name: 'neutral', category: 'neutral' }
      ];
      setEmotionTags(fallbackEmotions);
    }
  };

  const fetchTrade = async () => {
    try {
      const response = await api.get(`/trades/${id}`);
      const trade = response.data;
      form.setFieldsValue({
        underlying: trade.underlying || '',
        option_type: trade.option_type || 'call',
        breakout_type: trade.breakout_type || 'vertical',
        nifty_range: trade.nifty_range || 'inside_day',
        entry_price: trade.entry_price || 0,
        stop_loss: trade.stop_loss || null,
        exit_price: trade.exit_price || 0,
        quantity: trade.quantity || 0,
        trade_date: trade.trade_date ? moment(trade.trade_date) : moment(),
        followed_plan: trade.followed_plan !== undefined ? trade.followed_plan : true,
        notes: trade.notes || ''
      });
      // Set selected tags from mistakes string
      if (trade.mistakes) {
        const tags = trade.mistakes.split(',').map(tag => tag.trim()).filter(tag => tag);
        setSelectedTags(tags);
      }
      // Set emotional states
      if (trade.emotional_state_entry) {
        const entryEmotions = trade.emotional_state_entry.split(',').map(emotion => emotion.trim()).filter(emotion => emotion);
        setSelectedEntryEmotions(entryEmotions);
      }
      if (trade.emotional_state_exit) {
        const exitEmotions = trade.emotional_state_exit.split(',').map(emotion => emotion.trim()).filter(emotion => emotion);
        setSelectedExitEmotions(exitEmotions);
      }
    } catch (err) {
      setError('Failed to load trade data');
    } finally {
      setFetchLoading(false);
    }
  };


  const handleSubmit = async (values) => {
    setLoading(true);
    setError('');

    try {
      await api.put(`/trades/${id}`, {
        ...values,
        trade_date: values.trade_date.format('YYYY-MM-DD'),
        mistakes: selectedTags.join(', '),
        emotional_state_entry: selectedEntryEmotions.join(', '),
        emotional_state_exit: selectedExitEmotions.join(', ')
      });
      navigate('/trades');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update trade');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={3} style={{ fontSize: window.innerWidth < 768 ? '20px' : '24px' }}>Edit Trade</Title>
      
      {error && (
        <Alert message={error} type="error" showIcon />
      )}

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
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

          {/* Emotional State Fields */}
          <Form.Item
            label={
              <Space>
                <span>Emotional State During Entry</span>
                <Button 
                  type="link" 
                  size="small"
                  icon={<QuestionCircleOutlined />}
                  onClick={() => setEntryGuideVisible(true)}
                  style={{ color: '#00d9ff', padding: 0 }}
                >
                  Guide
                </Button>
              </Space>
            }
          >
            <div style={{ marginBottom: 8 }}>
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Select or add entry emotions"
                value={selectedEntryEmotions}
                onChange={setSelectedEntryEmotions}
                options={emotionTags.map(emotion => ({
                  label: emotion.tag_name,
                  value: emotion.tag_name
                }))}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {emotionTags.filter(emotion => emotion.category === 'positive').slice(0, 6).map(emotion => (
                <Tag
                  key={emotion.tag_name}
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: selectedEntryEmotions.includes(emotion.tag_name) ? '#00ff8820' : '#2d2d2d',
                    borderColor: selectedEntryEmotions.includes(emotion.tag_name) ? '#00ff88' : '#555',
                    color: selectedEntryEmotions.includes(emotion.tag_name) ? '#00ff88' : '#ccc'
                  }}
                  onClick={() => {
                    if (selectedEntryEmotions.includes(emotion.tag_name)) {
                      setSelectedEntryEmotions(selectedEntryEmotions.filter(e => e !== emotion.tag_name));
                    } else {
                      setSelectedEntryEmotions([...selectedEntryEmotions, emotion.tag_name]);
                    }
                  }}
                >
                  {emotion.tag_name}
                </Tag>
              ))}
            </div>
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <span>Emotional State During Exit</span>
                <Button 
                  type="link" 
                  size="small"
                  icon={<QuestionCircleOutlined />}
                  onClick={() => setExitGuideVisible(true)}
                  style={{ color: '#ff6b35', padding: 0 }}
                >
                  Guide
                </Button>
              </Space>
            }
          >
            <div style={{ marginBottom: 8 }}>
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Select or add exit emotions"
                value={selectedExitEmotions}
                onChange={setSelectedExitEmotions}
                options={emotionTags.map(emotion => ({
                  label: emotion.tag_name,
                  value: emotion.tag_name
                }))}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {emotionTags.filter(emotion => emotion.category === 'positive').slice(0, 6).map(emotion => (
                <Tag
                  key={emotion.tag_name}
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: selectedExitEmotions.includes(emotion.tag_name) ? '#00ff8820' : '#2d2d2d',
                    borderColor: selectedExitEmotions.includes(emotion.tag_name) ? '#00ff88' : '#555',
                    color: selectedExitEmotions.includes(emotion.tag_name) ? '#00ff88' : '#ccc'
                  }}
                  onClick={() => {
                    if (selectedExitEmotions.includes(emotion.tag_name)) {
                      setSelectedExitEmotions(selectedExitEmotions.filter(e => e !== emotion.tag_name));
                    } else {
                      setSelectedExitEmotions([...selectedExitEmotions, emotion.tag_name]);
                    }
                  }}
                >
                  {emotion.tag_name}
                </Tag>
              ))}
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
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
                block={window.innerWidth < 768}
              >
                {loading ? 'Updating...' : 'Update Trade'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Emotional States Guides */}
      <EntryEmotionalStatesGuide 
        visible={entryGuideVisible}
        onClose={() => setEntryGuideVisible(false)}
      />
      
      <ExitEmotionalStatesGuide 
        visible={exitGuideVisible}
        onClose={() => setExitGuideVisible(false)}
      />
    </Space>
  );
};

export default EditTrade;