import { Table, Relationship } from '../types'

// Mock LLM 응답 생성
export const generateTableFromPrompt = (prompt: string): { table: Table; relationships?: Relationship[] } => {
  const mockResponses = {
    '주문': {
      table: {
        name: 'orders',
        fields: [
          { name: 'id', type: 'INTEGER', isPrimaryKey: true, isRequired: true },
          { name: 'user_id', type: 'INTEGER', isPrimaryKey: false, isRequired: true, isForeignKey: true, referencedTable: 'users', referencedField: 'id' },
          { name: 'total_amount', type: 'DECIMAL(10,2)', isPrimaryKey: false, isRequired: true },
          { name: 'status', type: 'VARCHAR(50)', isPrimaryKey: false, isRequired: true },
          { name: 'created_at', type: 'TIMESTAMP', isPrimaryKey: false, isRequired: true }
        ]
      },
      relationships: [
        {
          fromTable: 'users',
          fromField: 'id',
          toTable: 'orders',
          toField: 'user_id',
          type: '1:N' as const
        }
      ]
    },
    '상품': {
      table: {
        name: 'products',
        fields: [
          { name: 'id', type: 'INTEGER', isPrimaryKey: true, isRequired: true },
          { name: 'name', type: 'VARCHAR(200)', isPrimaryKey: false, isRequired: true },
          { name: 'price', type: 'DECIMAL(10,2)', isPrimaryKey: false, isRequired: true },
          { name: 'description', type: 'TEXT', isPrimaryKey: false, isRequired: false },
          { name: 'category_id', type: 'INTEGER', isPrimaryKey: false, isRequired: true, isForeignKey: true },
          { name: 'stock_quantity', type: 'INTEGER', isPrimaryKey: false, isRequired: true }
        ]
      }
    },
    '리뷰': {
      table: {
        name: 'reviews',
        fields: [
          { name: 'id', type: 'INTEGER', isPrimaryKey: true, isRequired: true },
          { name: 'product_id', type: 'INTEGER', isPrimaryKey: false, isRequired: true, isForeignKey: true, referencedTable: 'products', referencedField: 'id' },
          { name: 'user_id', type: 'INTEGER', isPrimaryKey: false, isRequired: true, isForeignKey: true, referencedTable: 'users', referencedField: 'id' },
          { name: 'rating', type: 'INTEGER', isPrimaryKey: false, isRequired: true },
          { name: 'comment', type: 'TEXT', isPrimaryKey: false, isRequired: false },
          { name: 'created_at', type: 'TIMESTAMP', isPrimaryKey: false, isRequired: true }
        ]
      },
      relationships: [
        {
          fromTable: 'products',
          fromField: 'id',
          toTable: 'reviews',
          toField: 'product_id',
          type: '1:N' as const
        },
        {
          fromTable: 'users',
          fromField: 'id',
          toTable: 'reviews',
          toField: 'user_id',
          type: '1:N' as const
        }
      ]
    }
  };

  for (const [key, data] of Object.entries(mockResponses)) {
    if (prompt.includes(key)) {
      return {
        table: {
          id: `t${Date.now()}`,
          position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 100 },
          ...data.table
        },
        relationships: ('relationships' in data && data.relationships) ? data.relationships.map((rel: Omit<Relationship, 'id'>) => ({
          ...rel,
          id: `r${Date.now()}_${Math.random()}`
        })) : undefined
      };
    }
  }

  // 기본 테이블 생성
  return {
    table: {
      id: `t${Date.now()}`,
      name: 'new_table',
      position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 100 },
      fields: [
        { name: 'id', type: 'INTEGER', isPrimaryKey: true, isRequired: true },
        { name: 'name', type: 'VARCHAR(100)', isPrimaryKey: false, isRequired: true },
        { name: 'created_at', type: 'TIMESTAMP', isPrimaryKey: false, isRequired: true }
      ]
    }
  };
};