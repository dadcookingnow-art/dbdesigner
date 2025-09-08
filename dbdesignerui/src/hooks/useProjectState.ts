import { useState, useCallback } from 'react'
import { Project, Table, Relationship } from '../types'
import { projectService } from '../services/projectService'

export const useProjectState = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  
  // 새 프로젝트 생성
  const createNewProject = (name: string) => {
    if (!name.trim()) return

    const newProject: Project = {
      id: `p${Date.now()}`,
      name: name.trim(),
      db_type: 'mysql',
      tables: [],
      relationships: [],
      created_at: new Date().toISOString()
    }

    setProjects(prev => [...prev, newProject])
    setCurrentProject(newProject)
  }

  // 테이블 삭제 (API 호출 포함)
  const deleteTable = async (tableId: string) => {
    if (!currentProject) return

    const tableToDelete = currentProject.tables.find(t => t.id === tableId)
    if (!tableToDelete) return

    try {
      // TODO: API에 테이블 삭제 호출 추가 필요
      // await projectService.deleteTable(currentProject.id, tableId)
      
      const updatedProject = {
        ...currentProject,
        tables: currentProject.tables.filter(t => t.id !== tableId),
        relationships: currentProject.relationships.filter(r =>
          r.fromTable !== tableToDelete.name && r.toTable !== tableToDelete.name
        )
      }

      setCurrentProject(updatedProject)
      setProjects(prev => prev.map(p => p.id === currentProject.id ? updatedProject : p))
      
      console.log('✅ 테이블 삭제 완료:', tableToDelete.name)
    } catch (error: any) {
      console.error('❌ 테이블 삭제 실패:', error)
      throw new Error(error.message || '테이블 삭제에 실패했습니다.')
    }
  }

  // 관계 추가 (API 호출 포함)
  const addRelationship = async (relationship: Omit<Relationship, 'id'>) => {
    if (!currentProject) return

    try {
      // TODO: API에 관계 저장 호출 추가 필요
      // await projectService.createRelationship(currentProject.id, relationship)
      
      const newRelationship: Relationship = {
        id: `r${Date.now()}`,
        ...relationship
      }

      const updatedProject = {
        ...currentProject,
        relationships: [...currentProject.relationships, newRelationship]
      }

      setCurrentProject(updatedProject)
      setProjects(prev => prev.map(p => p.id === currentProject.id ? updatedProject : p))
      
      console.log('✅ 관계 추가 완료:', `${relationship.fromTable} → ${relationship.toTable}`)
    } catch (error: any) {
      console.error('❌ 관계 추가 실패:', error)
      throw new Error(error.message || '관계 추가에 실패했습니다.')
    }
  }

  // 관계 삭제 (API 호출 포함)
  const deleteRelationship = async (relationshipId: string) => {
    if (!currentProject) return

    const relationshipToDelete = currentProject.relationships.find(r => r.id === relationshipId)
    if (!relationshipToDelete) return

    try {
      // TODO: API에 관계 삭제 호출 추가 필요
      // await projectService.deleteRelationship(currentProject.id, relationshipId)
      
      const updatedProject = {
        ...currentProject,
        relationships: currentProject.relationships.filter(r => r.id !== relationshipId)
      }

      setCurrentProject(updatedProject)
      setProjects(prev => prev.map(p => p.id === currentProject.id ? updatedProject : p))
      
      console.log('✅ 관계 삭제 완료:', `${relationshipToDelete.fromTable} → ${relationshipToDelete.toTable}`)
    } catch (error: any) {
      console.error('❌ 관계 삭제 실패:', error)
      throw new Error(error.message || '관계 삭제에 실패했습니다.')
    }
  }

  // 관계 업데이트 (API 호출 포함)
  const updateRelationship = async (updatedRelationship: Relationship) => {
    if (!currentProject) return

    const existingRelationship = currentProject.relationships.find(r => r.id === updatedRelationship.id)
    if (!existingRelationship) return

    try {
      // TODO: API에 관계 업데이트 호출 추가 필요
      // await projectService.updateRelationship(currentProject.id, updatedRelationship)
      
      const updatedProject = {
        ...currentProject,
        relationships: currentProject.relationships.map(r => 
          r.id === updatedRelationship.id ? updatedRelationship : r
        )
      }

      setCurrentProject(updatedProject)
      setProjects(prev => prev.map(p => p.id === currentProject.id ? updatedProject : p))
      
      console.log('✅ 관계 업데이트 완료:', `${updatedRelationship.fromTable} → ${updatedRelationship.toTable}`)
    } catch (error: any) {
      console.error('❌ 관계 업데이트 실패:', error)
      throw new Error(error.message || '관계 업데이트에 실패했습니다.')
    }
  }

  // 테이블 추가 (API 호출 포함)
  const addTable = async (table: Table, relationships?: Relationship[]) => {
    if (!currentProject) return

    try {
      // TODO: API에 테이블 저장 호출 추가 필요
      // await projectService.createTable(currentProject.id, table)
      
      const updatedProject = {
        ...currentProject,
        tables: [...currentProject.tables, table],
        relationships: [
          ...currentProject.relationships,
          ...(relationships?.filter(rel =>
            currentProject.tables.some(t => t.name === rel.fromTable)
          ) || [])
        ]
      }

      setCurrentProject(updatedProject)
      setProjects(prev => prev.map(p => p.id === currentProject.id ? updatedProject : p))
      
      console.log('✅ 테이블 추가 완료:', table.name)
    } catch (error: any) {
      console.error('❌ 테이블 추가 실패:', error)
      throw new Error(error.message || '테이블 추가에 실패했습니다.')
    }
  }

  // 프로젝트 로딩
  const loadProject = useCallback(async (projectId: string, abortSignal?: AbortSignal) => {
    try {
      console.log(`🔍 프로젝트 로딩 시작: ${projectId}`)
      
      if (abortSignal?.aborted) {
        console.log('🛑 프로젝트 로딩 취소됨 (시작 전)')
        return null
      }
      
      // 1. 프로젝트 기본 정보 가져오기
      const project = await projectService.getProject(projectId, abortSignal)
      
      if (abortSignal?.aborted) {
        console.log('🛑 프로젝트 로딩 취소됨 (기본 정보 후)')
        return null
      }
      
      console.log('📋 프로젝트 기본 정보 로딩 완료:', project.name)
      
      // 2. 테이블 목록 가져오기
      const tables = await projectService.getProjectTables(projectId, abortSignal)
      
      if (abortSignal?.aborted) {
        console.log('🛑 프로젝트 로딩 취소됨 (테이블 후)')
        return null
      }
      
      console.log(`🗂️ 테이블 ${tables.length}개 로딩 완료`)
      
      // 3. 관계 목록 가져오기
      const relationships = await projectService.getProjectRelationships(projectId, abortSignal)
      
      if (abortSignal?.aborted) {
        console.log('🛑 프로젝트 로딩 취소됨 (관계 후)')
        return null
      }
      
      console.log(`🔗 관계 ${relationships.length}개 로딩 완료`)
      
      // 4. 프로젝트 객체 구성
      const fullProject: Project = {
        ...project,
        tables,
        relationships
      }
      
      // 5. 상태 업데이트 (취소되지 않은 경우에만)
      if (!abortSignal?.aborted) {
        setCurrentProject(fullProject)
        
        // 6. 프로젝트 목록에서도 업데이트 (캐시된 목록이 있다면)
        setProjects(prev => {
          const existingIndex = prev.findIndex(p => p.id === projectId)
          if (existingIndex >= 0) {
            const updated = [...prev]
            updated[existingIndex] = fullProject
            return updated
          }
          return [...prev, fullProject]
        })
        
        console.log('✅ 프로젝트 로딩 완료!')
      }
      
      return fullProject
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🛑 프로젝트 로딩 취소됨 (AbortError)')
        return null
      }
      console.error('❌ 프로젝트 로딩 실패:', error)
      throw new Error(error.message || '프로젝트를 불러오는데 실패했습니다.')
    }
  }, [setCurrentProject, setProjects])

  // 다이어그램 상태 저장
  const saveDiagramState = useCallback(async (
    projectId: string, 
    viewOffset: { x: number; y: number }, 
    zoomLevel: number = 1
  ) => {
    try {
      await projectService.saveDiagramState(projectId, { viewOffset, zoomLevel })
      console.log('✅ 다이어그램 상태 저장 완료:', { viewOffset, zoomLevel })
    } catch (error: any) {
      console.error('❌ 다이어그램 상태 저장 실패:', error)
      // 저장 실패는 사용자 경험을 방해하지 않도록 throw하지 않음
    }
  }, [])

  // 다이어그램 상태 로드
  const loadDiagramState = useCallback(async (projectId: string) => {
    try {
      const diagramState = await projectService.getDiagramState(projectId)
      console.log('✅ 다이어그램 상태 로드 완료:', diagramState)
      return diagramState
    } catch (error: any) {
      console.error('❌ 다이어그램 상태 로드 실패:', error)
      // 로드 실패 시 기본값 반환
      return { viewOffset: { x: 0, y: 0 }, zoomLevel: 1 }
    }
  }, [])

  // 개별 테이블 위치 업데이트
  const updateTablePosition = useCallback(async (
    projectId: string, 
    tableId: string, 
    position: { x: number; y: number }
  ) => {
    try {
      await projectService.updateTablePosition(projectId, tableId, position)
      console.log('✅ 테이블 위치 저장 완료:', { tableId, position })
    } catch (error: any) {
      console.error('❌ 테이블 위치 저장 실패:', error)
      // 저장 실패는 사용자 경험을 방해하지 않도록 throw하지 않음
    }
  }, [])

  return {
    projects,
    setProjects,
    currentProject,
    setCurrentProject,
    createNewProject,
    deleteTable,
    addRelationship,
    deleteRelationship,
    updateRelationship,
    addTable,
    loadProject,
    saveDiagramState,
    loadDiagramState,
    updateTablePosition
  }
}