import { Project, Table, Relationship } from "../types";
import { apiClient } from "../utils/apiClient";

export const projectService = {
    async getProjects(): Promise<Project[]> {
        return apiClient.get<Project[]>('/project/projects');
    },

    async createProject(name: string, dbType: string): Promise<Project> {
        return apiClient.post<Project>('/project/projects', {
            name: name,
            db_type: dbType
        });
    },

    async deleteProject(projectId: string): Promise<void> {
        return apiClient.delete<void>(`/project/projects/${projectId}`);
    },

    async getProject(projectId: string, abortSignal?: AbortSignal): Promise<Project> {
        return apiClient.get<Project>(`/project/projects/${projectId}`, { signal: abortSignal });
    },

    async getProjectTables(projectId: string, abortSignal?: AbortSignal): Promise<Table[]> {
        return apiClient.get<Table[]>(`/schema/projects/${projectId}/tables`, { signal: abortSignal });
    },

    async getProjectRelationships(projectId: string, abortSignal?: AbortSignal): Promise<Relationship[]> {
        return apiClient.get<Relationship[]>(`/schema/projects/${projectId}/relationships`, { signal: abortSignal });
    },

    // 테이블 CRUD
    async createTable(projectId: string, table: Omit<Table, 'id' | 'project_id'>): Promise<Table> {
        return apiClient.post<Table>(`/schema/projects/${projectId}/tables`, {
            name: table.name,
            fields: table.fields,
            position: table.position
        });
    },

    async updateTable(projectId: string, tableId: string, table: Partial<Omit<Table, 'id' | 'project_id'>>): Promise<Table> {
        return apiClient.put<Table>(`/schema/projects/${projectId}/tables/${tableId}`, {
            name: table.name,
            fields: table.fields,
            position: table.position
        });
    },

    async deleteTable(projectId: string, tableId: string): Promise<void> {
        return apiClient.delete<void>(`/schema/projects/${projectId}/tables/${tableId}`);
    },

    // 관계 CRUD
    async createRelationship(projectId: string, relationship: Omit<Relationship, 'id' | 'project_id'>): Promise<Relationship> {
        return apiClient.post<Relationship>(`/schema/projects/${projectId}/relationships`, {
            from_table: relationship.fromTable,
            from_field: relationship.fromField,
            to_table: relationship.toTable,
            to_field: relationship.toField,
            type: relationship.type
        });
    },

    async updateRelationship(projectId: string, relationshipId: string, relationship: Omit<Relationship, 'id' | 'project_id'>): Promise<Relationship> {
        return apiClient.put<Relationship>(`/schema/projects/${projectId}/relationships/${relationshipId}`, {
            from_table: relationship.fromTable,
            from_field: relationship.fromField,
            to_table: relationship.toTable,
            to_field: relationship.toField,
            type: relationship.type
        });
    },

    async deleteRelationship(projectId: string, relationshipId: string): Promise<void> {
        return apiClient.delete<void>(`/schema/projects/${projectId}/relationships/${relationshipId}`);
    },

    // 테이블 위치만 업데이트하는 전용 API
    async updateTablePosition(projectId: string, tableId: string, position: { x: number; y: number }): Promise<Table> {
        return apiClient.put<Table>(`/schema/projects/${projectId}/tables/${tableId}/position`, {
            position: position
        });
    },

    // 다이어그램 상태 저장/로드 (TODO: 백엔드 API 구현 필요)
    async saveDiagramState(projectId: string, diagramState: { viewOffset: { x: number; y: number }, zoomLevel: number }): Promise<void> {
        // TODO: 백엔드 API 구현 후 연결
        console.log('📝 다이어그램 상태 저장 (TODO):', { projectId, diagramState });
        return Promise.resolve();
    },

    async getDiagramState(projectId: string): Promise<{ viewOffset: { x: number; y: number }, zoomLevel: number } | null> {
        // TODO: 백엔드 API 구현 후 연결
        console.log('📖 다이어그램 상태 로드 (TODO):', { projectId });
        return Promise.resolve(null);
    },
};