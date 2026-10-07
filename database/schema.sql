-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: customer_support
-- ------------------------------------------------------
-- Server version	8.0.46

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
-- Table structure for table `agents`
--

DROP TABLE IF EXISTS `agents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agents` (
                          `id` bigint NOT NULL AUTO_INCREMENT,
                          `department` varchar(255) DEFAULT NULL,
                          `email` varchar(255) DEFAULT NULL,
                          `name` varchar(255) DEFAULT NULL,
                          `status` varchar(255) DEFAULT NULL,
                          PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agents`
--

LOCK TABLES `agents` WRITE;
/*!40000 ALTER TABLE `agents` DISABLE KEYS */;
INSERT INTO `agents` VALUES (1,'CSKH','agent.a@company.com','Nguyen Van A','AVAILABLE'),(2,'KY_THUAT','agent.b@company.com','Tran Van B','AVAILABLE'),(3,'THANH_TOAN','agent.c@company.com','Le Thi C','AVAILABLE');
/*!40000 ALTER TABLE `agents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
                             `id` bigint NOT NULL AUTO_INCREMENT,
                             `name` varchar(255) NOT NULL,
                             `email` varchar(255) NOT NULL,
                             `phone` varchar(255) DEFAULT NULL,
                             `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                             PRIMARY KEY (`id`),
                             UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'nguyen hoang phuc','abc@gmail.com','09009312',NULL),(7,'','','',NULL),(8,'Nguyen Phi Phuc','phuc@gmaill.com','12131231',NULL),(9,'abc','poipoi@gmail.com','312312312',NULL),(10,'Nguyen Phúc Hoàng','phucabcas@gmail.com','090321312',NULL),(11,'Phúc Nguyễn','21301293asds@gmail.com','09231213',NULL);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_logs`
--

DROP TABLE IF EXISTS `ticket_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_logs` (
                               `id` bigint NOT NULL AUTO_INCREMENT,
                               `action` varchar(255) DEFAULT NULL,
                               `created_at` datetime(6) DEFAULT NULL,
                               `note` varchar(255) DEFAULT NULL,
                               `performed_by` varchar(255) DEFAULT NULL,
                               `ticket_id` bigint DEFAULT NULL,
                               PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_logs`
--

LOCK TABLES `ticket_logs` WRITE;
/*!40000 ALTER TABLE `ticket_logs` DISABLE KEYS */;
INSERT INTO `ticket_logs` VALUES (1,'AUTOMATION_PROCESS_COMPLETED','2026-10-06 17:14:52.932818','Đã tự động phân loại: COMPLAINT, độ ưu tiên: HIGH, gán cho Agent Nguyen Van A (ID: 1)','N8N_WORKFLOW',7);
/*!40000 ALTER TABLE `ticket_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_messages`
--

DROP TABLE IF EXISTS `ticket_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_messages` (
                                   `id` bigint NOT NULL AUTO_INCREMENT,
                                   `ticket_id` bigint NOT NULL,
                                   `sender_type` varchar(255) NOT NULL,
                                   `sender_id` varchar(255) DEFAULT NULL,
                                   `message_text` text NOT NULL,
                                   `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                                   PRIMARY KEY (`id`),
                                   KEY `ticket_id` (`ticket_id`),
                                   CONSTRAINT `ticket_messages_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_messages`
--

LOCK TABLES `ticket_messages` WRITE;
/*!40000 ALTER TABLE `ticket_messages` DISABLE KEYS */;
INSERT INTO `ticket_messages` VALUES (1,7,'CUSTOMER','11','Sản phẩm bị lỗi','2026-10-06 15:24:59');
/*!40000 ALTER TABLE `ticket_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
                           `id` bigint NOT NULL AUTO_INCREMENT,
                           `ticket_code` varchar(255) NOT NULL,
                           `customer_id` bigint NOT NULL,
                           `subject` varchar(255) NOT NULL,
                           `status` varchar(255) DEFAULT NULL,
                           `priority` varchar(255) DEFAULT NULL,
                           `category` varchar(255) DEFAULT NULL,
                           `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                           `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                           `assigned_agent_id` bigint DEFAULT NULL,
                           `assigned_user_id` bigint DEFAULT NULL,
                           `sla_due_at` datetime(6) DEFAULT NULL,
                           PRIMARY KEY (`id`),
                           UNIQUE KEY `ticket_code` (`ticket_code`),
                           KEY `customer_id` (`customer_id`),
                           CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
INSERT INTO `tickets` VALUES (1,'TK-2CE840DE',1,'Hỗ trợ khách hàng: Nguyen Van B','NEW',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,'TK-2E95E154',8,'Hỗ trợ khách hàng: Nguyen Phi Phuc','NEW',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,'TK-B22CFAFC',9,'Hỗ trợ khách hàng: abc','NEW',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,'TK-51526A47',1,'Hỗ trợ khách hàng: Nguyen Van B','NEW',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,'TK-82780344',1,'Hỗ trợ khách hàng: abc','NEW',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,'TK-3B53700D',10,'Hỗ trợ khách hàng: Nguyen Phúc Hoàng','NEW',NULL,NULL,'2026-10-06 15:16:35','2026-10-06 15:16:40',NULL,NULL,NULL),(7,'TK-F9EC552B',11,'Hỗ trợ khách hàng: Phúc Nguyễn','PROCESSING','HIGH','COMPLAINT','2026-10-06 15:24:59','2026-10-06 17:11:09',1,NULL,'2026-10-06 12:09:55.000000');
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-07 13:59:37
