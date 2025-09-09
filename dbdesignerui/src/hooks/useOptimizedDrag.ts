import { useState, useCallback, useEffect, useRef } from 'react'
import { Project } from '../types'

interface UseOptimizedDragProps {
  currentProject: Project | null
  diagramRef: React.RefObject<HTMLDivElement>
  viewOffset?: { x: number; y: number }
  onDragComplete?: (result: { tableId: string; finalPosition: { x: number; y: number }; hasChanged: boolean }) => void
}

interface DragState {
  tableId: string
  offset: { x: number; y: number }
  startPosition: { x: number; y: number }
}

export const useOptimizedDrag = ({
  currentProject,
  diagramRef,
  viewOffset = { x: 0, y: 0 },
  onDragComplete
}: UseOptimizedDragProps) => {
  // 드래그 상태 (로컬에서만 관리)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [draggedPositions, setDraggedPositions] = useState<Record<string, { x: number; y: number }>>({})
  
  // 애니메이션 프레임 요청 참조
  const animationFrameRef = useRef<number>()
  
  // 드래그 중인 테이블의 실시간 위치 가져오기
  const getTablePosition = useCallback((tableId: string) => {
    if (draggedPositions[tableId]) {
      return draggedPositions[tableId]
    }
    const table = currentProject?.tables.find(t => t.id === tableId)
    return table?.position || { x: 0, y: 0 }
  }, [draggedPositions, currentProject])

  // 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent, tableId: string) => {
    const table = currentProject?.tables.find(t => t.id === tableId)
    if (!table) return

    const rect = e.currentTarget.getBoundingClientRect()
    const diagramRect = diagramRef.current?.getBoundingClientRect()
    if (!diagramRect) return

    const dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    setDragState({
      tableId,
      offset: dragOffset,
      startPosition: { ...table.position }
    })

    e.preventDefault()
    e.stopPropagation()
  }, [currentProject, diagramRef])

  // 드래그 중 (성능 최적화된 업데이트)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState || !diagramRef.current) return

    // 이전 애니메이션 프레임 취소
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // 새 애니메이션 프레임 요청
    animationFrameRef.current = requestAnimationFrame(() => {
      const diagramRect = diagramRef.current?.getBoundingClientRect()
      if (!diagramRect) return

      const newX = e.clientX - diagramRect.left - dragState.offset.x - viewOffset.x
      const newY = e.clientY - diagramRect.top - dragState.offset.y - viewOffset.y

      const newPosition = { x: newX, y: newY }

      // 로컬 위치 상태 업데이트
      setDraggedPositions(prev => ({
        ...prev,
        [dragState.tableId]: newPosition
      }))
    })
  }, [dragState, diagramRef, viewOffset])

  // 드래그 종료
  const handleMouseUp = useCallback(() => {
    if (!dragState) return

    // 애니메이션 프레임 정리
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }

    const finalPosition = draggedPositions[dragState.tableId] || dragState.startPosition
    const result = {
      tableId: dragState.tableId,
      finalPosition,
      hasChanged: finalPosition.x !== dragState.startPosition.x || finalPosition.y !== dragState.startPosition.y
    }

    // 드래그 완료 콜백 호출
    if (result.hasChanged) {
      onDragComplete?.(result)
    }

    // 드래그 상태 정리
    setDragState(null)
    setDraggedPositions(prev => {
      const { [dragState.tableId]: removed, ...rest } = prev
      return rest
    })
  }, [dragState, draggedPositions, onDragComplete])

  // 이벤트 리스너 등록/해제
  useEffect(() => {
    if (dragState) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        
        // 정리 시 애니메이션 프레임도 정리
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }
  }, [dragState, handleMouseMove, handleMouseUp])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return {
    draggedTable: dragState?.tableId || null,
    draggedPosition: dragState ? draggedPositions[dragState.tableId] : null,
    getTablePosition,
    handleMouseDown,
    isDragging: !!dragState
  }
}