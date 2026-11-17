CREATE TABLE `couriers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `couriers_email_unique` ON `couriers` (`email`);--> statement-breakpoint
CREATE INDEX `couriers_active_idx` ON `couriers` (`active`);--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipient_name` text NOT NULL,
	`recipient_phone` text NOT NULL,
	`pickup_address` text NOT NULL,
	`dropoff_address` text NOT NULL,
	`parcel_description` text NOT NULL,
	`notes` text,
	`status` text NOT NULL,
	`courier_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`courier_id`) REFERENCES `couriers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `deliveries_status_idx` ON `deliveries` (`status`);--> statement-breakpoint
CREATE INDEX `deliveries_courier_idx` ON `deliveries` (`courier_id`);--> statement-breakpoint
CREATE INDEX `deliveries_created_idx` ON `deliveries` (`created_at`);--> statement-breakpoint
CREATE TABLE `delivery_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`delivery_id` integer NOT NULL,
	`status` text NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`delivery_id`) REFERENCES `deliveries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `delivery_events_delivery_idx` ON `delivery_events` (`delivery_id`,`created_at`);