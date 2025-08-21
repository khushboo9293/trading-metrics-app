import { Card, Typography, Divider, Tag, Space, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const MistakeGuide = () => {
  const navigate = useNavigate();

  const mistakeCategories = {
    entry: {
      title: '📘 Entry Mistakes',
      color: 'blue',
      mistakes: [
        {
          tag: 'fomo-entry',
          title: 'FOMO Entry',
          description: 'Fear of missing out entry',
          when: [
            'Entered because price was already moving significantly',
            'Fear that opportunity would be lost forever',
            'Emotional reaction to seeing others profit',
            'Entered at top of a strong move'
          ],
          examples: [
            'Stock up 5%, bought calls thinking it would continue',
            'Everyone on social media was buying, so I jumped in',
            'Saw breakout happening, entered at high of day'
          ]
        },
        {
          tag: 'impulse-entry',
          title: 'Impulse Entry',
          description: 'Impulsive entry without proper setup',
          when: [
            'Zero analysis or planning done',
            'Spontaneous reaction to price movement',
            'Not on watchlist, completely unplanned',
            'Pure emotional decision'
          ],
          examples: [
            'Saw green candles, immediately bought without thinking',
            'Random stock caught my eye, entered instantly',
            'Gut feeling trade with no technical reason'
          ]
        },
        {
          tag: 'chasing-breakout',
          title: 'Chasing Breakout',
          description: 'Chasing price after breakout',
          when: [
            'Entered after significant move already happened',
            'FOMO on momentum',
            'Bought at resistance instead of support',
            'Entry at extended levels'
          ],
          examples: [
            'Breakout happened at 18000, entered at 18150',
            'Waited for pullback but got impatient, chased the move',
            'Entered after 3rd green candle instead of first'
          ]
        },
        {
          tag: 'no-setup-entry',
          title: 'No Setup Entry',
          description: 'Entry without proper setup',
          when: [
            'No clear technical pattern or support/resistance',
            'Entry in middle of range',
            'No confluence of indicators',
            'Random entry point'
          ],
          examples: [
            'Entered at random price level with no support',
            'No clear pattern, just entered hoping for direction',
            'Entry had no technical justification'
          ]
        },
        {
          tag: 'poor-entry-level',
          title: 'Poor Entry Level',
          description: 'Entered near resistance/support level',
          when: [
            'Bought calls near strong resistance',
            'Bought puts near strong support',
            'Entry at likely reversal zone',
            'Poor risk-reward due to nearby key levels'
          ],
          examples: [
            'Bought 18000 calls when NIFTY at 17980 (resistance)',
            'Bought puts at major support level',
            'Entered long position at previous day\'s high'
          ]
        },
        {
          tag: 'poor-entry-timing',
          title: 'Poor Entry Timing',
          description: 'Entry timing too early/late',
          when: [
            'Entered too early before confirmation',
            'Entered too late after move extended',
            'Missed optimal entry point',
            'Poor timing relative to setup'
          ],
          examples: [
            'Entered before breakout confirmed (too early)',
            'Trend already 80% complete when entered (too late)',
            'Anticipated move that didn\'t happen yet'
          ]
        },
        {
          tag: 'contrarian-entry',
          title: 'Contrarian Entry',
          description: 'Entry against the trend',
          when: [
            'Tried to catch falling knife',
            'Fought against strong trend',
            'Counter-trend trade without clear reversal signal',
            'Picked bottom/top without confirmation'
          ],
          examples: [
            'Market falling hard, tried to catch bounce',
            'Strong uptrend, entered puts expecting reversal',
            'Went against clear market direction'
          ]
        }
      ]
    },
    exit: {
      title: '🚪 Exit Mistakes',
      color: 'green',
      mistakes: [
        {
          tag: 'early-exit',
          title: 'Early Exit',
          description: 'Exited too early before target',
          when: [
            'Closed position before reaching planned target',
            'Fear-based exit during normal pullback',
            'Took small profit instead of letting it run',
            'Exited on first sign of weakness'
          ],
          examples: [
            'Target was 100, exited at 50 due to fear',
            'Small pullback scared me, closed winning position',
            'Took quick profit instead of following plan'
          ]
        },
        {
          tag: 'late-exit',
          title: 'Late Exit',
          description: 'Exited too late after reversal',
          when: [
            'Held position too long after reversal signals',
            'Greed prevented timely exit',
            'Ignored stop loss or target',
            'Turned winning trade into loser'
          ],
          examples: [
            'In profit but held too long, became loss',
            'Clear reversal signals but didn\'t exit',
            'Greed made me hold past target'
          ]
        },
        {
          tag: 'moved-stop-loss',
          title: 'Moved Stop Loss',
          description: 'Moved stop loss against position',
          when: [
            'Moved stop further away when price approached',
            'Widened stop to avoid getting stopped out',
            'Changed original risk plan mid-trade',
            'Emotional adjustment of stop loss'
          ],
          examples: [
            'Stop at 17900, moved to 17850 when price hit 17910',
            'Widened stop because "setup still valid"',
            'Kept moving stop to avoid loss'
          ]
        },
        {
          tag: 'no-stop-loss',
          title: 'No Stop Loss',
          description: 'Traded without stop loss',
          when: [
            'No predetermined exit plan for losses',
            'Hoped and prayed strategy',
            'No risk management in place',
            'Unlimited loss potential'
          ],
          examples: [
            'Entered without any stop loss plan',
            'Thought position was "safe" without stop',
            'Kept holding losing position indefinitely'
          ]
        },
        {
          tag: 'poor-target',
          title: 'Poor Target',
          description: 'Target too small/large for setup',
          when: [
            'Target too small relative to risk',
            'Target too large for market conditions',
            'Poor risk-reward ratio',
            'Target ignored market structure'
          ],
          examples: [
            'Risk 100, target only 50 (too small)',
            'Expected 500 point move in sideways market (too large)',
            'Target beyond major resistance (unrealistic)'
          ]
        },
        {
          tag: 'emotional-exit',
          title: 'Emotional Exit',
          description: 'Exited based on emotions/panic',
          when: [
            'Fear or greed drove exit decision',
            'Panic due to market volatility',
            'News or market noise influenced exit',
            'Closed without thinking or planning'
          ],
          examples: [
            'News came out, panicked and closed',
            'Market crashed, panic sold everything',
            'Fear made me exit winning position early'
          ]
        }
      ]
    },
    position: {
      title: '📊 Position Management',
      color: 'orange',
      mistakes: [
        {
          tag: 'poor-position-size',
          title: 'Poor Position Size',
          description: 'Position size too large/small',
          when: [
            'Position too large - exceeded risk rules',
            'Position too small - missed opportunity',
            'Size caused emotional stress or was meaningless',
            'Not aligned with setup quality'
          ],
          examples: [
            'Risked 10% of account on one trade (too large)',
            'Great setup but risked only 0.1% (too small)',
            'Position so large couldn\'t sleep'
          ]
        },
        {
          tag: 'averaging-mistake',
          title: 'Averaging Mistake',
          description: 'Averaged down/up incorrectly',
          when: [
            'Added to losing position (averaging down)',
            'Added to winner at worse price (averaging up)',
            'Threw good money after bad',
            'Poor execution of scaling strategy'
          ],
          examples: [
            'Position in loss, bought more to lower average',
            'Added to winning position at top',
            'Doubled down on losing trade'
          ]
        },
        {
          tag: 'poor-stop-placement',
          title: 'Poor Stop Placement',
          description: 'Stop too tight/wide for volatility',
          when: [
            'Stop too tight - hit by normal volatility',
            'Stop too wide - excessive risk taken',
            'Didn\'t account for market noise',
            'Poor risk-reward due to stop placement'
          ],
          examples: [
            'Stop 5 points away in volatile market (too tight)',
            'Stop 500 points away for day trade (too wide)',
            'Normal market movement hit stop'
          ]
        }
      ]
    },
    psychology: {
      title: '🧠 Psychology/Emotion',
      color: 'red',
      mistakes: [
        {
          tag: 'fear-driven',
          title: 'Fear Driven',
          description: 'Decision driven by fear',
          when: [
            'Fear of loss influenced decision',
            'Avoided good setup due to fear',
            'Fear prevented proper execution',
            'Paralyzed by fear of being wrong'
          ],
          examples: [
            'Great setup but fear prevented entry',
            'Fear made me exit winning trade',
            'Scared to take any risk'
          ]
        },
        {
          tag: 'greed-driven',
          title: 'Greed Driven',
          description: 'Decision driven by greed',
          when: [
            'Greed influenced poor decisions',
            'Wanted unrealistic profits',
            'Greed prevented taking profits',
            'Excessive risk due to greed'
          ],
          examples: [
            'Greed made me hold past target',
            'Wanted to make quick fortune',
            'Greed caused oversized position'
          ]
        },
        {
          tag: 'overconfident',
          title: 'Overconfident',
          description: 'Overconfident in trade setup',
          when: [
            'Excessive confidence led to poor decisions',
            'Ignored risk management due to confidence',
            'Assumed trade was "sure thing"',
            'Arrogance caused mistakes'
          ],
          examples: [
            'So sure of trade, ignored stop loss',
            'Overconfident, took huge position',
            'Thought I couldn\'t be wrong'
          ]
        },
        {
          tag: 'revenge-mode',
          title: 'Revenge Mode',
          description: 'Trading to recover losses',
          when: [
            'Emotional state due to previous losses',
            'Desperate to get even',
            'Increased risk to recover quickly',
            'Trading outside normal strategy'
          ],
          examples: [
            'Lost money, immediately revenge traded',
            'Desperate to recover losses quickly',
            'Anger drove poor decisions'
          ]
        },
        {
          tag: 'tilted',
          title: 'Tilted',
          description: 'Emotional and irrational trading',
          when: [
            'Lost emotional control',
            'Multiple bad decisions in sequence',
            'Irrational behavior',
            'Trading while upset/angry'
          ],
          examples: [
            'Made 5 bad trades in a row while angry',
            'Completely lost control of emotions',
            'Irrational decisions due to tilt'
          ]
        },
        {
          tag: 'impatient',
          title: 'Impatient',
          description: 'Impatient with trade execution',
          when: [
            'Couldn\'t wait for proper setup',
            'Rushed entry/exit decisions',
            'Impatience caused poor timing',
            'Wanted immediate results'
          ],
          examples: [
            'Couldn\'t wait for pullback, chased entry',
            'Impatient, closed winning trade early',
            'Wanted instant gratification'
          ]
        }
      ]
    },
    plan: {
      title: '📋 Plan Deviation',
      color: 'purple',
      mistakes: [
        {
          tag: 'ignored-plan',
          title: 'Ignored Plan',
          description: 'Ignored predetermined trading plan',
          when: [
            'Had clear plan but didn\'t follow it',
            'Made decisions contrary to plan',
            'Abandoned strategy mid-trade',
            'Conscious deviation from plan'
          ],
          examples: [
            'Plan said wait, but entered anyway',
            'Had clear rules but ignored them',
            'Strategy said exit, but held position'
          ]
        },
        {
          tag: 'changed-plan-mid-trade',
          title: 'Changed Plan Mid-Trade',
          description: 'Changed plan during trade',
          when: [
            'Modified strategy while in position',
            'Changed targets/stops mid-trade',
            'Abandoned original thesis',
            'Shifted strategy due to emotions'
          ],
          examples: [
            'Day trade became swing trade',
            'Changed target mid-trade due to greed',
            'Modified stop loss multiple times'
          ]
        },
        {
          tag: 'no-plan',
          title: 'No Plan',
          description: 'Traded without a plan',
          when: [
            'No predetermined strategy',
            'No clear entry/exit criteria',
            'Winging it completely',
            'Hope-based trading'
          ],
          examples: [
            'Entered without any plan',
            'No idea when to exit',
            'Just hoping for profits'
          ]
        },
        {
          tag: 'rushed-decision',
          title: 'Rushed Decision',
          description: 'Made rushed trading decision',
          when: [
            'Time pressure caused poor execution',
            'Hurried through analysis',
            'Skipped important steps due to urgency',
            'Quick decision without proper thought'
          ],
          examples: [
            'Market closing, rushed into trade',
            'Quickly entered without full analysis',
            'Hurried decision due to time pressure'
          ]
        }
      ]
    },
    risk: {
      title: '⚠️ Risk Management',
      color: 'volcano',
      mistakes: [
        {
          tag: 'poor-risk-sizing',
          title: 'Poor Risk Sizing',
          description: 'Risk too high/low for account',
          when: [
            'Risk too high - exceeded safe limits',
            'Risk too low - profits meaningless',
            'Risk not aligned with conviction level',
            'Position size caused stress or was insignificant'
          ],
          examples: [
            'Risked 15% of account on one trade (too high)',
            'Great setup but risked only $10 (too low)',
            'Risk amount kept me awake at night'
          ]
        },
        {
          tag: 'no-risk-calculation',
          title: 'No Risk Calculation',
          description: 'No proper risk calculation done',
          when: [
            'Didn\'t calculate position size',
            'No clear risk amount determined',
            'Entered without knowing maximum loss',
            'Poor risk planning'
          ],
          examples: [
            'Entered without calculating risk',
            'No idea how much I could lose',
            'Didn\'t determine position size properly'
          ]
        },
        {
          tag: 'violated-risk-rules',
          title: 'Violated Risk Rules',
          description: 'Violated risk management rules',
          when: [
            'Broke predetermined risk limits',
            'Exceeded daily/weekly loss limits',
            'Violated position sizing rules',
            'Ignored risk management system'
          ],
          examples: [
            'Already hit daily loss limit but kept trading',
            'Broke 2% per trade rule',
            'Violated all risk management principles'
          ]
        }
      ]
    }
  };

  const renderMistake = (mistake) => (
    <Card key={mistake.tag} style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Tag color={mistakeCategories[Object.keys(mistakeCategories).find(cat => 
            mistakeCategories[cat].mistakes.some(m => m.tag === mistake.tag)
          )].color}>
            {mistake.tag}
          </Tag>
          <Title level={4} style={{ display: 'inline', marginLeft: 8 }}>
            {mistake.title}
          </Title>
        </div>
        
        <Text type="secondary">{mistake.description}</Text>
        
        <div>
          <Title level={5}>When to use:</Title>
          <ul>
            {mistake.when.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <Title level={5}>Examples:</Title>
          <ul>
            {mistake.examples.map((item, idx) => (
              <li key={idx} style={{ fontStyle: 'italic', color: '#666' }}>"{item}"</li>
            ))}
          </ul>
        </div>
      </Space>
    </Card>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
        <Title level={2} style={{ margin: 0 }}>Trading Mistake Tags Reference</Title>
      </div>

      <Card style={{ marginBottom: 24, backgroundColor: '#f6f8fa' }}>
        <Title level={4}>💡 Usage Tips:</Title>
        <ul>
          <li><strong>Multiple tags allowed</strong> - Use 2-3 tags if multiple mistakes occurred</li>
          <li><strong>Be honest</strong> - Accurate tagging helps identify patterns</li>
          <li><strong>Custom tags</strong> - Create new tags for unique situations</li>
          <li><strong>Review regularly</strong> - Analyze tag frequency to identify improvement areas</li>
          <li><strong>Category colors</strong> - Use visual cues to quickly identify mistake types</li>
        </ul>
      </Card>

      {Object.entries(mistakeCategories).map(([key, category]) => (
        <div key={key} style={{ marginBottom: 32 }}>
          <Title level={3}>{category.title}</Title>
          <Divider />
          {category.mistakes.map(renderMistake)}
        </div>
      ))}
    </div>
  );
};

export default MistakeGuide;