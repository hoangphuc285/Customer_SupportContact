-- ============================================================================
-- FULL DATABASE SCHEMA & SEED DATA
-- CSDL: customer_support
-- Ho tro tu dong khoi tao khi chay Docker Compose lan dau
-- ============================================================================

SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;

-- MySQL dump 10.13  Distrib 8.4.13, for Linux (x86_64)
--
-- Host: localhost    Database: customer_support
-- ------------------------------------------------------
-- Server version	8.4.13

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attachments`
--

DROP TABLE IF EXISTS `attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attachments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_id` bigint DEFAULT NULL,
  `ticket_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKcf4ta8qdkixetfy7wnqfv3vkv` (`message_id`),
  KEY `FKay82o4g9v0hkdlh20yllwvutc` (`ticket_id`),
  CONSTRAINT `FKay82o4g9v0hkdlh20yllwvutc` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  CONSTRAINT `FKcf4ta8qdkixetfy7wnqfv3vkv` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `action` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `detail` json DEFAULT NULL,
  `entity_id` bigint DEFAULT NULL,
  `entity_type` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `workflow` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`)
) ENGINE=InnoDB AUTO_INCREMENT=211 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `complaints`
--

DROP TABLE IF EXISTS `complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaints` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `complaint_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `due_at` datetime(6) DEFAULT NULL,
  `resolution` text COLLATE utf8mb4_unicode_ci,
  `resolved_at` datetime(6) DEFAULT NULL,
  `root_cause` text COLLATE utf8mb4_unicode_ci,
  `severity` enum('CRITICAL','MAJOR','MINOR') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('CLOSED','IN_PROGRESS','OPEN','RESOLVED','WAITING_DEPARTMENT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('DELIVERY','OTHER','PAYMENT','PRODUCT','STAFF') COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_id` bigint DEFAULT NULL,
  `order_id` bigint DEFAULT NULL,
  `ticket_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK3nxmko0tdym843wmb05vw6g80` (`complaint_code`),
  KEY `idx_complaint_status` (`status`),
  KEY `FKrtes9yyruyvj69lxh3c9k05yf` (`department_id`),
  KEY `FKr32fabkp363nyst1byc5txf9u` (`order_id`),
  KEY `FKpoi27f6lpkrjqv5djw6xsv6hk` (`ticket_id`),
  CONSTRAINT `FKpoi27f6lpkrjqv5djw6xsv6hk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  CONSTRAINT `FKr32fabkp363nyst1byc5txf9u` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `FKrtes9yyruyvj69lxh3c9k05yf` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `messenger_id` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferred_language` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telegram_id` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vip` bit(1) NOT NULL,
  `zalo_id` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_customer_email` (`email`),
  KEY `idx_customer_phone` (`phone`),
  KEY `idx_customer_telegram` (`telegram_id`),
  KEY `idx_customer_zalo` (`zalo_id`),
  KEY `idx_customer_messenger` (`messenger_id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKl7tivi5261wxdnvo6cct9gg6t` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=285 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `escalation_events`
--

DROP TABLE IF EXISTS `escalation_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `escalation_events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `acknowledged` bit(1) NOT NULL,
  `ai_summary` text COLLATE utf8mb4_unicode_ci,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `risk_level` enum('HIGH','LOW','MEDIUM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `risk_score` int NOT NULL,
  `trigger_type` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notified_staff_id` bigint DEFAULT NULL,
  `ticket_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKpbj1fax6elpgmsq1ualttfxef` (`notified_staff_id`),
  KEY `FKikkymyn7kyf925hc5o2q926y7` (`ticket_id`),
  CONSTRAINT `FKikkymyn7kyf925hc5o2q926y7` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  CONSTRAINT `FKpbj1fax6elpgmsq1ualttfxef` FOREIGN KEY (`notified_staff_id`) REFERENCES `staff` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kb_documents`
--

DROP TABLE IF EXISTS `kb_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kb_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chunk_count` int NOT NULL,
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_ingested_at` datetime(6) DEFAULT NULL,
  `source_url` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','ARCHIVED','FAILED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vector_collection` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `version` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_error` text COLLATE utf8mb4_unicode_ci,
  `source_key` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKegruulb4ddl3nixgx042secxk` (`source_key`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `knowledge_gaps`
--

DROP TABLE IF EXISTS `knowledge_gaps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knowledge_gaps` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ADDED_TO_KB','IGNORED','NEW') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticket_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKbjalmwd2ec6qwhmgi18ppha46` (`ticket_id`),
  CONSTRAINT `FKbjalmwd2ec6qwhmgi18ppha46` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `ai_confidence` double DEFAULT NULL,
  `approved_by_human` bit(1) NOT NULL DEFAULT b'0',
  `channel` enum('EMAIL','INSTAGRAM','LIVECHAT','MESSENGER','PHONE','TELEGRAM','WEB','ZALO') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content_original` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_translated` text COLLATE utf8mb4_unicode_ci,
  `external_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sender_type` enum('AI','CUSTOMER','STAFF','SYSTEM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `staff_id` bigint DEFAULT NULL,
  `ticket_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_message_channel_external` (`channel`,`external_id`),
  KEY `idx_message_ticket` (`ticket_id`),
  KEY `FKe6faif8s6ypsx071vda1jjs3l` (`staff_id`),
  CONSTRAINT `FK6iv985o3ybdk63srj731en4ba` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  CONSTRAINT `FKe6faif8s6ypsx071vda1jjs3l` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=226 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `serial_number` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sku` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `warranty_months` int NOT NULL,
  `order_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_item_serial` (`serial_number`),
  KEY `FKbioxgbv59vetrxe0ejfubep1w` (`order_id`),
  CONSTRAINT `FKbioxgbv59vetrxe0ejfubep1w` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `delivered_at` datetime(6) DEFAULT NULL,
  `order_code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ordered_at` datetime(6) NOT NULL,
  `payment_method` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_fee` decimal(15,2) NOT NULL,
  `status` enum('CANCELLED','DELIVERED','PAID','PENDING','REFUNDED','SHIPPING') COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `tracking_code` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKdhk2umg8ijjkg4njg6891trit` (`order_code`),
  KEY `idx_order_customer` (`customer_id`),
  CONSTRAINT `FKpxtb8awmi0dk6smoh2vp1litg` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qa_scores`
--

DROP TABLE IF EXISTS `qa_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qa_scores` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `coaching_tip` text COLLATE utf8mb4_unicode_ci,
  `critical_violation` bit(1) NOT NULL,
  `grade` enum('FAIL','NEEDS_IMPROVEMENT','PASS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `scores` json DEFAULT NULL,
  `summary` text COLLATE utf8mb4_unicode_ci,
  `total_score` double NOT NULL,
  `violations` text COLLATE utf8mb4_unicode_ci,
  `staff_id` bigint DEFAULT NULL,
  `ticket_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK5fj7mmkd18l4phn576sf6jccw` (`staff_id`),
  KEY `FKqhdqr9nathbfrl8dgx9b0hn6p` (`ticket_id`),
  CONSTRAINT `FK5fj7mmkd18l4phn576sf6jccw` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`),
  CONSTRAINT `FKqhdqr9nathbfrl8dgx9b0hn6p` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `revoked` bit(1) NOT NULL,
  `token` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKghpmfn23vmxfu3spu3lfg4r2d` (`token`),
  KEY `idx_refresh_account` (`account_id`),
  CONSTRAINT `FKdgkqdk9vtvn8efmmga360g7br` FOREIGN KEY (`account_id`) REFERENCES `user_accounts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `refunds`
--

DROP TABLE IF EXISTS `refunds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refunds` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `approval_level` enum('AUTO','MANAGER','TEAM_LEAD') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` datetime(6) DEFAULT NULL,
  `evidence_url` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fraud_flag` bit(1) NOT NULL DEFAULT b'0',
  `paid_at` datetime(6) DEFAULT NULL,
  `payment_ref` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `refund_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('APPROVED','FAILED','PAID','PENDING_APPROVAL','PENDING_INFO','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `approved_by_id` bigint DEFAULT NULL,
  `order_id` bigint NOT NULL,
  `ticket_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKpd2n1pgn76pxi1c93glxotks0` (`refund_code`),
  KEY `idx_refund_status` (`status`),
  KEY `FKn0x60ynn3t9dra0aqeq6x40t8` (`approved_by_id`),
  KEY `FKsk9rqm7f6y8b1g0qob018hdm7` (`order_id`),
  KEY `FKlcljjuvuakfkpg7i4knsj6se8` (`ticket_id`),
  CONSTRAINT `FKlcljjuvuakfkpg7i4knsj6se8` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  CONSTRAINT `FKn0x60ynn3t9dra0aqeq6x40t8` FOREIGN KEY (`approved_by_id`) REFERENCES `staff` (`id`),
  CONSTRAINT `FKsk9rqm7f6y8b1g0qob018hdm7` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sla_rules`
--

DROP TABLE IF EXISTS `sla_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sla_rules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_response_minutes` int NOT NULL,
  `priority` enum('P1','P2','P3','P4') COLLATE utf8mb4_unicode_ci NOT NULL,
  `resolution_minutes` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sla_priority_category` (`priority`,`category`)
) ENGINE=InnoDB AUTO_INCREMENT=245 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `active` bit(1) NOT NULL,
  `current_load` int NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','AGENT','LEGAL','MANAGER','TEAM_LEAD','TECHNICIAN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `telegram_chat_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKpvctx4dbua9qh4p4s3gm3scrh` (`email`),
  KEY `FKak95wc1jnhsrrje4oaa03c6po` (`department_id`),
  CONSTRAINT `FKak95wc1jnhsrrje4oaa03c6po` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `ai_locked` bit(1) NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `channel` enum('EMAIL','INSTAGRAM','LIVECHAT','MESSENGER','PHONE','TELEGRAM','WEB','ZALO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `confidence` double DEFAULT NULL,
  `csat_score` int DEFAULT NULL,
  `due_at` datetime(6) DEFAULT NULL,
  `first_response_at` datetime(6) DEFAULT NULL,
  `intent` enum('COMPLAINT','FAQ','ORDER_STATUS','OTHER','PRODUCT_INFO','REFUND','WARRANTY') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_alert_level` int NOT NULL,
  `need_human_review` bit(1) NOT NULL,
  `priority` enum('P1','P2','P3','P4') COLLATE utf8mb4_unicode_ci NOT NULL,
  `resolved_at` datetime(6) DEFAULT NULL,
  `risk_score` int DEFAULT NULL,
  `sentiment` enum('NEGATIVE','NEUTRAL','POSITIVE','VERY_NEGATIVE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sla_breached` bit(1) NOT NULL,
  `status` enum('CLOSED','ESCALATED','NEW','OPEN','PENDING_APPROVAL','PENDING_CUSTOMER','RESOLVED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ticket_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `urgency` enum('HIGH','LOW','MEDIUM') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assignee_id` bigint DEFAULT NULL,
  `customer_id` bigint NOT NULL,
  `department_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKcvl4jbu5fln08ltem9rrmtp8w` (`ticket_code`),
  KEY `idx_ticket_status` (`status`),
  KEY `idx_ticket_customer` (`customer_id`),
  KEY `idx_ticket_assignee` (`assignee_id`),
  KEY `idx_ticket_due` (`due_at`),
  KEY `FKnnknc865fpw29hxyq3ma26rqo` (`department_id`),
  CONSTRAINT `FK1kivl02iwdu1vgdaqyhm06uee` FOREIGN KEY (`assignee_id`) REFERENCES `staff` (`id`),
  CONSTRAINT `FKi81xre2n3j3as1sp24j440kq1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `FKnnknc865fpw29hxyq3ma26rqo` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=182 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_accounts`
--

DROP TABLE IF EXISTS `user_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_accounts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `enabled` bit(1) NOT NULL,
  `failed_attempts` int NOT NULL,
  `last_login_at` datetime(6) DEFAULT NULL,
  `locked_until` datetime(6) DEFAULT NULL,
  `password_hash` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','AGENT','CUSTOMER','LEGAL','MANAGER','TEAM_LEAD','TECHNICIAN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` bigint DEFAULT NULL,
  `staff_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKf9sl209luxhu4rylls0h1m625` (`email`),
  UNIQUE KEY `UKf3xapwf8b7vd2l0p2i5lr7af2` (`customer_id`),
  UNIQUE KEY `UKndq0kganqewwaxiwhv4k34ddl` (`staff_id`),
  CONSTRAINT `FKahmjys2sn8sucxo55ln110kbm` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `FKg7k2f6wmw1m3uvts3na5oy43k` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `warranties`
--

DROP TABLE IF EXISTS `warranties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warranties` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `end_date` date NOT NULL,
  `serial_number` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `status` enum('ACTIVE','CLAIMED','EXPIRED','VOID') COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` bigint NOT NULL,
  `order_item_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKkqyk27q5kwtwjox80c8ebfkpi` (`serial_number`),
  KEY `idx_warranty_serial` (`serial_number`),
  KEY `FKqvebdpmcxkjtmskplfonec0q9` (`customer_id`),
  KEY `FK4ifovuhmhnlkxibr8wanfnnj5` (`order_item_id`),
  CONSTRAINT `FK4ifovuhmhnlkxibr8wanfnnj5` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`),
  CONSTRAINT `FKqvebdpmcxkjtmskplfonec0q9` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `warranty_cases`
--

DROP TABLE IF EXISTS `warranty_cases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warranty_cases` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `case_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fault_type` enum('MANUFACTURER','UNKNOWN','USER_DAMAGE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issue_description` text COLLATE utf8mb4_unicode_ci,
  `repair_fee` decimal(15,2) DEFAULT NULL,
  `resolution_type` enum('ONSITE','PAID_REPAIR','SERVICE_CENTER','SHIP_IN') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_center` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('CLOSED','COMPLETED','CREATED','RECEIVED','REJECTED','REPAIRING') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticket_id` bigint DEFAULT NULL,
  `warranty_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKj18tq69t25xq6qccmux38h87s` (`case_code`),
  KEY `FKm911cg49iwhxvav25we5dvrs1` (`ticket_id`),
  KEY `FKi8apg8hds84hbl6s6tkdxsp17` (`warranty_id`),
  CONSTRAINT `FKi8apg8hds84hbl6s6tkdxsp17` FOREIGN KEY (`warranty_id`) REFERENCES `warranties` (`id`),
  CONSTRAINT `FKm911cg49iwhxvav25we5dvrs1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-06 21:43:49


-- ============================================================================
-- SEED DATA CO DINH (INSERT IGNORE)
-- ============================================================================

-- ============================================================================
-- DU LIEU KHOI TAO HE THONG (DATA SEED - IDEMPOTENT)
-- Chay tu dong boi Spring Boot (defer-datasource-initialization: true, sql.init.mode: always)
-- Toan bo cau lenh su dung INSERT IGNORE INTO de khong gay duplicate key khi khoi dong lai.
-- ============================================================================

-- 1. PHONG BAN (DEPARTMENTS)
INSERT IGNORE INTO departments (id, code, name, created_at, updated_at) VALUES
  (1, 'SUPPORT',    'Chăm sóc khách hàng', now(6), now(6)),
  (2, 'WAREHOUSE',  'Kho',                 now(6), now(6)),
  (3, 'DELIVERY',   'Giao hàng',           now(6), now(6)),
  (4, 'TECH',       'Kỹ thuật',            now(6), now(6)),
  (5, 'ACCOUNTING', 'Kế toán',             now(6), now(6)),
  (6, 'SALES',      'Kinh doanh',          now(6), now(6)),
  (7, 'LEGAL',      'Pháp chế',            now(6), now(6));

-- 2. QUY TAC SLA (SLA RULES: P1 15p/4h, P2 1h/24h, P3 24h/72h, P4 48h/120h)
INSERT IGNORE INTO sla_rules (id, priority, category, first_response_minutes, resolution_minutes, created_at, updated_at) VALUES
  (1, 'P1', 'DEFAULT',   15,   240, now(6), now(6)),
  (2, 'P2', 'DEFAULT',   60,  1440, now(6), now(6)),
  (3, 'P3', 'DEFAULT', 1440,  4320, now(6), now(6)),
  (4, 'P4', 'DEFAULT', 2880,  7200, now(6), now(6)),
  (5, 'P1', 'COMPLAINT', 15,   120, now(6), now(6)),
  (6, 'P2', 'REFUND',    60,   720, now(6), now(6));

-- 3. NHAN VIEN CO DINH (STAFF)
INSERT IGNORE INTO staff (id, email, full_name, role, active, current_load, department_id, created_at, updated_at) VALUES
  (1, 'admin@support.local',    'Quản trị hệ thống', 'ADMIN',      1, 0, 1, now(6), now(6)),
  (2, 'manager@support.local',  'Quản lý CSKH',     'MANAGER',    1, 0, 1, now(6), now(6)),
  (3, 'teamlead@support.local', 'Trưởng nhóm CSKH', 'TEAM_LEAD',  1, 0, 1, now(6), now(6)),
  (4, 'agent@support.local',     'Nhân viên CSKH',   'AGENT',      1, 0, 1, now(6), now(6)),
  (5, 'tech@support.local',      'Kỹ thuật viên',    'TECHNICIAN', 1, 0, 4, now(6), now(6));

-- 4. KHACH HANG CO DINH (CUSTOMERS - Khop voi Luong n8n & Telegram)
INSERT IGNORE INTO customers (id, full_name, email, phone, telegram_id, zalo_id, vip, preferred_language, created_at, updated_at) VALUES
  (1, 'Khách hàng mẫu',  'customer@example.com',     '0901234567', NULL,         'zalo_user_999', 0, 'vi', now(6), now(6)),
  (2, 'Nguyen Van Test', 'nguyenphucphi213@gmail.com', '0901234567', '7919420845', NULL,            1, 'vi', now(6), now(6)),
  (3, 'Nguyễn Phúc',     'abcas@gmail.com',          '0949077256', NULL,         NULL,            0, 'vi', now(6), now(6));

-- 5. DON HANG CO DINH (ORDERS: DH-1001 -> DH-1026)
INSERT IGNORE INTO orders (id, order_code, customer_id, total_amount, shipping_fee, status, payment_method, ordered_at, delivered_at, tracking_code, created_at, updated_at) VALUES
  (1, 'DH-1001', 2, 350000.00, 20000.00, 'REFUNDED', 'COD', '2026-10-31 13:34:23.433890', '2026-11-02 13:34:23.433890', 'VN1001XX', now(6), now(6)),
  (2, 'DH-1002', 2, 2500000.00, 30000.00, 'DELIVERED', 'COD', '2026-10-30 13:34:23.433890', '2026-11-01 13:34:23.433890', 'VN1002XX', now(6), now(6)),
  (3, 'DH-1003', 2, 8900000.00, 0.00, 'DELIVERED', 'COD', '2026-11-01 13:34:23.433890', '2026-11-03 13:34:23.433890', 'VN1003XX', now(6), now(6)),
  (4, 'DH-1004', 2, 1200000.00, 20000.00, 'DELIVERED', 'COD', '2026-10-16 13:34:23.433890', '2026-10-18 13:34:23.433890', 'VN1004XX', now(6), now(6)),
  (5, 'DH-1005', 2, 15900000.00, 0.00, 'DELIVERED', 'COD', '2025-06-23 13:34:23.433890', '2025-06-28 13:34:23.433890', 'VN1005XX', now(6), now(6)),
  (6, 'DH1024', 2, 850000.00, 30000.00, 'DELIVERED', 'MOMOPAY', '2026-11-01 10:00:00.000000', '2026-11-03 14:00:00.000000', 'GHN1024VN', now(6), now(6)),
  (7, 'DH-1006', 1, 1450000.00, 0.00, 'DELIVERED', 'COD', '2026-11-01 09:15:00.000000', '2026-11-03 16:30:00.000000', 'VNPOST1006', now(6), now(6)),
  (8, 'DH-1007', 1, 4890000.00, 0.00, 'DELIVERED', 'VNPAY', '2026-10-31 08:00:00.000000', '2026-11-02 11:20:00.000000', 'JNT1007VN', now(6), now(6)),
  (9, 'DH-1008', 2, 6990000.00, 0.00, 'DELIVERED', 'BANK_TRANSFER', '2026-10-25 14:30:00.000000', '2026-10-27 15:45:00.000000', 'GHN1008VN', now(6), now(6)),
  (10, 'DH-1009', 1, 2490000.00, 30000.00, 'DELIVERED', 'MOMOPAY', '2026-10-29 11:00:00.000000', '2026-10-31 14:00:00.000000', 'VNPOST1009', now(6), now(6)),
  (11, 'DH-1010', 2, 890000.00, 25000.00, 'DELIVERED', 'COD', '2026-11-03 16:00:00.000000', '2026-11-04 10:00:00.000000', 'GHN1010VN', now(6), now(6)),
  (12, 'DH-1011', 1, 1950000.00, 0.00, 'DELIVERED', 'VNPAY', '2026-10-15 08:30:00.000000', '2026-10-17 13:00:00.000000', 'JNT1011VN', now(6), now(6)),
  (13, 'DH-1012', 2, 3200000.00, 0.00, 'DELIVERED', 'BANK_TRANSFER', '2026-11-02 14:00:00.000000', '2026-11-04 15:30:00.000000', 'GHN1012VN', now(6), now(6)),
  (14, 'DH-1013', 1, 2150000.00, 0.00, 'DELIVERED', 'MOMOPAY', '2026-10-28 09:00:00.000000', '2026-10-30 11:00:00.000000', 'VNPOST1013', now(6), now(6)),
  (15, 'DH-1014', 2, 990000.00, 20000.00, 'DELIVERED', 'COD', '2026-11-01 10:20:00.000000', '2026-11-03 14:15:00.000000', 'GHN1014VN', now(6), now(6)),
  (16, 'DH-1015', 1, 1650000.00, 0.00, 'DELIVERED', 'VNPAY', '2026-10-20 13:00:00.000000', '2026-10-22 17:00:00.000000', 'JNT1015VN', now(6), now(6)),
  (17, 'DH-1016', 2, 3490000.00, 0.00, 'DELIVERED', 'BANK_TRANSFER', '2026-09-10 11:00:00.000000', '2026-09-12 16:00:00.000000', 'VNPOST1016', now(6), now(6)),
  (18, 'DH-1017', 1, 750000.00, 25000.00, 'DELIVERED', 'MOMOPAY', '2026-11-03 08:00:00.000000', '2026-11-05 09:30:00.000000', 'GHN1017VN', now(6), now(6)),
  (19, 'DH-1018', 2, 650000.00, 20000.00, 'DELIVERED', 'COD', '2026-10-05 15:00:00.000000', '2026-10-07 10:00:00.000000', 'JNT1018VN', now(6), now(6)),
  (20, 'DH-1019', 1, 390000.00, 20000.00, 'DELIVERED', 'COD', '2026-11-02 11:30:00.000000', '2026-11-04 16:00:00.000000', 'GHN1019VN', now(6), now(6)),
  (21, 'DH-1020', 2, 1190000.00, 0.00, 'DELIVERED', 'VNPAY', '2026-08-15 10:00:00.000000', '2026-08-17 14:00:00.000000', 'VNPOST1020', now(6), now(6)),
  (22, 'DH-1021', 1, 2890000.00, 0.00, 'DELIVERED', 'BANK_TRANSFER', '2026-11-01 13:00:00.000000', '2026-11-03 15:00:00.000000', 'GHN1021VN', now(6), now(6)),
  (23, 'DH-1022', 2, 1150000.00, 0.00, 'DELIVERED', 'MOMOPAY', '2026-10-29 09:30:00.000000', '2026-10-31 16:00:00.000000', 'JNT1022VN', now(6), now(6)),
  (24, 'DH-1023', 1, 1790000.00, 0.00, 'REFUNDED', 'VNPAY', '2026-10-25 14:00:00.000000', '2026-10-27 10:30:00.000000', 'VNPOST1023', now(6), now(6)),
  (25, 'DH-1025', 2, 550000.00, 20000.00, 'DELIVERED', 'COD', '2026-11-02 08:30:00.000000', '2026-11-04 11:00:00.000000', 'GHN1025VN', now(6), now(6)),
  (26, 'DH-1026', 1, 9900000.00, 0.00, 'DELIVERED', 'BANK_TRANSFER', '2026-11-01 16:00:00.000000', '2026-11-03 14:00:00.000000', 'JNT1026VN', now(6), now(6));

-- 6. SAN PHAM DON HANG (ORDER ITEMS: San pham tieng Viet chuan UTF-8 & Serial)
INSERT IGNORE INTO order_items (id, order_id, product_name, sku, serial_number, quantity, unit_price, warranty_months, created_at, updated_at) VALUES
  (1, 1, 'Tai nghe Bluetooth VKU Air', 'VKU-AIR', 'SN-TN-0001', 1, 350000.00, 12, now(6), now(6)),
  (2, 2, 'Loa Bluetooth VKU Pro', 'VKU-LOA-PRO', 'SN-LOA-0002', 1, 2500000.00, 12, now(6), now(6)),
  (3, 3, 'Laptop VKU Book 14', 'VKU-BOOK14', 'SN-LAP-0003', 1, 8900000.00, 24, now(6), now(6)),
  (4, 4, 'Chuột không dây VKU M2', 'VKU-M2', 'SN-CH-0004', 1, 1200000.00, 12, now(6), now(6)),
  (5, 5, 'Điện thoại VKU Phone X', 'VKU-PHX', 'SN-PH-0005', 1, 15900000.00, 12, now(6), now(6)),
  (6, 6, 'Tai nghe XYZ Bluetooth', 'XYZ-AIR', 'SN-XYZ-1024', 1, 850000.00, 12, now(6), now(6)),
  (7, 7, 'Bàn phím cơ Không dây RGB Pro', 'KB-RGB-06', 'SN-KB-1006', 1, 1450000.00, 24, now(6), now(6)),
  (8, 8, 'Màn hình Gaming 27 inch 165Hz', 'MON-27-07', 'SN-MON-1007', 1, 4890000.00, 36, now(6), now(6)),
  (9, 9, 'Tai nghe chống ồn Sony WH-1000XM5', 'SN-WH5-08', 'SN-WH5-1008', 1, 6990000.00, 12, now(6), now(6)),
  (10, 10, 'Đồng hồ thông minh Watch Fit 3', 'WF-09', 'SN-WF-1009', 1, 2490000.00, 12, now(6), now(6)),
  (11, 11, 'Củ sạc GaN 100W 4 Cổng Baseus', 'CHG-GAN-10', 'SN-CHG-1010', 1, 890000.00, 12, now(6), now(6)),
  (12, 12, 'Webcam 4K Ultra HD Face Focus', 'CAM-4K-11', 'SN-CAM-1011', 1, 1950000.00, 12, now(6), now(6)),
  (13, 13, 'Micro thu âm Podcast Rode Pro', 'MIC-RODE-12', 'SN-MIC-1012', 1, 3200000.00, 24, now(6), now(6)),
  (14, 14, 'Ổ cứng SSD di động 1TB Gen4', 'SSD-1TB-13', 'SN-SSD-1013', 1, 2150000.00, 36, now(6), now(6)),
  (15, 15, 'Loa thông minh Voice Assistant AI', 'SPK-AI-14', 'SN-SPK-1014', 1, 990000.00, 12, now(6), now(6)),
  (16, 16, 'Router Wifi 6 AX3000 Mesh', 'RT-WIFI6-15', 'SN-RT-1015', 1, 1650000.00, 24, now(6), now(6)),
  (17, 17, 'Máy lọc không khí AirCare Pro', 'AIR-PRO-16', 'SN-AIR-1016', 1, 3490000.00, 12, now(6), now(6)),
  (18, 18, 'Pin sạc dự phòng 20000mAh 65W', 'PB-20K-17', 'SN-PB-1017', 1, 750000.00, 12, now(6), now(6)),
  (19, 19, 'Bút cảm ứng Stylus Pen Gen 2', 'PEN-G2-18', 'SN-PEN-1018', 1, 650000.00, 12, now(6), now(6)),
  (20, 20, 'Bàn di chuột LED RGB XL', 'PAD-RGB-19', 'SN-PAD-1019', 1, 390000.00, 6, now(6), now(6)),
  (21, 21, 'Camera an ninh ngoài trời 360', 'CAM-360-20', 'SN-CAM-1020', 1, 1190000.00, 24, now(6), now(6)),
  (22, 22, 'Thiết bị stream Capture Card 4K', 'CAP-4K-21', 'SN-CAP-1021', 1, 2890000.00, 12, now(6), now(6)),
  (23, 23, 'Tay cầm chơi game Wireless Hall-Effect', 'PAD-WL-22', 'SN-PAD-1022', 1, 1150000.00, 12, now(6), now(6)),
  (24, 24, 'Gimbal chống rung smartphone 3 trục', 'GMB-3AX-23', 'SN-GMB-1023', 1, 1790000.00, 12, now(6), now(6)),
  (25, 25, 'Đèn bàn bảo vệ thị lực thông minh', 'LMP-EYE-25', 'SN-LMP-1025', 1, 550000.00, 12, now(6), now(6)),
  (26, 26, 'Kính thực tế ảo VR Headset Pro', 'VR-PRO-26', 'SN-VR-1026', 1, 9900000.00, 12, now(6), now(6));

-- 7. SO BAO HANH (WARRANTIES)
INSERT IGNORE INTO warranties (id, order_item_id, customer_id, serial_number, start_date, end_date, status, created_at, updated_at) VALUES
  (1, 1, 2, 'SN-TN-0001', '2026-11-02', '2027-11-02', 'ACTIVE', now(6), now(6)),
  (2, 2, 2, 'SN-LOA-0002', '2026-11-01', '2027-11-01', 'ACTIVE', now(6), now(6)),
  (3, 3, 2, 'SN-LAP-0003', '2026-11-03', '2028-11-03', 'ACTIVE', now(6), now(6)),
  (4, 4, 2, 'SN-CH-0004', '2026-10-18', '2027-10-18', 'ACTIVE', now(6), now(6)),
  (5, 5, 2, 'SN-PH-0005', '2025-06-28', '2026-06-28', 'EXPIRED', now(6), now(6)),
  (6, 6, 2, 'SN-XYZ-1024', '2026-11-03', '2027-03-31', 'ACTIVE', now(6), now(6)),
  (7, 7, 1, 'SN-KB-1006', '2026-11-03', '2028-11-03', 'ACTIVE', now(6), now(6)),
  (8, 8, 1, 'SN-MON-1007', '2026-11-02', '2029-11-02', 'ACTIVE', now(6), now(6)),
  (9, 9, 2, 'SN-WH5-1008', '2026-10-27', '2027-10-27', 'ACTIVE', now(6), now(6)),
  (10, 10, 1, 'SN-WF-1009', '2026-10-31', '2027-10-31', 'ACTIVE', now(6), now(6)),
  (11, 11, 2, 'SN-CHG-1010', '2026-11-04', '2027-11-04', 'ACTIVE', now(6), now(6)),
  (12, 12, 1, 'SN-CAM-1011', '2026-10-17', '2027-10-17', 'ACTIVE', now(6), now(6)),
  (13, 13, 2, 'SN-MIC-1012', '2026-11-04', '2028-11-04', 'ACTIVE', now(6), now(6)),
  (14, 14, 1, 'SN-SSD-1013', '2026-10-30', '2029-10-30', 'ACTIVE', now(6), now(6)),
  (15, 15, 2, 'SN-SPK-1014', '2026-11-03', '2027-11-03', 'ACTIVE', now(6), now(6)),
  (16, 16, 1, 'SN-RT-1015', '2026-10-22', '2028-10-22', 'ACTIVE', now(6), now(6)),
  (17, 17, 2, 'SN-AIR-1016', '2026-09-12', '2027-09-12', 'ACTIVE', now(6), now(6)),
  (18, 18, 1, 'SN-PB-1017', '2026-11-05', '2027-11-05', 'ACTIVE', now(6), now(6)),
  (19, 19, 2, 'SN-PEN-1018', '2026-10-07', '2027-10-07', 'ACTIVE', now(6), now(6)),
  (20, 20, 1, 'SN-PAD-1019', '2026-11-04', '2027-05-04', 'ACTIVE', now(6), now(6)),
  (21, 21, 2, 'SN-CAM-1020', '2026-08-17', '2028-08-17', 'ACTIVE', now(6), now(6)),
  (22, 22, 1, 'SN-CAP-1021', '2026-11-03', '2027-11-03', 'ACTIVE', now(6), now(6)),
  (23, 23, 2, 'SN-PAD-1022', '2026-10-31', '2027-10-31', 'ACTIVE', now(6), now(6)),
  (24, 24, 1, 'SN-GMB-1023', '2026-10-27', '2027-10-27', 'ACTIVE', now(6), now(6)),
  (25, 25, 2, 'SN-LMP-1025', '2026-11-04', '2027-11-04', 'ACTIVE', now(6), now(6)),
  (26, 26, 1, 'SN-VR-1026', '2026-11-03', '2027-11-03', 'ACTIVE', now(6), now(6));

-- 8. TAI LIEU KHO TRI THUC (KB DOCUMENTS)
INSERT IGNORE INTO kb_documents (id, title, category, chunk_count, source_key, source_url, status, version, created_at, updated_at) VALUES
  (1, 'Chính sách Chăm sóc Khách hàng VKU Store', 'POLICY', 1, 'policy-cskh-2026', 'http://172.17.0.1:8000/chinh-sach.txt', 'FAILED', '2', now(6), now(6)),
  (2, 'Chính sách Đổi trả & Hoàn tiền 7 ngày (Luồng L09)', 'POLICY', 3, 'policy-refund-7days', 'https://kb.example.com/chinh-sach-doi-tra.md', 'FAILED', '1', now(6), now(6)),
  (3, 'Quy định Bảo hành thiết bị và Tiếp nhận sửa chữa (Luồng L10)', 'WARRANTY', 4, 'warranty-policy-rules', 'https://kb.example.com/quy-dinh-bao-hanh.md', 'FAILED', '1', now(6), now(6)),
  (4, 'Hướng dẫn Tra cứu Tiến độ Giao hàng & Vận chuyển (Luồng L01-L02)', 'SHIPPING', 2, 'shipping-tracking-guide', 'https://kb.example.com/tra-cuu-van-don.md', 'FAILED', '1', now(6), now(6)),
  (5, 'Quy trình Tiếp nhận và Xử lý Khiếu nại Dịch vụ CSKH (Luồng L08)', 'COMPLAINT', 3, 'complaint-intake-rules', 'https://kb.example.com/khieu-nai-dich-vu.md', 'FAILED', '1', now(6), now(6)),
  (6, 'Tiêu chuẩn Phản hồi SLA P1-P4 và Escalate gặp Chuyên viên (Luồng L06-L07)', 'SLA', 2, 'sla-escalation-policy', 'https://kb.example.com/cam-ket-sla.md', 'FAILED', '1', now(6), now(6)),
  (7, 'Hướng dẫn Tra cứu Đơn hàng qua Mã Đơn (#DH1024) và Serial thiết bị', 'ORDER_LOOKUP', 2, 'order-serial-lookup-guide', 'https://kb.example.com/tra-cuu-don-hang.md', 'FAILED', '1', now(6), now(6));

-- 9. PHIEU HOAN TIEN MAU (REFUNDS)
INSERT IGNORE INTO refunds (id, refund_code, order_id, amount, reason, status, approval_level, payment_ref, evidence_url, fraud_flag, created_at, updated_at) VALUES
  (1, 'RF-1001', 1, 350000.00, 'Sản phẩm lỗi kết nối tai nghe, đổi mẫu mới hoặc hoàn tiền', 'PAID', 'AUTO', 'PAY_MB_1001', 'https://example.com/port_defect.jpg', b'0', now(6) - INTERVAL 2 DAY, now(6) - INTERVAL 2 DAY),
  (2, 'RF-1002', 2, 2500000.00, 'Khách hàng đổi ý trong 7 ngày, sản phẩm nguyên seal', 'APPROVED', 'TEAM_LEAD', 'PAY_MB_1002', 'https://example.com/seal.jpg', b'0', now(6) - INTERVAL 1 DAY, now(6) - INTERVAL 1 DAY);

-- 10. TICKETS MAU (TICKETS)
INSERT IGNORE INTO tickets (id, ticket_code, customer_id, channel, priority, status, subject, ai_locked, last_alert_level, need_human_review, sla_breached, created_at, updated_at, due_at) VALUES
  (101, 'TK-882194', 1, 'LIVECHAT', 'P2', 'OPEN', 'Yêu cầu kiểm tra tiến độ giao hàng đơn DH-1006', b'0', 0, b'0', b'0', now(6) - INTERVAL 2 HOUR, now(6), now(6) + INTERVAL 2 HOUR),
  (102, 'TK-774012', 1, 'ZALO', 'P2', 'PENDING_APPROVAL', 'Yêu cầu đổi trả tai nghe Bluetooth VKU Air', b'0', 0, b'0', b'0', now(6) - INTERVAL 1 DAY, now(6), now(6) + INTERVAL 12 HOUR),
  (103, 'TK-659021', 1, 'EMAIL', 'P3', 'RESOLVED', 'Hoàn tất hoàn tiền đơn hàng DH-1001 qua chuyển khoản', b'0', 0, b'0', b'0', now(6) - INTERVAL 5 DAY, now(6) - INTERVAL 5 DAY, now(6) - INTERVAL 4 DAY);


SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
