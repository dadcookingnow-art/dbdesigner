import { useState, useCallback, useEffect } from 'react'
import { Project } from '../types'
import { projectService } from '../services/projectService'

interface UseDragAndDropProps {
  currentProject: Project | null
  setCurrentProject: (project: Project) => void
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
  diagramRef: React.RefObject<HTMLDivElement>
  viewOffset?: { x: number; y: number }
}

export const useDragAndDrop = ({
  currentProject,
  setCurrentProject,
  setProjects,
  diagramRef,
  viewOffset = { x: 0, y: 0 }
}: UseDragAndDropProps) => {
  const [draggedTable, setDraggedTable] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent, tableId: string) => {
    const table = currentProject?.tables.find(t => t.id === tableId)
    if (!table) return

    const rect = e.currentTarget.getBoundingClientRect()
    const diagramRect = diagramRef.current?.getBoundingClientRect()
    if (!diagramRect) return

    setDraggedTable(tableId)
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })

    e.preventDefault()
  }, [currentProject, diagramRef])

  // 드래그 중
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedTable || !currentProject || !diagramRef.current) return

    const diagramRect = diagramRef.current.getBoundingClientRect()
    // 패닝 오프셋을 고려한 좌표 계산
    const newX = e.clientX - diagramRect.left - dragOffset.x - viewOffset.x
    const newY = e.clientY - diagramRect.top - dragOffset.y - viewOffset.y

    const updatedProject = {
      ...currentProject,
      tables: currentProject.tables.map(table =>
        table.id === draggedTable
          ? { ...table, position: { x: newX, y: newY } }  // 음수 좌표 허용
          : table
      )
    }

    setCurrentProject(updatedProject)
    setProjects(prev => prev.map(p => p.id === currentProject.id ? updatedProject : p))
  }, [draggedTable, currentProject, dragOffset, setCurrentProject, setProjects, diagramRef, viewOffset])

  // 드래그 종료
  const handleMouseUp = useCallback(async () => {
    if (draggedTable && currentProject) {
      const table = currentProject.tables.find(t => t.id === draggedTable)
      if (table) {
        try {
          // 위치 전용 API 사용
          await projectService.updateTablePosition(currentProject.id, draggedTable, table.position)
          console.log('✅ 테이블 위치 저장 완료:', { tableId: draggedTable, position: table.position })
        } catch (error) {
          console.error('❌ 위치 저장 실패:', error)
        }
      }
    }
    setDraggedTable(null)
    setDragOffset({ x: 0, y: 0 })
  }, [draggedTable, currentProject])

  // 이벤트 리스너 등록/해제
  useEffect(() => {
    if (draggedTable) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [draggedTable, handleMouseMove, handleMouseUp])

  return {
    draggedTable,
    handleMouseDown
  }
}