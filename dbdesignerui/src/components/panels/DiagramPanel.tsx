import React, { useRef } from 'react'
import { Database } from 'lucide-react'
import { Project } from '../../types'
import { TableCard } from '../diagram/TableCard'
import { RelationshipLine } from '../diagram/RelationshipLine'
import { useDragAndDrop } from '../../hooks/useDragAndDrop'
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

  const { draggedTable, handleMouseDown } = useDragAndDrop({
    currentProject,
    setCurrentProject,
    setProjects,
    diagramRef,
    viewOffset
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
                left: `${contentBounds.minX}px`,
                top: `${contentBounds.minY}px`,
                width: `${contentBounds.width}px`,
                height: `${contentBounds.height}px`,
                zIndex: 5 
              }}
            >
              <defs>
                <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#00000020"/>
                </filter>
              </defs>
              {currentProject.relationships.map(relationship => (
                <RelationshipLine
                  key={relationship.id}
                  relationship={relationship}
                  currentProject={currentProject}
                  tableDimensions={tableDimensions}
                  svgOffset={{ x: contentBounds.minX, y: contentBounds.minY }}
                  onDelete={deleteRelationship}
                  onEdit={(rel) => {
                    console.log('🔗 DiagramPanel: onEdit 호출', rel);
                    onEditRelationship?.(rel);
                  }}
                />
              ))}
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
                />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}