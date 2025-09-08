import { useState, useCallback, useEffect, RefObject } from 'react'
import { Table } from '../types'

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

interface TableDimensionsMap {
  [tableId: string]: TableDimensions
}

export const useTableDimensions = (tables: Table[]) => {
  const [tableDimensions, setTableDimensions] = useState<TableDimensionsMap>({})
  const [tableRefs, setTableRefs] = useState<Map<string, RefObject<HTMLDivElement>>>(new Map())

  // 테이블 ref 등록
  const registerTableRef = useCallback((tableId: string, ref: RefObject<HTMLDivElement>) => {
    setTableRefs(prev => {
      const newMap = new Map(prev)
      newMap.set(tableId, ref)
      return newMap
    })
  }, [])

  // 테이블 크기 측정
  const measureTable = useCallback((tableId: string, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect()
    const table = tables.find(t => t.id === tableId)
    if (!table) return

    // scale(0.8) 적용된 실제 크기
    const actualWidth = rect.width
    const actualHeight = rect.height
    
    const dimensions: TableDimensions = {
      width: actualWidth,
      height: actualHeight,
      left: table.position.x,
      right: table.position.x + actualWidth,
      top: table.position.y,
      bottom: table.position.y + actualHeight,
      centerX: table.position.x + actualWidth / 2,
      centerY: table.position.y + actualHeight / 2
    }

    setTableDimensions(prev => ({
      ...prev,
      [tableId]: dimensions
    }))
  }, [tables])

  // 모든 테이블 크기 업데이트
  const updateAllDimensions = useCallback(() => {
    tableRefs.forEach((ref, tableId) => {
      if (ref.current) {
        measureTable(tableId, ref.current)
      }
    })
  }, [tableRefs, measureTable])

  // 테이블 위치나 내용 변경 시 크기 재측정
  useEffect(() => {
    const timer = setTimeout(() => {
      updateAllDimensions()
    }, 100) // DOM 업데이트 후 측정

    return () => clearTimeout(timer)
  }, [tables, updateAllDimensions])

  // ResizeObserver로 크기 변화 감지
  useEffect(() => {
    const observers: ResizeObserver[] = []

    tableRefs.forEach((ref, tableId) => {
      if (ref.current) {
        const observer = new ResizeObserver(() => {
          if (ref.current) {
            measureTable(tableId, ref.current)
          }
        })
        observer.observe(ref.current)
        observers.push(observer)
      }
    })

    return () => {
      observers.forEach(observer => observer.disconnect())
    }
  }, [tableRefs, measureTable])

  return {
    tableDimensions,
    registerTableRef,
    updateAllDimensions
  }
}