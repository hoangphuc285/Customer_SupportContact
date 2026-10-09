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
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `role` enum('CUSTOMER','STAFF') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKn7ihswpy07ci568w34q0oi8he` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts`
--

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
INSERT INTO `accounts` VALUES (1,'2026-10-09 17:54:06.802975','testchatbox@gmail.com','Nguyễn Hoàng Phúc','123456','01923123123','CUSTOMER'),(2,'2026-10-09 18:24:56.000000','staff1@vku.edu.vn','Nguyễn Văn A (CSKH)','123456','0905111222','STAFF'),(3,'2026-10-09 18:24:56.000000','staff2@vku.edu.vn','Trần Thị B (Kỹ Thuật)','123456','0905333444','STAFF'),(4,'2026-10-09 18:28:46.734036','testchatbox2@gmail.com','Nguyễn ','123456','','CUSTOMER');
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agents`
--

DROP TABLE IF EXISTS `agents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `account_id` bigint NOT NULL,
  `department` varchar(255) DEFAULT 'CSKH',
  `status` varchar(255) DEFAULT 'AVAILABLE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_account_id` (`account_id`),
  CONSTRAINT `fk_agents_accounts` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agents`
--

LOCK TABLES `agents` WRITE;
/*!40000 ALTER TABLE `agents` DISABLE KEYS */;
INSERT INTO `agents` VALUES (1,2,'CSKH','AVAILABLE'),(2,3,'KY_THUAT','AVAILABLE');
/*!40000 ALTER TABLE `agents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_conversations`
--

DROP TABLE IF EXISTS `chat_conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_conversations` (
  `conversation_id` varchar(50) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `customer_id` bigint DEFAULT NULL,
  `status` enum('CLOSED','OPEN','WAITING_AGENT') NOT NULL,
  `ticket_id` bigint DEFAULT NULL,
  PRIMARY KEY (`conversation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_conversations`
--

LOCK TABLES `chat_conversations` WRITE;
/*!40000 ALTER TABLE `chat_conversations` DISABLE KEYS */;
INSERT INTO `chat_conversations` VALUES ('CHAT-526841','2026-10-09 18:28:46.869290',4,'OPEN',NULL),('CHAT-557075','2026-10-09 18:29:17.089130',1,'OPEN',NULL),('CHAT-620484','2026-10-09 17:57:00.508486',1,'WAITING_AGENT',NULL);
/*!40000 ALTER TABLE `chat_conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `conversation_id` varchar(50) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `message` text NOT NULL,
  `sender_type` enum('AGENT','AI','CUSTOMER') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES (1,'CHAT-620484','2026-10-09 17:57:06.964833','hi','CUSTOMER'),(2,'CHAT-620484','2026-10-09 17:57:37.577652','hi','CUSTOMER'),(3,'CHAT-620484','2026-10-09 17:59:21.305911','hi','CUSTOMER'),(4,'CHAT-620484','2026-10-09 18:02:28.379977','hi','CUSTOMER'),(5,'CHAT-620484','2026-10-09 18:02:30.814151','Chào bạn, tôi là trợ lý AI của VKU Support. Tôi có thể giúp gì cho bạn?','AI'),(6,'CHAT-620484','2026-10-09 18:03:00.706933','sản phẩm của tôi bị lỗi','CUSTOMER'),(7,'CHAT-620484','2026-10-09 18:03:58.515064','sản phẩm của tôi bị lỗi','CUSTOMER'),(8,'CHAT-620484','2026-10-09 18:04:06.135129','Tôi rất tiếc khi biết sản phẩm của bạn đang gặp lỗi. Đây là một vấn đề cần được bộ phận hỗ trợ kỹ thuật kiểm tra trực tiếp. Tôi sẽ chuyển thông tin của bạn đến nhân viên hỗ trợ để họ liên hệ với bạn sớm nhất có thể và giúp bạn giải quyết vấn đề này.','AI'),(9,'CHAT-620484','2026-10-09 18:06:25.100414','chào bạn','AGENT'),(10,'CHAT-620484','2026-10-09 18:06:35.443670','sản phẩm của tôi bị lỗi','CUSTOMER'),(11,'CHAT-557075','2026-10-09 18:48:49.303091','hii','CUSTOMER');
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'nguyen hoang phuc','abc@gmail.com','09009312',NULL),(7,'','','',NULL),(8,'Nguyen Phi Phuc','phuc@gmaill.com','12131231',NULL),(9,'abc','poipoi@gmail.com','312312312',NULL),(10,'Nguyen Phúc Hoàng','phucabcas@gmail.com','090321312',NULL),(11,'Phúc Nguyễn','21301293asds@gmail.com','09231213',NULL),(12,'Nguyễn Phúc Phi ','phi@gmail.com','09120312',NULL),(13,'Nguyễn Phúc phi ','phii@gmail.com','',NULL),(14,'Nguyễn Phúc Phi ','pphi@gmail.com','09123123',NULL),(15,'Nguyen Hoang Phuc','phuacsacsa@gmail.com','0912321',NULL),(16,'dsadsadsa','adsadsa@gmail.com','',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_logs`
--

LOCK TABLES `ticket_logs` WRITE;
/*!40000 ALTER TABLE `ticket_logs` DISABLE KEYS */;
INSERT INTO `ticket_logs` VALUES (1,'AUTOMATION_PROCESS_COMPLETED','2026-10-06 17:14:52.932818','Đã tự động phân loại: COMPLAINT, độ ưu tiên: HIGH, gán cho Agent Nguyen Van A (ID: 1)','N8N_WORKFLOW',7),(2,'CUSTOMER_FEEDBACK','2026-10-08 16:03:58.737424','Tôi vẫn chưa nhận được sản phẩm mới.','CUSTOMER',7),(3,'REASSIGN_TICKET','2026-10-08 17:33:36.053834','Hệ thống đã phân công ticket cho Nhân viên ID:1 . Mức ưu tiên: URGENT','SYSTEM',7),(4,'CUSTOMER_FEEDBACK','2026-10-08 17:37:34.707785','Tôi vẫn chưa nhận được sản phẩm mới.','CUSTOMER',7),(5,'ASSIGN_TICKET','2026-10-09 02:24:01.256006','Hệ thống đã phân công ticket cho Nhân viên ID:2 . Mức ưu tiên: MEDIUM','SYSTEM',10),(6,'STATUS_CHANGED','2026-10-09 03:37:44.536219','Nhân viên đã cập nhật hướng xử lý: Tôi sẽ hoàn tiền cho ','AGENT',7),(7,'STATUS_CHANGED','2026-10-09 03:40:46.747535','Nhân viên đã cập nhật hướng xử lý: Tôi sẽ hoàn tiền cho ','AGENT',7),(8,'CUSTOMER_FEEDBACK','2026-10-09 04:01:34.606392','','CUSTOMER',7),(9,'CUSTOMER_FEEDBACK','2026-10-09 04:05:43.971143','Tôi chưa nhận được ','CUSTOMER',7),(10,'CUSTOMER_FEEDBACK','2026-10-09 04:07:31.479192','Tôi đã nhận ','CUSTOMER',7),(11,'REASSIGN_TICKET','2026-10-09 04:08:00.894272','Hệ thống đã phân công ticket cho Nhân viên ID:3 . Mức ưu tiên: URGENT','SYSTEM',7),(12,'STATUS_CHANGED','2026-10-09 04:09:11.455629','Nhân viên đã cập nhật hướng xử lý: Tôi sẽ hoàn tiền cho ','AGENT',7),(13,'CUSTOMER_FEEDBACK','2026-10-09 04:09:54.909702','tôi đã nhận được tiền. Cảm ơn bạn!','CUSTOMER',7),(14,'ASSIGN_TICKET','2026-10-09 14:28:55.533453','Hệ thống đã phân công ticket cho Nhân viên ID:2 . Mức ưu tiên: HIGH','SYSTEM',11),(15,'STATUS_CHANGED','2026-10-09 14:39:34.979349','Nhân viên đã cập nhật hướng xử lý: Toi se doi san pham moi cho ban','AGENT',11),(16,'CUSTOMER_FEEDBACK','2026-10-09 14:41:49.934962','Toi da nhan duoc san pham moi','CUSTOMER',11),(17,'CUSTOMER_FEEDBACK','2026-10-09 16:29:17.409904','tôi đã hài lòng ','CUSTOMER',11);
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_messages`
--

LOCK TABLES `ticket_messages` WRITE;
/*!40000 ALTER TABLE `ticket_messages` DISABLE KEYS */;
INSERT INTO `ticket_messages` VALUES (1,7,'CUSTOMER','11','Sản phẩm bị lỗi','2026-10-06 15:24:59'),(2,8,'CUSTOMER','12','lỗi trang web 404','2026-10-09 02:18:59'),(3,9,'CUSTOMER','13','Không đăng nhập được tài khoản','2026-10-09 02:22:53'),(4,10,'CUSTOMER','14','Không đăng nhập được tài khoản','2026-10-09 02:23:46'),(5,11,'CUSTOMER','15','San pham khong dung duoc','2026-10-09 14:28:37'),(6,12,'CUSTOMER','16','Không đăng nhập được ','2026-10-09 18:47:07');
/*!40000 ALTER TABLE `ticket_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_reports`
--

DROP TABLE IF EXISTS `ticket_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_reports` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `resolved_by` bigint DEFAULT NULL,
  `satisfaction` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `ticket_id` varchar(255) DEFAULT NULL,
  `closed_at` datetime(6) DEFAULT NULL,
  `handling_time_minutes` int DEFAULT NULL,
  `reopen_count` int DEFAULT NULL,
  `resolution` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_reports`
--

LOCK TABLES `ticket_reports` WRITE;
/*!40000 ALTER TABLE `ticket_reports` DISABLE KEYS */;
INSERT INTO `ticket_reports` VALUES (1,NULL,NULL,'SATISFIED',NULL,'TK-23F86851','2026-10-09 16:29:19.819190',120,0,'Toi se doi san pham moi cho ban');
/*!40000 ALTER TABLE `ticket_reports` ENABLE KEYS */;
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
  `resolution` text,
  `result` varchar(255) DEFAULT NULL,
  `satisfaction` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_code` (`ticket_code`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
INSERT INTO `tickets` VALUES (1,'TK-2CE840DE',1,'Hỗ trợ khách hàng: Nguyen Van B','NEW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,'TK-2E95E154',8,'Hỗ trợ khách hàng: Nguyen Phi Phuc','NEW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,'TK-B22CFAFC',9,'Hỗ trợ khách hàng: abc','NEW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,'TK-51526A47',1,'Hỗ trợ khách hàng: Nguyen Van B','NEW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,'TK-82780344',1,'Hỗ trợ khách hàng: abc','NEW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,'TK-3B53700D',10,'Hỗ trợ khách hàng: Nguyen Phúc Hoàng','NEW',NULL,NULL,'2026-10-06 15:16:35','2026-10-06 15:16:40',NULL,NULL,NULL,NULL,NULL,NULL),(7,'TK-F9EC552B',11,'Hỗ trợ khách hàng: Phúc Nguyễn','CLOSED','URGENT','COMPLAINT','2026-10-06 15:24:59','2026-10-09 04:09:59',3,NULL,'2026-10-08 23:07:55.000000','Tôi sẽ hoàn tiền cho ','RESOLVED','SATISFIED'),(8,'TK-56538733',12,'Hỗ trợ khách hàng: Nguyễn Phúc Phi ','NEW',NULL,'OTHER','2026-10-09 02:18:59','2026-10-09 02:19:04',NULL,NULL,NULL,NULL,NULL,NULL),(9,'TK-938E3219',13,'Hỗ trợ khách hàng: Nguyễn Phúc phi ','NEW',NULL,'PRODUCT_SUPPORT','2026-10-09 02:22:53','2026-10-09 02:22:56',NULL,NULL,NULL,NULL,NULL,NULL),(10,'TK-777920E5',14,'Hỗ trợ khách hàng: Nguyễn Phúc Phi ','ASSIGNED','MEDIUM','PRODUCT_SUPPORT','2026-10-09 02:23:46','2026-10-09 02:24:01',2,NULL,'2026-10-09 03:23:57.000000',NULL,NULL,NULL),(11,'TK-23F86851',15,'Abadsad','CLOSED','HIGH','PRODUCT_SUPPORT','2026-10-09 14:28:37','2026-10-09 16:29:20',2,NULL,'2026-10-09 09:28:51.000000','Toi se doi san pham moi cho ban','RESOLVED','SATISFIED'),(12,'TK-5EE94322',16,'Không đăng nhập được ','NEW',NULL,'PRODUCT_SUPPORT','2026-10-09 18:47:07','2026-10-09 18:47:12',NULL,NULL,NULL,NULL,NULL,NULL);
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

-- Dump completed on 2026-10-09 18:50:51
