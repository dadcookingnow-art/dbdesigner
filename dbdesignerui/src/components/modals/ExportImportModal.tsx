import { useState } from 'react';
import { X, Download, Upload, Copy, Check } from 'lucide-react';
import { Project } from '../../types';
import { exportToJSON, exportToDBML, exportToSQL, importFromJSON, importFromDBML } from '../../utils/exportUtils';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onImportProject: (projectData: Partial<Project>) => void;
}

type Tab = 'export' | 'import';
type ExportFormat = 'json' | 'dbml' | 'sql';

export default function ExportImportModal({ isOpen, onClose, project, onImportProject }: ExportImportModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('export');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [importContent, setImportContent] = useState('');
  const [importFormat, setImportFormat] = useState<'json' | 'dbml'>('json');
  const [copied, setCopied] = useState(false);
  const [exportedContent] = useState('');

  if (!isOpen) return null;

  const generateExportContent = () => {
    if (!project) return '';
    
    switch (exportFormat) {
      case 'json':
        return exportToJSON(project);
      case 'dbml':
        return exportToDBML(project);
      case 'sql':
        return exportToSQL(project);
      default:
        return '';
    }
  };


  const handleCopy = async () => {
    const content = exportedContent || generateExportContent();
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const content = exportedContent || generateExportContent();
    const fileName = `${project?.name || 'schema'}.${exportFormat}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importContent.trim()) return;
    
    try {
      let projectData: Partial<Project>;
      
      if (importFormat === 'json') {
        projectData = importFromJSON(importContent);
      } else {
        projectData = importFromDBML(importContent);
      }
      
      onImportProject(projectData);
      setImportContent('');
      onClose();
    } catch (error) {
      alert(`가져오기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">내보내기 / 가져오기</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('export')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              내보내기
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              가져오기
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          {activeTab === 'export' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  내보낼 형식 선택
                </label>
                <div className="flex space-x-4">
                  {[
                    { value: 'json', label: 'JSON', desc: '프로젝트 전체 데이터' },
                    { value: 'dbml', label: 'DBML', desc: 'Database Markup Language' },
                    { value: 'sql', label: 'SQL', desc: 'CREATE TABLE 문' }
                  ].map(format => (
                    <label key={format.value} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="exportFormat"
                        value={format.value}
                        checked={exportFormat === format.value}
                        onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{format.label}</div>
                        <div className="text-sm text-gray-500">{format.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    미리보기
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? '복사됨' : '복사'}</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-green-600 hover:text-green-700"
                    >
                      <Download className="w-4 h-4" />
                      <span>다운로드</span>
                    </button>
                  </div>
                </div>
                <textarea
                  value={generateExportContent()}
                  readOnly
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm resize-none"
                  placeholder="내보낼 내용이 여기에 표시됩니다..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  가져올 형식 선택
                </label>
                <div className="flex space-x-4">
                  {[
                    { value: 'json', label: 'JSON', desc: '프로젝트 전체 데이터' },
                    { value: 'dbml', label: 'DBML', desc: 'Database Markup Language' }
                  ].map(format => (
                    <label key={format.value} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="importFormat"
                        value={format.value}
                        checked={importFormat === format.value}
                        onChange={(e) => setImportFormat(e.target.value as 'json' | 'dbml')}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{format.label}</div>
                        <div className="text-sm text-gray-500">{format.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  내용 붙여넣기
                </label>
                <textarea
                  value={importContent}
                  onChange={(e) => setImportContent(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`${importFormat.toUpperCase()} 형식의 내용을 여기에 붙여넣으세요...`}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleImport}
                  disabled={!importContent.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  <span>가져오기</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}