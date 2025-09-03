import { Modal, Typography, Card, Row, Col, Space, Tag, Divider } from 'antd';
import { 
  HeartOutlined, 
  ThunderboltOutlined, 
  EyeOutlined, 
  FireOutlined,
  SmileOutlined,
  MehOutlined,
  FrownOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const EntryEmotionalStatesGuide = ({ visible, onClose }) => {
  const emotionalStates = [
    {
      category: 'Positive Entry States',
      icon: <SmileOutlined style={{ color: '#00ff88' }} />,
      color: '#00ff88',
      states: [
        { name: 'confident', description: 'High conviction in setup, well-researched trade', impact: 'Positive' },
        { name: 'focused', description: 'Clear mind, following plan systematically', impact: 'Positive' },
        { name: 'patient', description: 'Waited for proper setup, not rushing', impact: 'Positive' },
        { name: 'disciplined', description: 'Sticking to rules, position sizing correctly', impact: 'Positive' },
        { name: 'calm', description: 'Relaxed state, no external pressure', impact: 'Positive' },
        { name: 'prepared', description: 'Done homework, understand risk-reward', impact: 'Positive' }
      ]
    },
    {
      category: 'Neutral Entry States',
      icon: <MehOutlined style={{ color: '#ffaa00' }} />,
      color: '#ffaa00',
      states: [
        { name: 'routine', description: 'Standard setup, following normal process', impact: 'Neutral' },
        { name: 'mechanical', description: 'Following system without emotion', impact: 'Neutral' },
        { name: 'alert', description: 'Attentive but not overly emotional', impact: 'Neutral' },
        { name: 'systematic', description: 'Following checklist methodically', impact: 'Neutral' }
      ]
    },
    {
      category: 'Warning Entry States',
      icon: <FrownOutlined style={{ color: '#ff4757' }} />,
      color: '#ff4757',
      states: [
        { name: 'anxious', description: 'Worried about outcome, second-guessing', impact: 'Negative' },
        { name: 'greedy', description: 'Oversizing position, chasing profits', impact: 'Negative' },
        { name: 'fomo', description: 'Fear of missing out, jumping in late', impact: 'Negative' },
        { name: 'uncertain', description: 'Not confident in setup, hesitating', impact: 'Negative' },
        { name: 'rushed', description: 'Feeling pressured to enter quickly', impact: 'Negative' },
        { name: 'overconfident', description: 'Ignoring risk, feeling invincible', impact: 'Negative' },
        { name: 'revenge-trading', description: 'Trying to recover previous losses', impact: 'Negative' },
        { name: 'bored', description: 'Entering trade for entertainment', impact: 'Negative' },
        { name: 'frustrated', description: 'Angry at market or previous losses', impact: 'Negative' },
        { name: 'tired', description: 'Mentally exhausted, poor focus', impact: 'Negative' }
      ]
    }
  ];

  return (
    <Modal
      title="📈 Emotional States Guide - Trade Entry"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 20 }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Introduction */}
        <Card style={{ backgroundColor: '#1a1a1a', border: '1px solid #00d9ff' }}>
          <Title level={4} style={{ color: '#00d9ff', marginTop: 0 }}>
            🧠 Why Track Entry Emotions?
          </Title>
          <Paragraph style={{ color: '#cccccc', marginBottom: 0 }}>
            Your emotional state when entering a trade significantly impacts your decision-making. 
            Tracking these emotions helps identify patterns that lead to profitable vs unprofitable trades.
            Use this guide to honestly assess your mindset before clicking "buy" or "sell".
          </Paragraph>
        </Card>

        {/* Emotional States Categories */}
        {emotionalStates.map((category, index) => (
          <Card 
            key={index}
            title={
              <Space>
                {category.icon}
                <Text strong style={{ color: category.color, fontSize: '16px' }}>
                  {category.category}
                </Text>
              </Space>
            }
            style={{ 
              backgroundColor: '#1a1a1a',
              border: `1px solid ${category.color}30`
            }}
          >
            <Row gutter={[12, 12]}>
              {category.states.map((state, stateIndex) => (
                <Col xs={24} sm={12} md={8} key={stateIndex}>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#2d2d2d',
                    borderRadius: '8px',
                    border: `1px solid ${category.color}20`,
                    height: '100%'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <Tag 
                        color={category.impact === 'Positive' ? 'green' : category.impact === 'Negative' ? 'red' : 'orange'}
                        style={{ margin: 0, fontSize: '10px' }}
                      >
                        {state.name}
                      </Tag>
                    </div>
                    <Text style={{ 
                      fontSize: '12px', 
                      color: '#cccccc',
                      lineHeight: '1.4'
                    }}>
                      {state.description}
                    </Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        ))}

        {/* Quick Tips */}
        <Card style={{ backgroundColor: '#2d1a3d', border: '1px solid #9c27b0' }}>
          <Title level={5} style={{ color: '#e1bee7', marginTop: 0 }}>
            💡 Quick Self-Assessment Tips
          </Title>
          <ul style={{ color: '#cccccc', paddingLeft: '20px' }}>
            <li><strong>Ask yourself:</strong> "How do I feel right now on a scale of 1-10?"</li>
            <li><strong>Physical check:</strong> Are your hands shaking? Heart racing? Palms sweaty?</li>
            <li><strong>Mental check:</strong> Are you thinking clearly or feeling pressured?</li>
            <li><strong>Red flags:</strong> If you're feeling any of the "warning states" - consider waiting</li>
            <li><strong>Multiple tags:</strong> You can select multiple emotions (e.g., "confident, focused")</li>
          </ul>
          
          <Divider style={{ borderColor: '#9c27b0' }} />
          
          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#3d1a3d', borderRadius: '8px' }}>
            <Text strong style={{ color: '#e1bee7' }}>
              💭 Remember: The best traders are emotionally aware traders
            </Text>
          </div>
        </Card>
      </Space>
    </Modal>
  );
};

export default EntryEmotionalStatesGuide;