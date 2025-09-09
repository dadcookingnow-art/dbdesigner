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
  const [countdown, setCountdown] = useState(0) // 카운트다운 상태
  
  // 타이머 참조
  const autoSaveTimerRef = useRef<number>()
  const countdownTimerRef = useRef<number>()
  const saveTimeoutRef = useRef<number>()
  const saveInProgressRef = useRef(false) // 저장 중복 방지

  // 변경 사항 저장 (먼저 선언)
  const saveChanges = useCallback(async () => {
    console.log('🔍 saveChanges 호출됨:', {
      projectId,
      pendingChangesCount: Object.keys(pendingChanges).length,
      pendingChanges,
      isSaving,
      saveInProgress: saveInProgressRef.current
    })
    
    if (!projectId) {
      console.log('❌ projectId가 없음:', projectId)
      return
    }
    
    if (Object.keys(pendingChanges).length === 0) {
      console.log('❌ 저장할 변경사항이 없음')
      return
    }
    
    if (isSaving || saveInProgressRef.current) {
      console.log('❌ 이미 저장 중:', { isSaving, saveInProgress: saveInProgressRef.current })
      return
    }
    
    // 저장 시작 플래그
    saveInProgressRef.current = true

    // 타이머들 정리
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
    }

    setIsSaving(true)
    setCountdown(0) // 카운트다운 리셋
    onSaveStart?.()

    try {
      console.log('🔄 API 호출 시작...')
      
      // 모든 대기 중인 변경 사항을 배치로 저장
      const savePromises = Object.values(pendingChanges).map(change => {
        console.log(`📡 API 호출: updateTablePosition(${projectId}, ${change.tableId}, ${JSON.stringify(change.position)})`)
        return projectService.updateTablePosition(projectId, change.tableId, change.position)
      })

      const results = await Promise.all(savePromises)
      console.log('📡 API 응답:', results)

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
      saveInProgressRef.current = false // 저장 완료 플래그
    }
  }, [projectId, pendingChanges, isSaving, onSaveStart, onSaveComplete, onSaveError])

  // 변경 사항 추가
  const addPendingChange = useCallback((tableId: string, position: { x: number; y: number }) => {
    console.log('📝 addPendingChange 호출:', { tableId, position })
    
    // 저장 중이면 변경사항 추가 안함
    if (saveInProgressRef.current) {
      console.log('❌ 저장 중이므로 변경사항 추가 건너뜀')
      return
    }
    
    setPendingChanges(prev => {
      const newChanges = {
        ...prev,
        [tableId]: {
          tableId,
          position,
          timestamp: Date.now()
        }
      }
      console.log('📝 pendingChanges 업데이트:', newChanges)
      return newChanges
    })
    setHasUnsavedChanges(true)

    // 기존 타이머들 완전히 정리
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = undefined
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = undefined
    }

    // 카운트다운 시작 (10초)
    let currentCount = 10
    setCountdown(currentCount)
    console.log('⏰ 카운트다운 시작: 10초')
    
    // 1초마다 카운트다운 감소
    countdownTimerRef.current = setInterval(() => {
      currentCount--
      
      if (currentCount <= 0) {
        // 카운트다운 완료, 자동저장 실행
        console.log('⏰ 카운트다운 완료, 자동저장 실행')
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current)
          countdownTimerRef.current = undefined
        }
        setCountdown(0)
        // 저장이 진행 중이 아닐 때만 실행
        if (!saveInProgressRef.current) {
          saveChanges()
        }
      } else {
        setCountdown(currentCount)
      }
    }, 1000)

    // 백업 타이머 제거 (카운트다운으로 충분)
  }, [saveChanges])

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
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
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
    pendingChangesCount: Object.keys(pendingChanges).length,
    countdown // 카운트다운 상태 추가
  }
}