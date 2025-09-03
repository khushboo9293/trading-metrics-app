import { Modal, Typography, Card, Row, Col, Space, Tag, Divider } from 'antd';
import { 
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  HeartOutlined,
  SmileOutlined,
  MehOutlined,
  FrownOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const ExitEmotionalStatesGuide = ({ visible, onClose }) => {
  const emotionalStates = [
    {
      category: 'Positive Exit States',
      icon: <SmileOutlined style={{ color: '#00ff88' }} />,
      color: '#00ff88',
      states: [
        { name: 'satisfied', description: 'Hit target or stop as planned, following rules', impact: 'Positive' },
        { name: 'disciplined', description: 'Stuck to exit plan regardless of outcome', impact: 'Positive' },
        { name: 'relieved', description: 'Got out at right time, avoided bigger loss', impact: 'Positive' },
        { name: 'grateful', description: 'Thankful for profit or small loss vs bigger risk', impact: 'Positive' },
        { name: 'systematic', description: 'Followed trailing stop or planned exit', impact: 'Positive' },
        { name: 'patient', description: 'Let winner run or cut loss quickly', impact: 'Positive' }
      ]
    },
    {
      category: 'Neutral Exit States', 
      icon: <MehOutlined style={{ color: '#ffaa00' }} />,
      color: '#ffaa00',
      states: [
        { name: 'mechanical', description: 'Automatic exit based on system rules', impact: 'Neutral' },
        { name: 'routine', description: 'Standard exit, following normal process', impact: 'Neutral' },
        { name: 'indifferent', description: 'No strong emotion, accepting outcome', impact: 'Neutral' },
        { name: 'analytical', description: 'Reviewing what worked/didnt work', impact: 'Neutral' }
      ]
    },
    {
      category: 'Warning Exit States',
      icon: <FrownOutlined style={{ color: '#ff4757' }} />,
      color: '#ff4757',
      states: [
        { name: 'panic', description: 'Fear-driven exit, not following plan', impact: 'Negative' },
        { name: 'greedy', description: 'Holding too long hoping for more profit', impact: 'Negative' },
        { name: 'regret', description: 'Wishing you had exited earlier/later', impact: 'Negative' },
        { name: 'frustrated', description: 'Angry at market or trade outcome', impact: 'Negative' },
        { name: 'impatient', description: 'Exiting early due to boredom or anxiety', impact: 'Negative' },
        { name: 'hopeful', description: 'Holding losing position hoping for recovery', impact: 'Negative' },
        { name: 'fearful', description: 'Scared of further losses, premature exit', impact: 'Negative' },
        { name: 'stubborn', description: 'Refusing to accept you were wrong', impact: 'Negative' },
        { name: 'desperate', description: 'Need the trade to work, emotional attachment', impact: 'Negative' },
        { name: 'confused', description: 'Unsure what to do, making random decisions', impact: 'Negative' }
      ]
    }
  ];

  return (
    <Modal
      title="📉 Emotional States Guide - Trade Exit"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 20 }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Introduction */}
        <Card style={{ backgroundColor: '#1a1a1a', border: '1px solid #ff6b35' }}>
          <Title level={4} style={{ color: '#ff6b35', marginTop: 0 }}>
            🎯 Why Track Exit Emotions?
          </Title>
          <Paragraph style={{ color: '#cccccc', marginBottom: 0 }}>
            Your emotional state during exit determines whether you follow your plan or deviate from it.
            Exit emotions often reveal if you're cutting winners short, letting losses run, or making fear/greed-based decisions.
            Honest tracking helps identify patterns that hurt your performance.
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
                        color={state.impact === 'Positive' ? 'green' : state.impact === 'Negative' ? 'red' : 'orange'}
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

        {/* Exit Decision Framework */}
        <Card style={{ backgroundColor: '#1a3d1a', border: '1px solid #00ff88' }}>
          <Title level={5} style={{ color: '#00ff88', marginTop: 0 }}>
            ✅ Healthy Exit Decision Framework
          </Title>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div style={{ padding: '12px', backgroundColor: '#2d4a2d', borderRadius: '8px' }}>
                <Text strong style={{ color: '#00ff88', display: 'block', marginBottom: '8px' }}>
                  🎯 For Winners
                </Text>
                <ul style={{ color: '#cccccc', paddingLeft: '16px', fontSize: '12px' }}>
                  <li>Hit predetermined target</li>
                  <li>Trailing stop triggered</li>
                  <li>Setup invalidated (trend reversal)</li>
                  <li>Time-based exit (end of day/week)</li>
                </ul>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ padding: '12px', backgroundColor: '#4a2d2d', borderRadius: '8px' }}>
                <Text strong style={{ color: '#ff4757', display: 'block', marginBottom: '8px' }}>
                  🛑 For Losers
                </Text>
                <ul style={{ color: '#cccccc', paddingLeft: '16px', fontSize: '12px' }}>
                  <li>Stop loss hit exactly as planned</li>
                  <li>Setup clearly failed</li>
                  <li>Risk management rule triggered</li>
                  <li>Position size became too large</li>
                </ul>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Warning Signs */}
        <Card style={{ backgroundColor: '#3d1a1a', border: '1px solid #ff4757' }}>
          <Title level={5} style={{ color: '#ff4757', marginTop: 0 }}>
            🚨 Exit Emotion Red Flags
          </Title>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '12px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>😰</div>
                <Text strong style={{ color: '#ff4757', fontSize: '12px' }}>PANIC EXITS</Text>
                <div style={{ fontSize: '11px', color: '#cccccc', marginTop: '4px' }}>
                  "I need to get out NOW!"
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '12px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤑</div>
                <Text strong style={{ color: '#ff4757', fontSize: '12px' }}>GREED HOLDS</Text>
                <div style={{ fontSize: '11px', color: '#cccccc', marginTop: '4px' }}>
                  "Just a little more profit..."
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '12px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤞</div>
                <Text strong style={{ color: '#ff4757', fontSize: '12px' }}>HOPE PRAYERS</Text>
                <div style={{ fontSize: '11px', color: '#cccccc', marginTop: '4px' }}>
                  "Maybe it will turn around..."
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Action Items */}
        <Card style={{ backgroundColor: '#2d2d2d', border: '1px solid #00d9ff' }}>
          <Title level={5} style={{ color: '#00d9ff', marginTop: 0 }}>
            📝 How to Use This Guide
          </Title>
          <ol style={{ color: '#cccccc', paddingLeft: '20px' }}>
            <li><strong>Be brutally honest</strong> - No one else will see this data</li>
            <li><strong>Tag immediately</strong> - Record emotion right after exit, not later</li>
            <li><strong>Multiple tags OK</strong> - e.g., "frustrated, impatient" captures complexity</li>
            <li><strong>Review patterns</strong> - Look for emotions that correlate with losses</li>
            <li><strong>Create action plan</strong> - If you see negative patterns, plan countermeasures</li>
          </ol>
        </Card>
      </Space>
    </Modal>
  );
};

export default ExitEmotionalStatesGuide;