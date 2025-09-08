import { useState, useCallback, useEffect, RefObject } from 'react'

interface UseDiagramPanningProps {
  diagramRef: RefObject<HTMLDivElement>
}

export const useDiagramPanning = ({ diagramRef }: UseDiagramPanningProps) => {
  const [isPanning, setIsPanning] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 })

  // 패닝 시작 (빈 공간 클릭 시에만)
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    
    // 테이블 카드(TableCard)가 아닌 경우에만 패닝 시작
    // TableCard는 고유한 클래스들을 가지므로 더 구체적으로 확인
    if (
      !target.closest('[class*="bg-white"][class*="rounded-lg"][class*="shadow-lg"]') && // 테이블 카드 제외
      !target.closest('button') &&   // 버튼 제외
      !target.closest('svg') &&      // SVG 관계선 제외
      target.tagName !== 'INPUT' &&  // 입력 필드 제외
      target.tagName !== 'SELECT'    // 선택 박스 제외
    ) {
      setIsPanning(true)
      setPanStart({
        x: e.clientX - viewOffset.x,
        y: e.clientY - viewOffset.y
      })
      
      // 패닝 중에는 grab 커서로 변경
      if (diagramRef.current) {
        diagramRef.current.style.cursor = 'grabbing'
      }
      
      e.preventDefault()
    }
  }, [viewOffset, diagramRef])

  // 패닝 중
  const handlePanMove = useCallback((e: MouseEvent) => {
    if (!isPanning) return

    const newOffset = {
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    }

    setViewOffset(newOffset)
    
    // 다이어그램 컨테이너의 transform 적용
    if (diagramRef.current) {
      const diagramContent = diagramRef.current.querySelector('.diagram-content') as HTMLElement
      if (diagramContent) {
        diagramContent.style.transform = `translate(${newOffset.x}px, ${newOffset.y}px)`
      }
    }
  }, [isPanning, panStart, diagramRef])

  // 패닝 종료
  const handlePanEnd = useCallback(() => {
    setIsPanning(false)
    
    // 커서를 다시 grab으로 변경
    if (diagramRef.current) {
      diagramRef.current.style.cursor = 'grab'
    }
  }, [diagramRef])

  // 이벤트 리스너 등록/해제
  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handlePanMove)
      document.addEventListener('mouseup', handlePanEnd)
      return () => {
        document.removeEventListener('mousemove', handlePanMove)
        document.removeEventListener('mouseup', handlePanEnd)
      }
    }
  }, [isPanning, handlePanMove, handlePanEnd])

  return {
    handlePanStart,
    isPanning,
    viewOffset
  }
}