CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`amount_minor` integer NOT NULL,
	`category` text NOT NULL,
	`occurred_on` text NOT NULL,
	`description` text,
	`is_example` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `expenses_occurred_on_idx` ON `expenses` (`occurred_on`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`currency` text NOT NULL,
	`monthly_budget_minor` integer,
	`examples_seeded` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
