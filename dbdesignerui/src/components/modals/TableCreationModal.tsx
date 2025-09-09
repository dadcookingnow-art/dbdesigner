import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Database } from 'lucide-react';
import { Field, Table, Index } from '../../types';

interface TableCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTable: (table: Table) => void;
  onUpdateTable?: (table: Table) => void;
  editingTable?: Table | null;
  dbType?: string;
}

const getDbTypeFields = (dbType: string) => {
  const commonTypes = {
    mysql: [
      'INT', 'BIGINT', 'VARCHAR(255)', 'TEXT', 'DECIMAL(10,2)', 
      'BOOLEAN', 'DATE', 'DATETIME', 'TIMESTAMP', 'JSON'
    ],
    postgresql: [
      'INTEGER', 'BIGINT', 'VARCHAR(255)', 'TEXT', 'NUMERIC(10,2)', 
      'BOOLEAN', 'DATE', 'TIMESTAMP', 'JSONB', 'UUID'
    ],
    sqlite: [
      'INTEGER', 'TEXT', 'REAL', 'BLOB', 'BOOLEAN', 'DATE', 'DATETIME'
    ],
    mongodb: [
      'String', 'Number', 'Boolean', 'Date', 'Array', 'Object', 'ObjectId'
    ]
  };
  
  return commonTypes[dbType as keyof typeof commonTypes] || commonTypes.mysql;
};

export default function TableCreationModal({ 
  isOpen, 
  onClose, 
  onCreateTable, 
  onUpdateTable,
  editingTable,
  dbType = 'mysql' 
}: TableCreationModalProps) {
  const [tableName, setTableName] = useState('');
  const [tableComment, setTableComment] = useState('');
  const [fields, setFields] = useState<Field[]>([
    { 
      name: 'id', 
      type: 'INT', 
      isPrimaryKey: true, 
      isRequired: true,
      isAutoIncrement: true
    }
  ]);
  const [indexes, setIndexes] = useState<Index[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 드래그 관련 상태
  const modalRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  const availableTypes = getDbTypeFields(dbType);
  const isEditMode = !!editingTable;

  // 필드 정규화 함수 - undefined 값을 기본값으로 변환
  const normalizeField = (field: Field): Field => ({
    name: field.name || '',
    type: field.type || availableTypes[0],
    isPrimaryKey: field.isPrimaryKey || false,
    isRequired: field.isRequired || false,
    isAutoIncrement: field.isAutoIncrement || false,
    isUnique: field.isUnique || false,
    defaultValue: field.defaultValue ?? '',
    checkConstraint: field.checkConstraint ?? '',
    comment: field.comment ?? '',
    isForeignKey: field.isForeignKey || false,
    referencedTable: field.referencedTable || '',
    referencedField: field.referencedField || '',
    constraints: field.constraints || ''
  });

  // 편집 모드일 때 기존 테이블 데이터 로드
  useEffect(() => {
    if (isOpen && editingTable) {
      setTableName(editingTable.name || '');
      setTableComment(editingTable.comment || '');
      setFields(editingTable.fields.map(normalizeField));
      setIndexes(editingTable.indexes || []);
    } else if (isOpen && !editingTable) {
      // 새 테이블 생성 모드일 때 기본값 설정
      setTableName('');
      setTableComment('');
      setFields([
        normalizeField({ 
          name: 'id', 
          type: availableTypes[0], 
          isPrimaryKey: true, 
          isRequired: true,
          isAutoIncrement: true
        } as Field)
      ]);
      setIndexes([]);
    }
  }, [isOpen, editingTable]); // availableTypes 제거

  // 드래그 핸들러들 (useEffect보다 먼저 선언)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!modalRef.current) return;
    
    const rect = modalRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !modalRef.current) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // 화면 경계 체크
    const maxX = window.innerWidth - modalRef.current.offsetWidth;
    const maxY = window.innerHeight - modalRef.current.offsetHeight;
    
    const clampedX = Math.max(0, Math.min(newX, maxX));
    const clampedY = Math.max(0, Math.min(newY, maxY));
    
    setModalPosition({ x: clampedX, y: clampedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 드래그 이벤트 리스너 등록
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // 모달이 열릴 때 중앙 위치 설정
  useEffect(() => {
    if (isOpen && modalRef.current && modalPosition.x === 0 && modalPosition.y === 0) {
      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;
      const centerX = (window.innerWidth - modalWidth) / 2;
      const centerY = (window.innerHeight - modalHeight) / 2;
      
      setModalPosition({
        x: Math.max(0, centerX),
        y: Math.max(0, centerY)
      });
    }
  }, [isOpen, modalPosition]);

  if (!isOpen) return null;

  const handleAddField = () => {
    setFields(prev => [...prev, normalizeField({
      name: '',
      type: availableTypes[0],
      isPrimaryKey: false,
      isRequired: false,
      isAutoIncrement: false,
      isUnique: false
    } as Field)]);
  };

  const handleRemoveField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: Partial<Field>) => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, ...field } : f));
  };

  // 인덱스 관리 함수들
  const handleAddIndex = () => {
    const newIndex: Index = {
      id: `idx_${Date.now()}`,
      name: '',
      fields: [],
      type: 'INDEX',
      method: 'BTREE'
    };
    setIndexes(prev => [...prev, newIndex]);
  };

  const handleRemoveIndex = (index: number) => {
    setIndexes(prev => prev.filter((_, i) => i !== index));
  };

  const handleIndexChange = (index: number, changes: Partial<Index>) => {
    setIndexes(prev => prev.map((idx, i) => i === index ? { ...idx, ...changes } : idx));
  };

  const handleIndexFieldToggle = (indexIndex: number, fieldName: string) => {
    setIndexes(prev => prev.map((idx, i) => {
      if (i === indexIndex) {
        const fields = idx.fields.includes(fieldName)
          ? idx.fields.filter(f => f !== fieldName)
          : [...idx.fields, fieldName];
        return { ...idx, fields };
      }
      return idx;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim() || fields.length === 0) return;

    const validFields = fields.filter(f => f.name.trim());
    if (validFields.length === 0) return;

    setIsLoading(true);
    try {
      const tableData: Table = {
        id: isEditMode ? editingTable!.id : `t${Date.now()}`,
        name: tableName.trim(),
        fields: validFields.map(f => ({
          ...f,
          name: f.name.trim()
        })),
        indexes: indexes.filter(idx => idx.name.trim() && idx.fields.length > 0),
        position: isEditMode ? editingTable!.position : { 
          x: Math.random() * 300 + 50, 
          y: Math.random() * 200 + 100 
        },
        comment: tableComment.trim() || undefined
      };
      
      if (isEditMode) {
        onUpdateTable?.(tableData);
      } else {
        onCreateTable(tableData);
      }
      
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTableName('');
    setTableComment('');
    setFields([{ 
      name: 'id', 
      type: 'INT', 
      isPrimaryKey: true, 
      isRequired: true,
      isAutoIncrement: true 
    }]);
    setIndexes([]);
    setModalPosition({ x: 0, y: 0 }); // 모달 위치 리셋
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        style={{
          position: 'absolute',
          left: `${modalPosition.x}px`,
          top: `${modalPosition.y}px`,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        <div 
          className="flex items-center justify-between p-6 border-b cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
        >
          <h2 className="text-xl font-semibold text-gray-900 pointer-events-none">
            {isEditMode ? '테이블 편집' : '새 테이블 만들기'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            onMouseDown={(e) => e.stopPropagation()} // 닫기 버튼 클릭 시 드래그 방지
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="mb-6">
            <label htmlFor="tableName" className="block text-sm font-medium text-gray-700 mb-2">
              테이블 이름
            </label>
            <input
              id="tableName"
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="테이블 이름을 입력하세요"
              required
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label htmlFor="tableComment" className="block text-sm font-medium text-gray-700 mb-2">
              테이블 설명 (선택사항)
            </label>
            <input
              id="tableComment"
              type="text"
              value={tableComment}
              onChange={(e) => setTableComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="테이블에 대한 설명을 입력하세요"
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">필드</h3>
              <button
                type="button"
                onClick={handleAddField}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>필드 추가</span>
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                  {/* 첫 번째 행: 기본 정보 */}
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => handleFieldChange(index, { name: e.target.value })}
                      placeholder="필드명"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    
                    <select
                      value={field.type}
                      onChange={(e) => handleFieldChange(index, { type: e.target.value })}
                      className="w-32 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {availableTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>

                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveField(index)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* 두 번째 행: 체크박스들 */}
                  <div className="flex items-center space-x-4 mb-3">
                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={field.isPrimaryKey}
                        onChange={(e) => handleFieldChange(index, { isPrimaryKey: e.target.checked })}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Primary Key</span>
                    </label>

                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={field.isRequired}
                        onChange={(e) => handleFieldChange(index, { isRequired: e.target.checked })}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">필수</span>
                    </label>

                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={field.isAutoIncrement || false}
                        onChange={(e) => handleFieldChange(index, { isAutoIncrement: e.target.checked })}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">자동증가</span>
                    </label>

                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={field.isUnique || false}
                        onChange={(e) => handleFieldChange(index, { isUnique: e.target.checked })}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">유니크</span>
                    </label>
                  </div>

                  {/* 세 번째 행: 추가 속성들 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">기본값</label>
                      <input
                        type="text"
                        value={field.defaultValue ?? ''}
                        onChange={(e) => handleFieldChange(index, { defaultValue: e.target.value })}
                        placeholder="기본값"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">체크 제약조건</label>
                      <input
                        type="text"
                        value={field.checkConstraint ?? ''}
                        onChange={(e) => handleFieldChange(index, { checkConstraint: e.target.value })}
                        placeholder="예: age >= 0"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">코멘트</label>
                      <input
                        type="text"
                        value={field.comment ?? ''}
                        onChange={(e) => handleFieldChange(index, { comment: e.target.value })}
                        placeholder="필드 설명"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 인덱스 섹션 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>인덱스</span>
              </h3>
              <button
                type="button"
                onClick={handleAddIndex}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>인덱스 추가</span>
              </button>
            </div>

            <div className="space-y-4">
              {indexes.map((index, indexIdx) => (
                <div key={index.id} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="text"
                      value={index.name}
                      onChange={(e) => handleIndexChange(indexIdx, { name: e.target.value })}
                      placeholder="인덱스 이름 (예: idx_user_email)"
                      className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    
                    <select
                      value={index.type}
                      onChange={(e) => handleIndexChange(indexIdx, { type: e.target.value as any })}
                      className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="INDEX">INDEX</option>
                      <option value="UNIQUE">UNIQUE</option>
                      <option value="FULLTEXT">FULLTEXT</option>
                    </select>

                    <select
                      value={index.method || 'BTREE'}
                      onChange={(e) => handleIndexChange(indexIdx, { method: e.target.value as any })}
                      className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="BTREE">BTREE</option>
                      <option value="HASH">HASH</option>
                      <option value="FULLTEXT">FULLTEXT</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveIndex(indexIdx)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pl-2">
                    <label className="block text-xs font-medium text-gray-600 mb-2">포함할 필드:</label>
                    <div className="flex flex-wrap gap-2">
                      {fields.filter(f => f.name.trim()).map((field) => (
                        <label key={field.name} className="flex items-center space-x-1 text-sm">
                          <input
                            type="checkbox"
                            checked={index.fields.includes(field.name)}
                            onChange={() => handleIndexFieldToggle(indexIdx, field.name)}
                            className="text-blue-600"
                          />
                          <span className="text-gray-700">{field.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || !tableName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading 
                ? (isEditMode ? '수정 중...' : '생성 중...') 
                : (isEditMode ? '테이블 수정' : '테이블 만들기')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}