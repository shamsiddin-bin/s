CREATE TABLE `challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`created` integer NOT NULL,
	`used` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `login_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`failures` integer DEFAULT 0 NOT NULL,
	`blocked_until` integer DEFAULT 0 NOT NULL,
	`lease` text,
	`lease_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'Yangi' NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_orders_status` ON `orders` (`status`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`description` text NOT NULL,
	`technologies` text NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`live` text DEFAULT '' NOT NULL,
	`github` text DEFAULT '' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`price` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`csrf` text NOT NULL,
	`expires` integer NOT NULL,
	`version` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
