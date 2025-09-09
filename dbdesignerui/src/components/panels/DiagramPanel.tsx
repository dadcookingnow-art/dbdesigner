import React, { useRef, useCallback } from 'react'
import { Database, Save, Loader2 } from 'lucide-react'
import { Project } from '../../types'
import { TableCard } from '../diagram/TableCard'
import { RelationshipLine } from '../diagram/RelationshipLine'
import { useOptimizedDrag } from '../../hooks/useOptimizedDrag'
import { useAutoSave } from '../../hooks/useAutoSave'
import { useTableDimensions } from '../../hooks/useTableDimensions'
import { useDiagramPanning } from '../../hooks/useDiagramPanning'
import { useInfiniteCanvas } from '../../hooks/useInfiniteCanvas'

interface DiagramPanelProps {
  currentProject: Project | null
  setCurrentProject: (project: Project) => void
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
  deleteTable: (tableId: string) => Promise<void>
  deleteRelationship: (relationshipId: string) => Promise<void>
  onEditRelationship?: (relationship: any) => void
}

export const DiagramPanel: React.FC<DiagramPanelProps> = ({
  currentProject,
  setCurrentProject,
  setProjects,
  deleteTable,
  deleteRelationship,
  onEditRelationship
}) => {
  const diagramRef = useRef<HTMLDivElement>(null)
  
  const { handlePanStart, isPanning, viewOffset } = useDiagramPanning({ diagramRef })

  // 자동저장 시스템
  const { addPendingChange, saveChanges, isSaving, hasUnsavedChanges, pendingChangesCount } = useAutoSave({
    projectId: currentProject?.id || null,
    onSaveStart: () => console.log('🔄 저장 시작...'),
    onSaveComplete: () => console.log('✅ 저장 완료!'),
    onSaveError: (error) => console.error('❌ 저장 실패:', error)
  })

  // 드래그 완료 콜백
  const handleDragComplete = useCallback((result: { tableId: string; finalPosition: { x: number; y: number }; hasChanged: boolean } | undefined) => {
    if (!result || !result.hasChanged || !currentProject) return

    // 전역 상태 업데이트 (즉시)
    const updatedProject = {
      ...currentProject,
      tables: currentProject.tables.map(table =>
        table.id === result.tableId
          ? { ...table, position: result.finalPosition }
          : table
      )
    }
    
    setCurrentProject(updatedProject)
    setProjects(prev => prev.map(p => p.id === currentProject.id ? updatedProject : p))

    // 자동저장 대기열에 추가
    addPendingChange(result.tableId, result.finalPosition)
  }, [currentProject, setCurrentProject, setProjects, addPendingChange])


  // 최적화된 드래그 훅
  const { draggedTable, draggedPosition, getTablePosition, handleMouseDown } = useOptimizedDrag({
    currentProject,
    diagramRef,
    viewOffset,
    onDragComplete: handleDragComplete
  })

  const { tableDimensions, registerTableRef } = useTableDimensions(
    currentProject?.tables || []
  )

  const { contentBounds, isTableVisible } = useInfiniteCanvas(
    currentProject?.tables || [],
    viewOffset
  )

  if (!currentProject) return null

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* 저장 상태 및 버튼 */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
        {hasUnsavedChanges && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-1 rounded-md text-sm flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span>{pendingChangesCount}개 변경사항 (10초 후 자동저장)</span>
          </div>
        )}
        
        <button
          onClick={saveChanges}
          disabled={!hasUnsavedChanges || isSaving}
          className={`px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors ${
            hasUnsavedChanges && !isSaving
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title="Ctrl+S로 저장"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? '저장 중...' : '저장'}</span>
        </button>
      </div>

      <div 
        ref={diagramRef}
        className={`absolute inset-0 bg-gray-50 overflow-hidden select-none ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handlePanStart}
      >
        {currentProject.tables.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">테이블이 없습니다</h3>
              <p className="text-gray-500">왼쪽 AI 어시스턴트에게 테이블 생성을 요청해보세요!</p>
            </div>
          </div>
        ) : (
          <div 
            className="diagram-content relative"
            style={{
              width: `${contentBounds.width}px`,
              height: `${contentBounds.height}px`,
              minWidth: '100%',
              minHeight: '100%'
            }}
          >
            {/* SVG for relationship lines */}
            <svg 
              className="absolute pointer-events-none" 
              style={{ 
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                zIndex: 5 
              }}
            >
              <defs>
                <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#00000020"/>
                </filter>
              </defs>
              {currentProject.relationships.map(relationship => {
                // 이 관계선이 드래그 중인 테이블과 관련있는지 확인
                const fromTableName = relationship.fromTable || relationship.from_table
                const toTableName = relationship.toTable || relationship.to_table
                const fromTable = currentProject.tables.find(t => t.name === fromTableName)
                const toTable = currentProject.tables.find(t => t.name === toTableName)
                
                const isRelated = draggedTable && fromTable && toTable && (
                  draggedTable === fromTable.id || draggedTable === toTable.id
                )

                return (
                  <RelationshipLine
                    key={relationship.id}
                    relationship={relationship}
                    currentProject={currentProject}
                    tableDimensions={tableDimensions}
                    svgOffset={{ x: 0, y: 0 }}
                    onDelete={deleteRelationship}
                    onEdit={(rel) => {
                      console.log('🔗 DiagramPanel: onEdit 호출', rel);
                      onEditRelationship?.(rel);
                    }}
                    draggedTableId={isRelated ? draggedTable : null}
                    draggedTablePosition={isRelated ? (draggedPosition || undefined) : undefined}
                  />
                )
              })}
            </svg>

            {/* Tables - 뷰포트에 보이는 것만 렌더링 */}
            {currentProject.tables
              .filter(isTableVisible)
              .map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  isDragged={draggedTable === table.id}
                  onMouseDown={(e) => handleMouseDown(e, table.id)}
                  onDelete={() => deleteTable(table.id)}
                  onRegisterRef={registerTableRef}
                  position={getTablePosition(table.id)}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}