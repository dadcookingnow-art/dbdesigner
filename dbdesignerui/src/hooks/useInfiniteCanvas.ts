import { useMemo } from 'react'
import { Table } from '../types'

interface CanvasBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export const useInfiniteCanvas = (
  tables: Table[], 
  viewOffset: { x: number; y: number },
  padding: number = 500
) => {
  // 테이블들의 경계 계산
  const contentBounds = useMemo((): CanvasBounds => {
    if (tables.length === 0) {
      return {
        minX: -padding,
        minY: -padding,
        maxX: padding,
        maxY: padding,
        width: padding * 2,
        height: padding * 2
      }
    }

    // 모든 테이블의 위치에서 최소/최대 좌표 찾기
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    tables.forEach(table => {
      const tableWidth = 355 * 0.8  // min-width * scale
      const tableHeight = 200 * 0.8 // 대략적인 테이블 높이 * scale
      
      minX = Math.min(minX, table.position.x)
      minY = Math.min(minY, table.position.y)
      maxX = Math.max(maxX, table.position.x + tableWidth)
      maxY = Math.max(maxY, table.position.y + tableHeight)
    })

    // 여백 추가
    minX -= padding
    minY -= padding
    maxX += padding
    maxY += padding

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  }, [tables, padding])

  // 현재 뷰포트가 보는 영역 계산
  const viewportBounds = useMemo(() => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    return {
      left: -viewOffset.x,
      top: -viewOffset.y,
      right: -viewOffset.x + viewportWidth,
      bottom: -viewOffset.y + viewportHeight
    }
  }, [viewOffset])

  // 테이블이 뷰포트에 보이는지 확인
  const isTableVisible = useMemo(() => {
    return (table: Table) => {
      const tableWidth = 355 * 0.8
      const tableHeight = 200 * 0.8
      
      const tableLeft = table.position.x
      const tableTop = table.position.y
      const tableRight = table.position.x + tableWidth
      const tableBottom = table.position.y + tableHeight

      // 뷰포트와 테이블이 겹치는지 확인
      return !(
        tableRight < viewportBounds.left ||
        tableLeft > viewportBounds.right ||
        tableBottom < viewportBounds.top ||
        tableTop > viewportBounds.bottom
      )
    }
  }, [viewportBounds])

  return {
    contentBounds,
    viewportBounds,
    isTableVisible
  }
}