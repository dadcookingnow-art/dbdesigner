import React from 'react'
import { Relationship, Project } from '../../types'
import { calculateConnectionPoints } from '../../utils/relationshipUtils'

interface TableDimensions {
  width: number
  height: number
  centerX: number
  centerY: number
  left: number
  right: number
  top: number
  bottom: number
}

interface RelationshipLineProps {
  relationship: Relationship
  currentProject: Project
  tableDimensions: { [tableId: string]: TableDimensions }
  svgOffset?: { x: number; y: number }
  onDelete: (relationshipId: string) => Promise<void>
  onEdit?: (relationship: Relationship) => void
}

export const RelationshipLine: React.FC<RelationshipLineProps> = ({
  relationship,
  currentProject,
  tableDimensions,
  svgOffset,
  onDelete,
  onEdit
}) => {
  const fromTable = currentProject.tables.find(t => t.name === (relationship.fromTable || relationship.from_table))
  const toTable = currentProject.tables.find(t => t.name === (relationship.toTable || relationship.to_table))

  if (!fromTable || !toTable) {
    console.warn('🚨 관계선 매칭 실패:', {
      relationship: relationship.id,
      찾는테이블: `${relationship.fromTable || relationship.from_table} → ${relationship.toTable || relationship.to_table}`,
      실제테이블: currentProject.tables.map(t => t.name).join(', ')
    })
    return null
  }

  // 동적 크기가 있으면 사용, 없으면 기본 계산 사용
  const fromDimensions = tableDimensions[fromTable.id]
  const toDimensions = tableDimensions[toTable.id]

  const { pathData, midX, midY } = calculateConnectionPoints(
    fromTable, 
    toTable, 
    fromDimensions, 
    toDimensions,
    svgOffset
  )

  const handleDelete = async () => {
    try {
      await onDelete(relationship.id)
    } catch (error: any) {
      console.error('관계 삭제 실패:', error)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('🖱️ 관계선 더블클릭:', relationship.id);
    if (onEdit) {
      console.log('✅ onEdit 호출:', relationship);
      onEdit(relationship);
    } else {
      console.log('❌ onEdit 함수가 없음');
    }
  }

  return (
    <g 
      key={relationship.id}
      className="group cursor-pointer"
      onDoubleClick={handleEdit}
    >
      {/* 관계선 - 클릭 영역 (투명, 넓음) */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="16"
        fill="none"
        style={{ pointerEvents: 'stroke' }}
      />
      
      {/* 관계선 - 기본 표시 */}
      <path
        d={pathData}
        stroke="#4f46e5"
        strokeWidth="2"
        fill="none"
        className="drop-shadow-sm transition-all duration-200 group-hover:stroke-blue-600"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* 관계선 - 호버 강조 효과 */}
      <path
        d={pathData}
        stroke="#3b82f6"
        strokeWidth="4"
        fill="none"
        className="opacity-0 group-hover:opacity-60 transition-all duration-200"
        style={{ 
          pointerEvents: 'none',
          filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))'
        }}
      />
      
      {/* 관계 타입 라벨 배경 */}
      <rect
        x={midX - 25}
        y={midY - 12}
        width="50"
        height="24"
        fill="white"
        fillOpacity="0.95"
        stroke="#4f46e5"
        strokeWidth="2"
        rx="8"
        className="drop-shadow-md transition-all duration-200 group-hover:fill-blue-50 group-hover:stroke-blue-600"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* 관계 타입 라벨 호버 강조 */}
      <rect
        x={midX - 25}
        y={midY - 12}
        width="50"
        height="24"
        fill="rgba(59, 130, 246, 0.1)"
        stroke="rgba(59, 130, 246, 0.8)"
        strokeWidth="2"
        rx="8"
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ 
          pointerEvents: 'none',
          filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.3))'
        }}
      />
      
      {/* 관계 타입 텍스트 */}
      <text
        x={midX}
        y={midY + 5}
        textAnchor="middle"
        fontSize="13"
        fill="#4f46e5"
        fontWeight="bold"
        className="select-none transition-all duration-200 group-hover:fill-blue-600"
        style={{ 
          pointerEvents: 'none',
          filter: 'drop-shadow(0px 1px 1px rgba(255,255,255,0.8))'
        }}
      >
        {relationship.type}
      </text>
      
      {/* 더블클릭 힌트 (호버 시 표시) */}
      <text
        x={midX}
        y={midY - 20}
        textAnchor="middle"
        fontSize="10"
        fill="#6b7280"
        fontWeight="normal"
        className="opacity-0 group-hover:opacity-75 transition-opacity duration-300 select-none"
        style={{ pointerEvents: 'none' }}
      >
        더블클릭하여 편집
      </text>
      
      {/* 관계 삭제 버튼 (호버 시 표시) */}
      <circle
        cx={midX + 35}
        cy={midY - 18}
        r="10"
        fill="#ef4444"
        fillOpacity="0.9"
        stroke="white"
        strokeWidth="2"
        className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
        style={{ pointerEvents: 'auto' }}
        onClick={handleDelete}
      />
      <text
        x={midX + 35}
        y={midY - 13}
        textAnchor="middle"
        fontSize="12"
        fill="white"
        fontWeight="bold"
        className="cursor-pointer select-none"
        style={{ pointerEvents: 'auto' }}
        onClick={handleDelete}
      >
        ×
      </text>
    </g>
  )
}