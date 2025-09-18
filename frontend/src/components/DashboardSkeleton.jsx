import { Card, Skeleton, Row, Col, Space } from 'antd';

const DashboardSkeleton = () => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Period selector skeleton */}
      <Row justify="space-between" align="middle">
        <Col>
          <Skeleton.Button active style={{ width: 120, height: 32 }} />
        </Col>
        <Col>
          <Skeleton.Button active style={{ width: 150, height: 32 }} />
        </Col>
      </Row>

      {/* Stats cards skeleton */}
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map(i => (
          <Col xs={12} md={6} key={i}>
            <Card>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Chart skeleton */}
      <Card>
        <Skeleton.Input active style={{ width: '100%', height: 300 }} />
      </Card>

      {/* Additional cards skeleton */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default DashboardSkeleton;