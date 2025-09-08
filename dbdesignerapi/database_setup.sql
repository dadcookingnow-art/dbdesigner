-- public2.tb_model_diagram_states definition

-- Drop table

-- DROP TABLE public2.tb_model_diagram_states;

CREATE TABLE public2.tb_model_diagram_states (
	id varchar(36) NOT NULL,
	project_id varchar(36) NOT NULL,
	view_offset json NULL,
	zoom_level numeric(5, 2) NULL,
	last_saved_at timestamptz DEFAULT now() NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT tb_model_diagram_states_pkey PRIMARY KEY (id)
);
CREATE INDEX ix_public2_tb_model_diagram_states_id ON public2.tb_model_diagram_states USING btree (id);
CREATE UNIQUE INDEX ix_public2_tb_model_diagram_states_project_id ON public2.tb_model_diagram_states USING btree (project_id);


-- public2.tb_model_projects definition

-- Drop table

-- DROP TABLE public2.tb_model_projects;

CREATE TABLE public2.tb_model_projects (
	id varchar(36) DEFAULT gen_random_uuid()::text NOT NULL,
	"name" varchar(255) NOT NULL,
	db_type varchar(50) NOT NULL,
	user_id varchar(36) NOT NULL,
	"tables" jsonb DEFAULT '[]'::jsonb NULL,
	relationships jsonb DEFAULT '[]'::jsonb NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT tb_model_projects_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_projects_id ON public2.tb_model_projects USING btree (id);
CREATE INDEX idx_projects_user_id ON public2.tb_model_projects USING btree (user_id);

-- Table Triggers

create trigger update_projects_updated_at before
update
    on
    public2.tb_model_projects for each row execute function public2.update_updated_at_column();


-- public2.tb_model_relationships definition

-- Drop table

-- DROP TABLE public2.tb_model_relationships;

CREATE TABLE public2.tb_model_relationships (
	id varchar(36) DEFAULT gen_random_uuid()::text NOT NULL,
	project_id varchar(36) NOT NULL,
	from_table varchar(255) NOT NULL,
	from_field varchar(255) NOT NULL,
	to_table varchar(255) NOT NULL,
	to_field varchar(255) NOT NULL,
	"type" varchar(10) NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT tb_model_relationships_pkey PRIMARY KEY (id),
	CONSTRAINT tb_model_relationships_type_check CHECK (((type)::text = ANY ((ARRAY['1:1'::character varying, '1:N'::character varying, 'N:1'::character varying, 'N:N'::character varying, '0:1'::character varying, '1:0'::character varying])::text[])))
);
CREATE INDEX idx_relationships_id ON public2.tb_model_relationships USING btree (id);
CREATE INDEX idx_relationships_project_id ON public2.tb_model_relationships USING btree (project_id);


-- public2.tb_model_tables definition

-- Drop table

-- DROP TABLE public2.tb_model_tables;

CREATE TABLE public2.tb_model_tables (
	id varchar(36) DEFAULT gen_random_uuid()::text NOT NULL,
	"name" varchar(255) NOT NULL,
	project_id varchar(36) NOT NULL,
	fields jsonb NOT NULL,
	"position" jsonb DEFAULT '{"x": 0, "y": 0}'::jsonb NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	"indexes" jsonb DEFAULT '[]'::jsonb NULL,
	CONSTRAINT tb_model_tables_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_tables_id ON public2.tb_model_tables USING btree (id);
CREATE INDEX idx_tables_project_id ON public2.tb_model_tables USING btree (project_id);

-- Table Triggers

create trigger update_tables_updated_at before
update
    on
    public2.tb_model_tables for each row execute function public2.update_updated_at_column();


-- public2.tb_model_users definition

-- Drop table

-- DROP TABLE public2.tb_model_users;

CREATE TABLE public2.tb_model_users (
	id varchar(36) DEFAULT gen_random_uuid()::text NOT NULL,
	email varchar(255) NOT NULL,
	hashed_password varchar(255) NOT NULL,
	nickname varchar(100) NOT NULL,
	is_verified bool DEFAULT false NULL,
	verification_code varchar(6) NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	password_reset_code varchar(6) NULL,
	password_reset_expires timestamptz NULL,
	CONSTRAINT tb_model_users_email_key UNIQUE (email),
	CONSTRAINT tb_model_users_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_users_email ON public2.tb_model_users USING btree (email);
CREATE INDEX idx_users_id ON public2.tb_model_users USING btree (id);

-- Table Triggers

create trigger update_users_updated_at before
update
    on
    public2.tb_model_users for each row execute function public2.update_updated_at_column();