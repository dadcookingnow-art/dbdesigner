import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CreateProjectModal from './modals/CreateProjectModal';

export default function ProjectList() {
  const navigate = useNavigate();
  const { user, projects, createProject, deleteProject, refreshProjects, logout } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // 페이지 로드 시 프로젝트 목록 강제 새로고침 (한 번만)
  useEffect(() => {
    const loadProjects = async () => {
      try {
        await refreshProjects();
      } catch (error) {
        console.error('프로젝트 목록 로딩 실패:', error);
      }
    };
    
    if (user) {
      loadProjects();
    }
  }, [user]); // refreshProjects 의존성 제거

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">데이터베이스 디자이너</h1>
              <p className="text-gray-600 mt-1">{user?.nickname}님 안녕하세요!</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">내 프로젝트</h2>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    await refreshProjects();
                  } catch (error) {
                    console.error('프로젝트 목록 새로고침 실패:', error);
                  }
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center gap-2"
                title="목록 새로고침"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                새로고침
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                새 프로젝트
              </button>
            </div>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">프로젝트가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">첫 번째 데이터베이스 프로젝트를 만들어보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                      <h3 className="text-lg font-medium text-gray-900 truncate">{project.name}</h3>
                      <div className="flex items-center text-sm text-blue-600 mt-1">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16" />
                        </svg>
                        {project.db_type?.toUpperCase() || 'UNKNOWN'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm(`"${project.name}" 프로젝트를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`)) {
                            try {
                              await deleteProject(project.id);
                              // 성공 시 알림 (선택사항)
                              // alert('프로젝트가 성공적으로 삭제되었습니다.');
                            } catch (error) {
                              // 실패 시 에러 메시지
                              alert('프로젝트 삭제에 실패했습니다. 다시 시도해주세요.');
                              console.error('프로젝트 삭제 오류:', error);
                            }
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all duration-200"
                        title="프로젝트 삭제"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0" />
                      </svg>
                      테이블 {project.tables.length}개
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      관계 {project.relationships.length}개
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4h3a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
                      </svg>
                      {formatDate(new Date(project.created_at))}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">클릭하여 열기</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={createProject}
      />
    </div>
  );
}