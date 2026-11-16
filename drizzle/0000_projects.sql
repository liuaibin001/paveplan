CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`project_json` text NOT NULL,
	`delete_token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `projects_expires_at_idx` ON `projects` (`expires_at`);