import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Select, Button, DatePicker, InputNumber, Typography, Space, Alert, Tag, TimePicker } from 'antd';
import { PlusOutlined, ArrowLeftOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import api from '../services/api';
import EntryEmotionalStatesGuide from '../guides/EntryEmotionalStates';
import ExitEmotionalStatesGuide from '../guides/ExitEmotionalStates';

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
  const [emotionTags, setEmotionTags] = useState([]);
  const [selectedEntryEmotions, setSelectedEntryEmotions] = useState([]);
  const [selectedExitEmotions, setSelectedExitEmotions] = useState([]);
  const [entryGuideVisible, setEntryGuideVisible] = useState(false);
  const [exitGuideVisible, setExitGuideVisible] = useState(false);
  
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMistakeTags();
    fetchEmotionTags();
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

  const fetchEmotionTags = async () => {
    try {
      const response = await api.get('/metrics/emotion-tags');
      setEmotionTags(response.data);
    } catch (error) {
      console.error('Error fetching emotion tags:', error);
      setEmotionTags([]);
    }
  };

  const createEmotionTag = async (tagName) => {
    try {
      const response = await api.post('/metrics/emotion-tags', { tag_name: tagName });
      return response.data;
    } catch (error) {
      console.error('Error creating emotion tag:', error);
      return null;
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
        entry_time: values.entry_time ? values.entry_time.format('HH:mm') : null,
        exit_time: values.exit_time ? values.exit_time.format('HH:mm') : null,
        mistakes: selectedTags.join(', '),
        emotional_state_entry: selectedEntryEmotions.join(', '),
        emotional_state_exit: selectedExitEmotions.join(', ')
      });
      
      if (saveAndAddAnother) {
        // Keep the form values but reset specific fields for new trade
        const currentValues = form.getFieldsValue();
        form.resetFields(['entry_price', 'exit_price', 'stop_loss', 'entry_time', 'exit_time', 'mistakes', 'notes']);
        form.setFieldsValue({
          ...currentValues,
          entry_price: null,
          exit_price: null,
          stop_loss: null,
          entry_time: null,
          exit_time: null,
          notes: '',
          trade_date: moment() // Reset to today
        });
        setSelectedTags([]); // Reset tags
        setSelectedEntryEmotions([]); // Reset entry emotions
        setSelectedExitEmotions([]); // Reset exit emotions
        
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
            underlying: 'Nifty',
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

          <Space direction="horizontal" style={{ width: '100%' }}>
            <Form.Item
              label="Entry Time (Optional)"
              name="entry_time"
              style={{ flex: 1 }}
            >
              <TimePicker 
                style={{ width: '100%' }} 
                format="HH:mm"
                placeholder="Entry time"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Exit Time (Optional)"
              name="exit_time"
              style={{ flex: 1 }}
            >
              <TimePicker 
                style={{ width: '100%' }} 
                format="HH:mm"
                placeholder="Exit time"
                size="large"
              />
            </Form.Item>
          </Space>

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
                placeholder="Type to add emotional state during entry (e.g., confident, anxious, excited)..."
                value={selectedEntryEmotions}
                onChange={async (values) => {
                  // Create new tags if they don't exist
                  const newTags = [];
                  for (const value of values) {
                    if (!emotionTags.find(tag => tag.tag_name === value)) {
                      const newTag = await createEmotionTag(value);
                      if (newTag) {
                        newTags.push(newTag);
                      }
                    }
                  }
                  if (newTags.length > 0) {
                    setEmotionTags(prev => [...prev, ...newTags]);
                  }
                  setSelectedEntryEmotions(values);
                }}
                showSearch
                filterOption={(input, option) => 
                  option?.value?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {emotionTags.map(tag => (
                  <Select.Option key={tag.tag_name} value={tag.tag_name}>
                    {tag.tag_name} {tag.usage_count > 1 && <span style={{color: '#666'}}>({tag.usage_count})</span>}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div>
              {selectedEntryEmotions.map(emotion => (
                <Tag 
                  key={emotion}
                  color="blue"
                  closable
                  onClose={() => setSelectedEntryEmotions(emotions => emotions.filter(e => e !== emotion))}
                  style={{ marginBottom: 4 }}
                >
                  {emotion}
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
                placeholder="Type to add emotional state during exit (e.g., relieved, frustrated, satisfied)..."
                value={selectedExitEmotions}
                onChange={async (values) => {
                  // Create new tags if they don't exist
                  const newTags = [];
                  for (const value of values) {
                    if (!emotionTags.find(tag => tag.tag_name === value)) {
                      const newTag = await createEmotionTag(value);
                      if (newTag) {
                        newTags.push(newTag);
                      }
                    }
                  }
                  if (newTags.length > 0) {
                    setEmotionTags(prev => [...prev, ...newTags]);
                  }
                  setSelectedExitEmotions(values);
                }}
                showSearch
                filterOption={(input, option) => 
                  option?.value?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {emotionTags.map(tag => (
                  <Select.Option key={tag.tag_name} value={tag.tag_name}>
                    {tag.tag_name} {tag.usage_count > 1 && <span style={{color: '#666'}}>({tag.usage_count})</span>}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div>
              {selectedExitEmotions.map(emotion => (
                <Tag 
                  key={emotion}
                  color="green"
                  closable
                  onClose={() => setSelectedExitEmotions(emotions => emotions.filter(e => e !== emotion))}
                  style={{ marginBottom: 4 }}
                >
                  {emotion}
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

export default AddTrade;