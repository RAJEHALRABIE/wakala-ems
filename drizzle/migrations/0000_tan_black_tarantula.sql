ALTER TABLE `clients` ADD COLUMN `damage_to_remaining_comp` decimal(15,2);
--> statement-breakpoint
ALTER TABLE `clients` ADD COLUMN `extra_comp_rate` decimal(5,2);
--> statement-breakpoint
ALTER TABLE `clients` ADD COLUMN `official_compensation_amount` decimal(15,2);
--> statement-breakpoint
ALTER TABLE `clients` ADD COLUMN `valuation_document_id` varchar(255);