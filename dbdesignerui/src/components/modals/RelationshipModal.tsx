import React, { useState, useEffect } from 'react'
import { X, GitBranch } from 'lucide-react'
import { Project, NewRelationshipForm, Relationship } from '../../types'

interface RelationshipModalProps {
  isOpen: boolean
  onClose: () => void
  currentProject: Project | null
  onAddRelationship: (relationship: Omit<Relationship, 'id'>) => void
  editingRelationship?: Relationship
  onUpdateRelationship?: (relationship: Relationship) => void
}

export const RelationshipModal: React.FC<RelationshipModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onAddRelationship,
  editingRelationship,
  onUpdateRelationship
}) => {
  const [formData, setFormData] = useState<NewRelationshipForm>({
    fromTable: editingRelationship?.fromTable || editingRelationship?.from_table || '',
    fromField: editingRelationship?.fromField || editingRelationship?.from_field || '',
    toTable: editingRelationship?.toTable || editingRelationship?.to_table || '',
    toField: editingRelationship?.toField || editingRelationship?.to_field || '',
    type: editingRelationship?.type || '1:N'
  })

  // editingRelationship 변경 시 폼 데이터 업데이트
  useEffect(() => {
    if (editingRelationship) {
      setFormData({
        fromTable: editingRelationship.fromTable || editingRelationship.from_table || '',
        fromField: editingRelationship.fromField || editingRelationship.from_field || '',
        toTable: editingRelationship.toTable || editingRelationship.to_table || '',
        toField: editingRelationship.toField || editingRelationship.to_field || '',
        type: editingRelationship.type || '1:N'
      });
    } else {
      setFormData({
        fromTable: '',
        fromField: '',
        toTable: '',
        toField: '',
        type: '1:N'
      });
    }
  }, [editingRelationship]);

  if (!isOpen) return null

  const isEditMode = !!editingRelationship;

  const handleSubmit = () => {
    if (!formData.fromTable || !formData.toTable || !formData.fromField || !formData.toField) return
    
    if (isEditMode && editingRelationship && onUpdateRelationship) {
      // 편집 모드: 기존 관계 업데이트
      onUpdateRelationship({
        ...editingRelationship,
        fromTable: formData.fromTable,
        fromField: formData.fromField,
        toTable: formData.toTable,
        toField: formData.toField,
        // 백엔드 호환성을 위해 두 형태 모두 설정
        from_table: formData.fromTable,
        from_field: formData.fromField,
        to_table: formData.toTable,
        to_field: formData.toField,
        type: formData.type
      });
    } else {
      // 추가 모드: 새 관계 생성
      onAddRelationship(formData);
    }
    
    setFormData({
      fromTable: '',
      fromField: '',
      toTable: '',
      toField: '',
      type: '1:N'
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <GitBranch className="w-5 h-5 mr-2" />
            {isEditMode ? '관계 수정' : '관계 추가'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">시작 테이블</label>
              <select
                value={formData.fromTable}
                onChange={(e) => setFormData({...formData, fromTable: e.target.value, fromField: ''})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                {currentProject?.tables.map(table => (
                  <option key={table.id} value={table.name}>{table.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">시작 필드</label>
              <select
                value={formData.fromField}
                onChange={(e) => setFormData({...formData, fromField: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!formData.fromTable}
              >
                <option value="">선택하세요</option>
                {currentProject?.tables
                  .find(t => t.name === formData.fromTable)?.fields
                  .map(field => (
                    <option key={field.name} value={field.name}>{field.name}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">대상 테이블</label>
              <select
                value={formData.toTable}
                onChange={(e) => setFormData({...formData, toTable: e.target.value, toField: ''})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                {currentProject?.tables
                  .filter(table => table.name !== formData.fromTable)
                  .map(table => (
                    <option key={table.id} value={table.name}>{table.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">대상 필드</label>
              <select
                value={formData.toField}
                onChange={(e) => setFormData({...formData, toField: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!formData.toTable}
              >
                <option value="">선택하세요</option>
                {currentProject?.tables
                  .find(t => t.name === formData.toTable)?.fields
                  .map(field => (
                    <option key={field.name} value={field.name}>{field.name}</option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">관계 타입</label>
            <div className="grid grid-cols-3 gap-2">
              {(['1:1', '1:N', 'N:1', 'N:N', '0:1', '1:0'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFormData({...formData, type})}
                  className={`px-3 py-2 text-sm rounded-lg border ${
                    formData.type === type
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              1:N = 일대다, N:1 = 다대일, 1:1 = 일대일, N:N = 다대다
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.fromTable || !formData.toTable || !formData.fromField || !formData.toField}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isEditMode ? '수정' : '관계 추가'}
          </button>
        </div>
      </div>
    </div>
  )
}