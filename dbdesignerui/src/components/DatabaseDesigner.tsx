import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChatMessage } from "../types";
import { useProjectState } from "../hooks/useProjectState";
import { Header } from "./Header";
import { ChatPanel } from "./panels/ChatPanel";
import { DiagramPanel } from "./panels/DiagramPanel";
import { NewProjectModal } from "./modals/NewProjectModal";
import { RelationshipModal } from "./modals/RelationshipModal";
import TableCreationModal from "./modals/TableCreationModal";
import ExportImportModal from "./modals/ExportImportModal";

const DatabaseDesigner = () => {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();
    const {
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
        updateTable,
        loadProject,
    } = useProjectState();

    // UI 상태
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        {
            role: "assistant",
            content:
                "안녕하세요! 데이터베이스 테이블을 만들어드릴게요. 어떤 테이블이 필요하신가요?",
        },
    ]);
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [showProjectList, setShowProjectList] = useState(false);
    const [showRelationshipModal, setShowRelationshipModal] = useState(false);
    const [showTableCreationModal, setShowTableCreationModal] = useState(false);
    const [showExportImportModal, setShowExportImportModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingRelationship, setEditingRelationship] = useState<any>(null);
    const [editingTable, setEditingTable] = useState<any>(null);

    // 프로젝트 ID가 있으면 해당 프로젝트 로드
    useEffect(() => {
        const abortController = new AbortController();
        
        const loadProjectData = async () => {
            if (!projectId) {
                setIsLoading(false);
                return;
            }
            
            if (abortController.signal.aborted) return; // 취소된 요청은 무시

            try {
                setIsLoading(true);
                setError(null);
                console.log(`🔄 프로젝트 로딩 중: ${projectId}`);
                
                if (abortController.signal.aborted) return; // API 호출 전 재확인
                const result = await loadProject(projectId, abortController.signal);
                
                if (abortController.signal.aborted || !result) return; // API 호출 후 재확인
                console.log(`✅ 프로젝트 로딩 완료: ${projectId}`);
            } catch (error: any) {
                if (abortController.signal.aborted || error.name === 'AbortError') return; // 에러 처리 중 취소 확인
                console.error('❌ 프로젝트 로딩 실패:', error);
                setError(error.message || '프로젝트를 불러오는데 실패했습니다.');
                
                // 에러 발생 시 프로젝트 목록으로 돌아가기
                setTimeout(() => {
                    if (!abortController.signal.aborted) {
                        navigate('/projects');
                    }
                }, 2000);
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        loadProjectData();
        
        return () => {
            abortController.abort(); // cleanup: 진행 중인 모든 API 요청 취소
        };
    }, [projectId, loadProject, navigate]);

    // 로딩 중일 때
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">프로젝트를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    // 에러가 있을 때
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-4">⚠️ 오류가 발생했습니다</div>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/projects')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        프로젝트 목록으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    // 관계 편집 핸들러들
    const handleEditRelationship = (relationship: any) => {
        console.log('🔧 DatabaseDesigner: 관계 편집 요청', relationship);
        setEditingRelationship(relationship);
        setShowRelationshipModal(true);
    };

    const handleUpdateRelationship = async (updatedRelationship: any) => {
        try {
            await updateRelationship(updatedRelationship);
            setEditingRelationship(null);
        } catch (error: any) {
            console.error('관계 업데이트 실패:', error);
            // 에러 처리 (토스트 메시지 등)
        }
    };

    const handleCloseRelationshipModal = () => {
        setShowRelationshipModal(false);
        setEditingRelationship(null);
    };

    // 테이블 편집 핸들러들
    const handleEditTable = (table: any) => {
        console.log('🔧 DatabaseDesigner: 테이블 편집 요청', table);
        setEditingTable(table);
        setShowTableCreationModal(true);
    };

    const handleUpdateTable = async (updatedTable: any) => {
        try {
            await updateTable(updatedTable);
            setEditingTable(null);
        } catch (error: any) {
            console.error('테이블 업데이트 실패:', error);
            // 에러 처리 (토스트 메시지 등)
        }
    };

    const handleCloseTableModal = () => {
        setShowTableCreationModal(false);
        setEditingTable(null);
    };

    return (
        <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden" style={{fontSize: '0.8em'}}>
            <Header
                currentProject={currentProject}
                projects={projects}
                showProjectList={showProjectList}
                setShowProjectList={setShowProjectList}
                setCurrentProject={setCurrentProject}
                setShowRelationshipModal={setShowRelationshipModal}
                onAddTable={() => setShowTableCreationModal(true)}
                onBackToProjects={() => navigate('/projects')}
                onShowExportImport={() => setShowExportImportModal(true)}
            />

            <div className="flex h-[calc(100vh-72px)] overflow-hidden">
                <ChatPanel
                    currentProject={currentProject}
                    chatHistory={chatHistory}
                    setChatHistory={setChatHistory}
                    addTable={addTable}
                />

                <DiagramPanel
                    currentProject={currentProject}
                    setCurrentProject={setCurrentProject}
                    setProjects={setProjects}
                    deleteTable={deleteTable}
                    deleteRelationship={deleteRelationship}
                    onEditRelationship={handleEditRelationship}
                    onEditTable={handleEditTable}
                />
            </div>

            <NewProjectModal
                isOpen={isNewProjectModalOpen}
                onClose={() => setIsNewProjectModalOpen(false)}
                onCreateProject={createNewProject}
            />

            <RelationshipModal
                isOpen={showRelationshipModal}
                onClose={handleCloseRelationshipModal}
                currentProject={currentProject}
                onAddRelationship={addRelationship}
                editingRelationship={editingRelationship}
                onUpdateRelationship={handleUpdateRelationship}
            />

            <TableCreationModal
                isOpen={showTableCreationModal}
                onClose={handleCloseTableModal}
                onCreateTable={addTable}
                onUpdateTable={handleUpdateTable}
                editingTable={editingTable}
                dbType={currentProject?.db_type}
            />

            <ExportImportModal
                isOpen={showExportImportModal}
                onClose={() => setShowExportImportModal(false)}
                project={currentProject}
                onImportProject={(projectData) => {
                    if (currentProject && projectData.tables && projectData.relationships) {
                        const updatedProject = {
                            ...currentProject,
                            tables: [...currentProject.tables, ...projectData.tables],
                            relationships: [...currentProject.relationships, ...projectData.relationships]
                        };
                        setCurrentProject(updatedProject);
                        setProjects(prev => prev.map(p => p.id === currentProject.id ? updatedProject : p));
                    }
                }}
            />
        </div>
    );
};

export default DatabaseDesigner;
