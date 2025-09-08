export interface Field {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isRequired: boolean;
  constraints?: string;
  isForeignKey?: boolean;
  referencedTable?: string;
  referencedField?: string;
  defaultValue?: string;
  isAutoIncrement?: boolean;
  isUnique?: boolean;
  checkConstraint?: string;
  comment?: string;
}

export interface Index {
  id: string;
  name: string;
  fields: string[];
  type: 'INDEX' | 'UNIQUE' | 'FULLTEXT' | 'PRIMARY';
  method?: 'BTREE' | 'HASH' | 'FULLTEXT';
}

export interface Relationship {
  id: string;
  fromTable?: string;
  fromField?: string;
  toTable?: string;
  toField?: string;
  from_table?: string;
  from_field?: string;
  to_table?: string;
  to_field?: string;
  type: '1:1' | '1:N' | 'N:1' | 'N:N' | '0:1' | '1:0';
}

export interface Table {
  id: string;
  name: string;
  fields: Field[];
  indexes?: Index[];
  position: { x: number; y: number };
  comment?: string;
}

export interface Project {
  id: string;
  name: string;
  db_type: string;
  tables: Table[];
  relationships: Relationship[];
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface NewRelationshipForm {
  fromTable: string;
  fromField: string;
  toTable: string;
  toField: string;
  type: '1:1' | '1:N' | 'N:1' | 'N:N' | '0:1' | '1:0';
}

export interface User {
  id: string;
  email: string;
  nickname: string;
  isVerified: boolean;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  nickname: string;
}

export interface VerificationForm {
  email: string;
  code: string;
}