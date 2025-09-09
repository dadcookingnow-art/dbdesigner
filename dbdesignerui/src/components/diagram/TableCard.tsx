import React, { useRef, useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Table, Index } from '../../types'

interface TableCardProps {
  table: Table
  isDragged: boolean
  isTopTable?: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onDelete: () => Promise<void>
  onRegisterRef?: (tableId: string, ref: React.RefObject<HTMLDivElement>) => void
  position?: { x: number; y: number }
  onEdit?: (table: Table) => void
}

export const TableCard: React.FC<TableCardProps> = ({
  table,
  isDragged,
  isTopTable = false,
  onMouseDown,
  onDelete,
  onRegisterRef,
  position,
  onEdit
}) => {
  const tableRef = useRef<HTMLDivElement>(null)
  const [lastClickTime, setLastClickTime] = useState<number>(0)

  // ref 등록
  useEffect(() => {
    if (onRegisterRef && tableRef.current) {
      onRegisterRef(table.id, tableRef)
    }
  }, [table.id, onRegisterRef])

  // 실시간 위치 (드래그 중이면 드래그 위치, 아니면 저장된 위치)
  const currentPosition = position || table.position

  // z-index 계산: 드래그 중 > 최상단 선택 > 일반
  const getZIndex = () => {
    if (isDragged) return 9999      // 드래그 중: 최상단
    if (isTopTable) return 100      // 최근 선택: 중간 상단
    return 10                       // 일반: 관계선 위
  }

  // 필드가 포함된 인덱스 찾기
  const getFieldIndexes = (fieldName: string): Index[] => {
    if (!table.indexes) return []
    return table.indexes.filter(index => index.fields.includes(fieldName))
  }

  // 마우스 다운 핸들러 - 더블클릭 체크
  const handleMouseDown = (e: React.MouseEvent) => {
    const currentTime = Date.now()
    const timeDiff = currentTime - lastClickTime
    
    // 더블클릭 감지 (300ms 이내)
    if (timeDiff < 300) {
      e.preventDefault()
      e.stopPropagation()
      if (onEdit) {
        onEdit(table)
      }
      setLastClickTime(0) // 더블클릭 처리 후 리셋
      return
    }
    
    setLastClickTime(currentTime)
    onMouseDown(e)
  }

  // 더블클릭 핸들러 - 기본 이벤트만 방지
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  return (
    <div
      ref={tableRef}
      className={`absolute bg-white rounded-lg shadow-lg border-2 min-w-[355px] cursor-move ${
        isDragged ? 'border-blue-500 shadow-xl' : 'border-gray-200'
      }`}
      style={{
        left: `${currentPosition.x}px`,
        top: `${currentPosition.y}px`,
        zIndex: getZIndex(),
        transform: 'scale(0.8)',
        transformOrigin: 'top left'
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Table Header */}
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
        <h3 className="font-bold text-lg">{table.name}</h3>
        <button
          onClick={async (e) => {
            e.stopPropagation()
            try {
              await onDelete()
            } catch (error: any) {
              console.error('테이블 삭제 실패:', error)
            }
          }}
          className="p-1 hover:bg-blue-700 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      {/* Table Fields */}
      <div className="p-2 max-h-80 overflow-y-auto">
        {table.fields.map((field, index) => {
          const fieldIndexes = getFieldIndexes(field.name)
          
          return (
            <div
              key={index}
              className={`flex items-center justify-between p-2 border-b last:border-b-0 transition-colors hover:bg-gray-50 ${
                field.isPrimaryKey ? 'bg-yellow-50' : field.isForeignKey ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {/* 키 타입 및 인덱스 표시 */}
                <div className="flex items-center space-x-1">
                  {field.isPrimaryKey && (
                    <span className="text-xs font-bold text-yellow-700 bg-yellow-200 px-1.5 py-0.5 rounded">
                      P
                    </span>
                  )}
                  {field.isForeignKey && (
                    <span className="text-xs font-bold text-blue-700 bg-blue-200 px-1.5 py-0.5 rounded">
                      F
                    </span>
                  )}
                  {fieldIndexes.length > 0 && (
                    <span 
                      className="text-xs font-bold text-green-700 bg-green-200 px-1.5 py-0.5 rounded cursor-help"
                      title={`인덱스: ${fieldIndexes.map(idx => `${idx.name} (${idx.type})`).join(', ')}`}
                    >
                      I
                    </span>
                  )}
                </div>
              
              {/* 컬럼명 (말줄임표 적용) */}
              <div className="flex-1 min-w-0">
                <span 
                  className={`font-medium text-sm truncate block ${
                    field.isPrimaryKey ? 'text-yellow-800' : 
                    field.isForeignKey ? 'text-blue-800' : 'text-gray-900'
                  }`}
                  title={field.name} // 호버 시 전체 이름 표시
                >
                  {field.name}
                </span>
                {field.isForeignKey && field.referencedTable && (
                  <div className="text-xs text-blue-600 truncate" title={`→ ${field.referencedTable}.${field.referencedField}`}>
                    → {field.referencedTable}.{field.referencedField}
                  </div>
                )}
              </div>
            </div>
            
            {/* NULL 가능 여부와 타입 */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* NULL 표시 */}
              {!field.isRequired && !field.isPrimaryKey && (
                <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                  NULL
                </span>
              )}
              {/* 타입 */}
              <span className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                {field.type}
              </span>
            </div>
          </div>
          );
        })}
      </div>
      
      {/* Table Footer */}
      <div className="px-3 py-2 bg-gray-50 rounded-b-lg text-xs text-gray-500">
        <div className="flex justify-between items-center">
          <span>{table.fields.length}개 필드</span>
          {table.indexes && table.indexes.length > 0 && (
            <span 
              className="cursor-help" 
              title={`인덱스: ${table.indexes.map(idx => `${idx.name} (${idx.type})`).join(', ')}`}
            >
              📊 {table.indexes.length}개 인덱스
            </span>
          )}
        </div>
      </div>
    </div>
  )
}