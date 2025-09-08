import React from 'react'
import { Database, ChevronDown, GitBranch, Plus, FileText, ChevronLeft, List } from 'lucide-react'
import { Project } from '../types'

interface HeaderProps {
  currentProject: Project | null
  projects: Project[]
  showProjectList: boolean
  setShowProjectList: (show: boolean) => void
  setCurrentProject: (project: Project) => void
  setShowRelationshipModal: (show: boolean) => void
  onAddTable: () => void
  onBackToProjects: () => void
  onShowExportImport: () => void
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  projects,
  showProjectList,
  setShowProjectList,
  setCurrentProject,
  setShowRelationshipModal,
  onAddTable,
  onBackToProjects,
  onShowExportImport
}) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-full mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={onBackToProjects}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="프로젝트 목록으로 돌아가기"
            >
              <div className="flex items-center space-x-1.5 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <ChevronLeft className="w-5 h-5" />
                <List className="w-5 h-5" />
              </div>
            </button>
            
            <div className="flex items-center">
              <Database className="w-8 h-8 text-blue-600" />
              <div className="relative ml-2">
              <button
                onClick={() => setShowProjectList(!showProjectList)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="font-medium">{currentProject?.name || '프로젝트 선택'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showProjectList && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
                  {projects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setCurrentProject(project)
                        setShowProjectList(false)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg border-b last:border-b-0"
                    >
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-gray-500">{project.tables.length}개 테이블, {project.relationships.length}개 관계</div>
                    </button>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onShowExportImport}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>내보내기/가져오기</span>
            </button>
            <button
              onClick={() => setShowRelationshipModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <GitBranch className="w-4 h-4" />
              <span>관계 추가</span>
            </button>
            <button
              onClick={onAddTable}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>테이블 추가</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}