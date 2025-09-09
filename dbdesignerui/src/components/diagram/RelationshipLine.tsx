import React, { useMemo } from 'react'
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
  draggedTableId?: string | null
  draggedTablePosition?: { x: number; y: number }
}

const RelationshipLineComponent: React.FC<RelationshipLineProps> = ({
  relationship,
  currentProject,
  tableDimensions,
  svgOffset,
  onDelete,
  onEdit,
  draggedTableId,
  draggedTablePosition
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

  // 이 관계선이 드래그 중인 테이블과 관련있는지 확인
  const isRelatedToDraggedTable = draggedTableId && (
    draggedTableId === fromTable.id || draggedTableId === toTable.id
  )

  // 실시간 위치 및 관계선 계산 (선택적 최적화)
  const { pathData, midX, midY } = useMemo(() => {
    // 드래그 중인 테이블과 관련없으면 기존 위치 사용
    if (!isRelatedToDraggedTable) {
      const fromDimensions = tableDimensions[fromTable.id]
      const toDimensions = tableDimensions[toTable.id]
      
      return calculateConnectionPoints(
        fromTable, 
        toTable, 
        fromDimensions, 
        toDimensions,
        svgOffset
      )
    }

    // 관련된 관계선만 실시간 위치 계산
    const fromPosition = draggedTableId === fromTable.id && draggedTablePosition 
      ? draggedTablePosition 
      : fromTable.position
    const toPosition = draggedTableId === toTable.id && draggedTablePosition 
      ? draggedTablePosition 
      : toTable.position
    
    const fromTableWithRealTimePosition = { ...fromTable, position: fromPosition }
    const toTableWithRealTimePosition = { ...toTable, position: toPosition }

    const fromDimensions = tableDimensions[fromTable.id]
    const toDimensions = tableDimensions[toTable.id]

    return calculateConnectionPoints(
      fromTableWithRealTimePosition, 
      toTableWithRealTimePosition, 
      fromDimensions, 
      toDimensions,
      svgOffset
    )
  }, [
    // 기본 의존성 (항상 필요)
    fromTable.id, 
    toTable.id, 
    fromTable.position.x,
    fromTable.position.y,
    toTable.position.x,
    toTable.position.y,
    tableDimensions[fromTable.id], 
    tableDimensions[toTable.id],
    svgOffset?.x,
    svgOffset?.y,
    // 관련된 관계선만 드래그 상태에 의존
    isRelatedToDraggedTable ? draggedTableId : null,
    isRelatedToDraggedTable ? draggedTablePosition?.x : null,
    isRelatedToDraggedTable ? draggedTablePosition?.y : null
  ])

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

// 메모이제이션으로 불필요한 리렌더링 방지
export const RelationshipLine = React.memo(RelationshipLineComponent)