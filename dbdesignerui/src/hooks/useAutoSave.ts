import { useState, useCallback, useEffect, useRef } from 'react'
import { projectService } from '../services/projectService'

interface PendingChange {
  tableId: string
  position: { x: number; y: number }
  timestamp: number
}

interface UseAutoSaveProps {
  projectId: string | null
  onSaveStart?: () => void
  onSaveComplete?: () => void
  onSaveError?: (error: Error) => void
}

export const useAutoSave = ({ projectId, onSaveStart, onSaveComplete, onSaveError }: UseAutoSaveProps) => {
  const [pendingChanges, setPendingChanges] = useState<Record<string, PendingChange>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // 타이머 참조
  const autoSaveTimerRef = useRef<number>()
  const saveTimeoutRef = useRef<number>()

  // 변경 사항 추가
  const addPendingChange = useCallback((tableId: string, position: { x: number; y: number }) => {
    setPendingChanges(prev => ({
      ...prev,
      [tableId]: {
        tableId,
        position,
        timestamp: Date.now()
      }
    }))
    setHasUnsavedChanges(true)

    // 기존 자동저장 타이머 취소
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // 10초 후 자동저장 설정
    autoSaveTimerRef.current = setTimeout(() => {
      saveChanges()
    }, 10000)
  }, [])

  // 변경 사항 저장
  const saveChanges = useCallback(async () => {
    if (!projectId || Object.keys(pendingChanges).length === 0 || isSaving) {
      return
    }

    setIsSaving(true)
    onSaveStart?.()

    try {
      // 모든 대기 중인 변경 사항을 배치로 저장
      const savePromises = Object.values(pendingChanges).map(change =>
        projectService.updateTablePosition(projectId, change.tableId, change.position)
      )

      await Promise.all(savePromises)

      // 저장 완료 후 대기 중인 변경 사항 정리
      setPendingChanges({})
      setHasUnsavedChanges(false)
      onSaveComplete?.()

      console.log(`✅ 자동저장 완료: ${Object.keys(pendingChanges).length}개 테이블 위치 저장`)
    } catch (error) {
      console.error('❌ 자동저장 실패:', error)
      onSaveError?.(error as Error)
    } finally {
      setIsSaving(false)
    }
  }, [projectId, pendingChanges, isSaving, onSaveStart, onSaveComplete, onSaveError])

  // Ctrl+S 단축키 핸들러
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      saveChanges()
    }
  }, [saveChanges])

  // 키보드 이벤트 리스너 등록
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // 페이지 이탈 시 미저장 변경사항 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '저장되지 않은 변경사항이 있습니다. 정말 페이지를 떠나시겠습니까?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  return {
    addPendingChange,
    saveChanges,
    isSaving,
    hasUnsavedChanges,
    pendingChangesCount: Object.keys(pendingChanges).length
  }
}