CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`name` varchar(255) NOT NULL,
	`id_number` varchar(20),
	`birth_date` date,
	`phone` varchar(20),
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20),
	`id_number` varchar(20),
	`agent_id` int,
	`wakalah_number` varchar(50),
	`agent_type` enum('A','B','Joint') DEFAULT 'A',
	`ownership_type` enum('SAK','EHKAM_REQ') DEFAULT 'SAK',
	`deed_number` varchar(50),
	`deed_date` date,
	`ehkam_request_number` varchar(50),
	`district` varchar(100),
	`survey_map_ref` varchar(500),
	`status` enum('New','FileSubmitted','Processing','Valuation','Objection','PaymentPending','CheckIssued','Completed') NOT NULL DEFAULT 'New',
	`area_sqm` int,
	`expected_compensation_per_sqm` int,
	`expected_compensation_total` int,
	`success_fee` int,
	`base_fee_percentage` int DEFAULT 0,
	`ref_code` varchar(20),
	`missing_documents` text,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`document_type` enum('ownership_deed','owner_id','legal_wakalah','agent_id','survey_report','heirs_certificate','other') NOT NULL,
	`custom_name` varchar(255),
	`file_name` varchar(255) NOT NULL,
	`file_url` text NOT NULL,
	`file_key` varchar(255) NOT NULL,
	`file_size` int,
	`mime_type` varchar(100),
	`doc_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`uploaded_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_key_unique` UNIQUE(`key`)
);
