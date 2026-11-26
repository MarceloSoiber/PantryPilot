CREATE TABLE "web_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"source_url" text NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"embedding" vector(768) NOT NULL
);
--> statement-breakpoint
CREATE INDEX "web_documents_expires_at" ON "web_documents" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "web_documents_embedding_hnsw" ON "web_documents" USING hnsw ("embedding" vector_cosine_ops);