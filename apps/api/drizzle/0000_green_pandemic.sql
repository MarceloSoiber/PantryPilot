CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "corpus_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"recipe_id" text NOT NULL,
	"language" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"ingredients" jsonb NOT NULL,
	"servings" integer,
	"prep_minutes" integer,
	"cook_minutes" integer,
	"dietary_tags" text[] NOT NULL,
	"allergens" text[] NOT NULL,
	"relevant_temperatures_c" jsonb,
	"source_name" text NOT NULL,
	"source_title" text NOT NULL,
	"source_author" text,
	"source_url" text NOT NULL,
	"source_license" text NOT NULL,
	"source_accessed_at" timestamp with time zone NOT NULL,
	"source_revision" integer,
	"embedding" vector(768) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "corpus_documents_recipe_language_chunk_unique" ON "corpus_documents" USING btree ("recipe_id","language","chunk_index");--> statement-breakpoint
CREATE INDEX "corpus_documents_embedding_hnsw" ON "corpus_documents" USING hnsw ("embedding" vector_cosine_ops);
