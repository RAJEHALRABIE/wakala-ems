CREATE TABLE `client_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`action_type` enum('STATUS_CHANGE','DOC_UPLOAD','DOC_DELETE','WHATSAPP_SENT','NOTE_ADD') NOT NULL,
	`description` text,
	`meta` json,
	`performed_by_user_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`note` text NOT NULL,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clients` ADD `agency_issue_date` date;--> statement-breakpoint
ALTER TABLE `clients` ADD `agency_duration_days` int;--> statement-breakpoint
ALTER TABLE `clients` ADD `agency_end_date` date;--> statement-breakpoint
ALTER TABLE `clients` ADD `agency_expiry_date` timestamp;--> statement-breakpoint
ALTER TABLE `clients` ADD `deed_area_sqm` decimal(12,2);--> statement-breakpoint
ALTER TABLE `clients` ADD `improvement_types` json;--> statement-breakpoint
ALTER TABLE `clients` ADD `improvement_other_description` varchar(500);