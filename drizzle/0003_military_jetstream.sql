ALTER TABLE `clients` ADD `agency_date` date;--> statement-breakpoint
ALTER TABLE `clients` ADD `property_doc_type` enum('Deed','Ihkam','Revivals','Other') DEFAULT 'Deed';--> statement-breakpoint
ALTER TABLE `clients` ADD `request_number` varchar(50);--> statement-breakpoint
ALTER TABLE `clients` ADD `request_date` date;--> statement-breakpoint
ALTER TABLE `clients` ADD `property_description` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `clients` ADD `map_link` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `latitude` decimal(10,8);--> statement-breakpoint
ALTER TABLE `clients` ADD `longitude` decimal(11,8);--> statement-breakpoint
ALTER TABLE `clients` DROP COLUMN `agent_type`;--> statement-breakpoint
ALTER TABLE `clients` DROP COLUMN `ownership_type`;--> statement-breakpoint
ALTER TABLE `clients` DROP COLUMN `ehkam_request_number`;