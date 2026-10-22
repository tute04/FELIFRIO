CREATE TABLE `operations` (
	`id` text PRIMARY KEY NOT NULL,
	`request` text NOT NULL,
	`actor` text NOT NULL,
	`revision` integer NOT NULL,
	`entry_id` text NOT NULL,
	`created_at` text NOT NULL
);
