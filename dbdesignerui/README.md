# DB Designer

현대적이고 직관적인 웹 기반 데이터베이스 ERD(Entity Relationship Diagram) 디자인 도구입니다. AI 어시스턴트를 활용한 자연어 테이블 생성과 다양한 데이터베이스 형식 지원을 제공합니다.

## ✨ 주요 기능

### 🔐 인증 시스템
- **사용자 등록**: 이메일, 비밀번호, 닉네임 기반 회원가입
- **이메일 인증**: 코드 기반 이메일 인증 시스템 (개발환경: 123456)
- **로그인/로그아웃**: 세션 기반 인증 관리
- **사용자 상태 관리**: localStorage 기반 세션 유지

### 📁 프로젝트 관리
- **프로젝트 생성**: 이름과 DB 타입을 지정한 새 프로젝트 생성 
- **프로젝트 목록**: 카드 형태의 직관적인 프로젝트 목록 뷰
- **프로젝트 삭제**: 개별 프로젝트 삭제 기능 (확인 다이얼로그 포함)
- **DB 타입 지원**: MySQL, PostgreSQL, SQLite, MongoDB, Oracle, SQL Server
- **프로젝트 정보**: 테이블 수, 관계 수, 생성 날짜 표시

### 🤖 AI 어시스턴트
- **자연어 테이블 생성**: "사용자 테이블 만들어줘"와 같은 자연어로 테이블 생성
- **리사이즈 가능한 패널**: 드래그로 AI 채팅 패널 크기 조정 (300px~600px)
- **채팅 히스토리**: 대화 내용 저장 및 표시
- **실시간 피드백**: 테이블 생성 완료 메시지

### 🗄️ 테이블 및 스키마 관리
- **시각적 테이블 생성**: 모달을 통한 직관적인 테이블 생성
- **동적 필드 관리**: 필드 추가/삭제, 타입 선택, PK/필수 여부 설정
- **DB별 타입 지원**: 각 데이터베이스에 최적화된 데이터 타입 제공
- **드래그 앤 드롭**: 다이어그램 상에서 테이블 위치 이동
- **관계 설정**: 테이블 간 관계선 생성 (1:1, 1:N, N:1, N:N, 0:1, 1:0)
- **관계선 시각화**: 스마트한 연결선 자동 계산 및 실시간 업데이트

### 📤 내보내기/가져오기
- **다양한 형식 지원**:
  - **JSON**: 프로젝트 전체 데이터 (테이블, 관계, 위치 정보)
  - **DBML**: Database Markup Language 형식
  - **SQL**: CREATE TABLE 문 및 Foreign Key 제약조건
- **가져오기**: JSON 및 DBML 형식 데이터 가져오기
- **미리보기**: 내보내기 전 내용 미리보기
- **복사/다운로드**: 클립보드 복사 또는 파일 다운로드

### 🎨 사용자 인터페이스
- **반응형 디자인**: 다양한 화면 크기 지원
- **현대적 UI**: Tailwind CSS 기반 깔끔한 인터페이스
- **직관적 네비게이션**: 아이콘 기반 사용자 친화적인 헤더
- **리사이즈 핸들**: 시각적 피드백과 함께 패널 크기 조절
- **호버 효과**: 인터랙티브 요소들의 시각적 피드백

## 🏗️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **스타일링**: Tailwind CSS
- **빌드 도구**: Vite
- **아이콘**: Lucide React
- **상태 관리**: React Hooks (useState, useCallback, useEffect)
- **로컬 스토리지**: 브라우저 localStorage
- **타입 체크**: TypeScript 5.6+

## 📂 프로젝트 구조

```
src/
├── components/                 # React 컴포넌트
│   ├── auth/                   # 인증 관련 컴포넌트
│   │   ├── Login.tsx           # 로그인 컴포넌트
│   │   └── Register.tsx        # 회원가입 및 이메일 인증
│   ├── diagram/                # 다이어그램 관련 컴포넌트
│   │   ├── RelationshipLine.tsx # 관계선 SVG 렌더링
│   │   └── TableCard.tsx       # 테이블 카드 표시
│   ├── modals/                 # 모달 컴포넌트들
│   │   ├── CreateProjectModal.tsx     # 프로젝트 생성 모달
│   │   ├── ExportImportModal.tsx      # 내보내기/가져오기 모달
│   │   ├── NewProjectModal.tsx        # 새 프로젝트 모달 (레거시)
│   │   ├── RelationshipModal.tsx      # 관계 추가 모달
│   │   └── TableCreationModal.tsx     # 테이블 생성 모달
│   ├── panels/                 # 패널 컴포넌트들
│   │   ├── ChatPanel.tsx       # AI 어시스턴트 채팅 패널
│   │   └── DiagramPanel.tsx    # 다이어그램 표시 패널
│   ├── DatabaseDesigner.tsx    # 메인 작업실 컴포넌트
│   ├── Header.tsx              # 헤더 네비게이션
│   └── ProjectList.tsx         # 프로젝트 목록 화면
├── hooks/                      # 커스텀 React Hooks
│   ├── useAuth.ts              # 인증 상태 관리
│   ├── useDragAndDrop.ts       # 드래그앤드롭 기능
│   ├── useProjectState.ts      # 프로젝트 상태 관리
│   └── useResizable.ts         # 패널 리사이즈 기능
├── types/                      # TypeScript 타입 정의
│   └── index.ts                # 모든 인터페이스 정의
├── utils/                      # 유틸리티 함수들
│   ├── exportUtils.ts          # 내보내기/가져오기 유틸리티
│   ├── relationshipUtils.ts    # 관계 처리 유틸리티
│   └── tableGenerator.ts       # AI 기반 테이블 생성
├── App.tsx                     # 메인 앱 컴포넌트 (라우팅 로직)
├── main.tsx                    # 앱 진입점
└── index.css                   # 전역 스타일 및 Tailwind
```

## 🚀 시작하기

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 빌드
npm run build

# 프로덕션 프리뷰
npm run preview
```

### 사용 방법

#### 1. 회원가입/로그인
- 이메일, 닉네임, 비밀번호로 회원가입
- 이메일로 전송된 인증 코드(개발환경: **123456**) 입력
- 로그인 후 프로젝트 목록 화면 진입

#### 2. 프로젝트 관리
- "새 프로젝트" 버튼 클릭
- 프로젝트명과 DB 타입(MySQL, PostgreSQL 등) 선택
- 생성된 프로젝트 카드를 클릭하여 작업실 진입
- 프로젝트 카드 호버 시 삭제 버튼으로 개별 삭제 가능

#### 3. 테이블 생성
- **방법 1**: AI 어시스턴트 활용
  ```
  "사용자 테이블을 만들어줘"
  "상품 리뷰 테이블이 필요해"
  "주문 관리 테이블 생성"
  ```
- **방법 2**: "테이블 추가" 버튼으로 직접 생성
  - 테이블명 입력
  - 필드 추가/삭제 (이름, 타입, PK, 필수 여부)
  - DB 타입별 최적화된 데이터 타입 선택

#### 4. 다이어그램 조작
- 테이블을 드래그하여 자유롭게 배치
- 드래그 중 관계선 실시간 업데이트
- "관계 추가" 버튼으로 테이블 간 관계 정의
- 관계선 호버 시 삭제 기능

#### 5. 패널 조정
- AI 어시스턴트 패널 오른쪽 가장자리를 드래그하여 크기 조절
- 300px ~ 600px 범위에서 자유롭게 조정

#### 6. 내보내기/가져오기
- "내보내기/가져오기" 버튼 클릭
- **내보내기**: JSON, DBML, SQL 형식 선택 후 복사/다운로드
- **가져오기**: JSON 또는 DBML 내용 붙여넣기

## 🔧 주요 기능 상세

### 인증 시스템
- **보안**: 비밀번호 최소 6자리, 이메일 형식 검증
- **사용자 경험**: 단계별 회원가입 프로세스
- **세션 관리**: 새로고침 시에도 로그인 상태 유지

### AI 어시스턴트
- **자연어 처리**: 다양한 표현 방식 지원
- **스마트 생성**: 테이블명, 필드명, 타입 자동 추론
- **관계 자동 생성**: 외래키 감지 시 관계선 자동 생성

### 데이터 관리
- **실시간 동기화**: 모든 변경사항 즉시 반영
- **데이터 영속성**: localStorage를 통한 데이터 보존
- **타입 안전성**: TypeScript 기반 완전한 타입 검사

## 🎯 향후 계획

- [ ] **백엔드 연동**: 실제 서버 API 구축
- [ ] **실시간 협업**: WebSocket 기반 멀티유저 지원
- [ ] **고급 SQL 생성**: 인덱스, 트리거, 뷰 생성 지원
- [ ] **더 많은 DB 지원**: Redis, Cassandra 등
- [ ] **테마 시스템**: 다크 모드 및 커스텀 테마
- [ ] **키보드 단축키**: 파워 유저를 위한 단축키 지원
- [ ] **버전 관리**: 스키마 변경 히스토리 추적
- [ ] **성능 최적화**: 대용량 스키마 처리 개선

## 🔧 개발 정보

### 주요 컴포넌트 설명

- **App.tsx**: 전체 앱의 라우팅 및 인증 상태 관리
- **DatabaseDesigner.tsx**: 메인 작업실 화면 구성
- **ChatPanel.tsx**: AI 어시스턴트와의 대화 인터페이스
- **DiagramPanel.tsx**: ERD 다이어그램 표시 및 상호작용
- **useProjectState.ts**: 프로젝트 데이터 및 테이블 관리 로직
- **useResizable.ts**: 드래그 기반 패널 크기 조정

### 타입 시스템

모든 데이터 구조는 TypeScript로 강하게 타입이 지정되어 있습니다:

```typescript
interface Project {
  id: string;
  name: string;
  dbType: string;  // 새로 추가됨
  tables: Table[];
  relationships: Relationship[];
  createdAt: Date;
}

interface User {
  id: string;
  email: string;
  nickname: string;
  isVerified: boolean;
}
```

## 📝 라이선스

이 프로젝트는 개발 중인 프로토타입입니다.

## 🤝 기여

버그 리포트나 기능 제안은 GitHub Issues를 통해 해주세요.

### 기여 방법
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request