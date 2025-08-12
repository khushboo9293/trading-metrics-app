import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Select, Button, DatePicker, InputNumber, Typography, Space, Alert } from 'antd';
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
  
  const [form] = Form.useForm();

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
        trade_date: values.trade_date.format('YYYY-MM-DD')
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
          mistakes: '',
          notes: '',
          trade_date: moment() // Reset to today
        });
        
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
            followed_plan: true,
            emotional_state: 'neutral'
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
            </Select>
          </Form.Item>

          <Form.Item
            label="Breakout Type"
            name="breakout_type"
          >
            <Select>
              <Select.Option value="vertical">Vertical</Select.Option>
              <Select.Option value="horizontal">Horizontal</Select.Option>
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
            label="Emotional State"
            name="emotional_state"
          >
            <Select>
              <Select.Option value="calm">Calm</Select.Option>
              <Select.Option value="fearful">Fearful</Select.Option>
              <Select.Option value="overconfident">Overconfident</Select.Option>
              <Select.Option value="neutral">Neutral</Select.Option>
            </Select>
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
            label="Mistakes (comma-separated)"
            name="mistakes"
          >
            <Input placeholder="e.g., chasing entry, early exit, oversized position" />
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