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

// 테이블 높이 계산 상수 (원본 크기) - 동적 크기가 없을 때 폴백용
export const TABLE_DIMENSIONS = {
  WIDTH: 224, // min-w-[224px] 기준
  BORDER_WIDTH: 2,
  HEADER_HEIGHT: 36, // py-3 + text
  FIELDS_CONTAINER_PADDING: 16, // p-2 * 2
  FIELD_HEIGHT: 60, // p-3 + content
  FOOTER_HEIGHT: 24, // py-2 + text
  SCALE_FACTOR: 0.8 // scaling factor applied to tables
}

// 테이블의 정확한 높이 계산
export const calculateTableHeight = (fieldsCount: number): number => {
  const { HEADER_HEIGHT, FIELDS_CONTAINER_PADDING, FIELD_HEIGHT, FOOTER_HEIGHT } = TABLE_DIMENSIONS
  return HEADER_HEIGHT + FIELDS_CONTAINER_PADDING + (fieldsCount * FIELD_HEIGHT) + FOOTER_HEIGHT
}

// 테이블 경계 박스 계산 (scaled 적용)
export const getTableBounds = (table: Table) => {
  const { WIDTH, BORDER_WIDTH, SCALE_FACTOR } = TABLE_DIMENSIONS
  const originalHeight = calculateTableHeight(table.fields.length)
  
  // CSS transform scale(0.8) with transform-origin: top left 적용된 실제 크기
  const scaledWidth = WIDTH * SCALE_FACTOR
  const scaledHeight = originalHeight * SCALE_FACTOR
  
  return {
    left: table.position.x,
    right: table.position.x + scaledWidth,
    top: table.position.y,
    bottom: table.position.y + scaledHeight,
    centerX: table.position.x + scaledWidth / 2,
    centerY: table.position.y + scaledHeight / 2,
    width: scaledWidth,
    height: scaledHeight
  }
}

// 관계선 연결점 계산 (동적 크기 지원)
export const calculateConnectionPoints = (
  fromTable: Table, 
  toTable: Table,
  fromDimensions?: TableDimensions,
  toDimensions?: TableDimensions,
  svgOffset?: { x: number; y: number }
) => {
  // 동적 크기가 있으면 사용, 없으면 계산된 크기 사용
  const fromRect = fromDimensions || getTableBounds(fromTable)
  const toRect = toDimensions || getTableBounds(toTable)
  
  // SVG 오프셋 적용 (SVG가 음수 좌표에서 시작하는 경우)
  const offsetX = svgOffset?.x || 0
  const offsetY = svgOffset?.y || 0
  
  // 테이블 간 방향 결정
  const deltaX = toRect.centerX - fromRect.centerX
  const deltaY = toRect.centerY - fromRect.centerY
  
  let startX, startY, endX, endY
  
  // 세로 방향이 더 큰 경우 (위아래 연결)
  if (Math.abs(deltaY) > Math.abs(deltaX)) {
    if (deltaY > 0) {
      // from 테이블이 위, to 테이블이 아래
      startX = fromRect.centerX - offsetX
      startY = fromRect.bottom - offsetY
      endX = toRect.centerX - offsetX
      endY = toRect.top - offsetY
    } else {
      // from 테이블이 아래, to 테이블이 위
      startX = fromRect.centerX - offsetX
      startY = fromRect.top - offsetY
      endX = toRect.centerX - offsetX
      endY = toRect.bottom - offsetY
    }
  } else {
    // 가로 방향이 더 큰 경우 (좌우 연결)
    if (deltaX > 0) {
      // from 테이블이 왼쪽, to 테이블이 오른쪽
      startX = fromRect.right - offsetX
      startY = fromRect.centerY - offsetY
      endX = toRect.left - offsetX
      endY = toRect.centerY - offsetY
    } else {
      // from 테이블이 오른쪽, to 테이블이 왼쪽
      startX = fromRect.left - offsetX
      startY = fromRect.centerY - offsetY
      endX = toRect.right - offsetX
      endY = toRect.centerY - offsetY
    }
  }

  const midX = (startX + endX) / 2
  const midY = (startY + endY) / 2

  // 방향에 따른 곡선 제어점 계산
  let controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y
  
  if (Math.abs(deltaY) > Math.abs(deltaX)) {
    // 세로 방향 연결: 중간 지점에서 수평으로 구부림
    const midY = (startY + endY) / 2
    controlPoint1X = startX
    controlPoint1Y = midY
    controlPoint2X = endX
    controlPoint2Y = midY
  } else {
    // 가로 방향 연결: 중간 지점에서 수직으로 구부림
    const midX = (startX + endX) / 2
    controlPoint1X = midX
    controlPoint1Y = startY
    controlPoint2X = midX
    controlPoint2Y = endY
  }

  const pathData = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`

  return {
    startX,
    startY,
    endX,
    endY,
    midX,
    midY,
    pathData
  }
}