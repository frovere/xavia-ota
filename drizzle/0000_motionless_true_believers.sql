-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"runtime_version" varchar(255) NOT NULL,
	"path" varchar(255) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"commit_hash" varchar(255) NOT NULL,
	"commit_message" varchar(255) NOT NULL,
	"update_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "releases_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_id" uuid NOT NULL,
	"download_timestamp" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"platform" varchar(50) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "releases_tracking" ADD CONSTRAINT "releases_tracking_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releases_tracking" ADD CONSTRAINT "fk_release" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE cascade ON UPDATE no action;
*/