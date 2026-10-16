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
                            `name` varchar(255) NOT NULL,
                            `email` varchar(255) NOT NULL,
                            `password` varchar(255) NOT NULL,
                            `role` enum('CUSTOMER','STAFF','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
                            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            PRIMARY KEY (`id`),
                            UNIQUE KEY `uk_accounts_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts`
--

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
INSERT INTO `accounts` VALUES (1,'Nguyn Vn A','customer1@gmail.com','123456','CUSTOMER','2026-10-16 10:06:40'),(2,'Nhn vin 1','staff1@vku.edu.vn','123456','STAFF','2026-10-16 10:06:40'),(3,'Nhn vin 2','staff2@vku.edu.vn','123456','STAFF','2026-10-16 10:06:40'),(4,'Nguyễn Hoàng Phúc','testchatbox@gmail.com','123456','CUSTOMER','2026-10-16 10:55:01');
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
                          `department` enum('CSKH','KY_THUAT') NOT NULL DEFAULT 'CSKH',
                          `status` enum('AVAILABLE','BUSY','OFFLINE') NOT NULL DEFAULT 'AVAILABLE',
                          PRIMARY KEY (`id`),
                          UNIQUE KEY `uk_agents_account_id` (`account_id`),
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
INSERT INTO `chat_conversations` VALUES ('CHAT-101968','2026-10-16 10:55:02.003549',4,'WAITING_AGENT',NULL),('CHAT-526841','2026-10-09 18:28:46.869290',4,'OPEN',NULL),('CHAT-557075','2026-10-09 18:29:17.089130',1,'OPEN',NULL),('CHAT-620484','2026-10-09 17:57:00.508486',1,'WAITING_AGENT',NULL),('CHAT-827970','2026-10-16 13:03:47.985880',4,'OPEN',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES (1,'CHAT-620484','2026-10-09 17:57:06.964833','hi','CUSTOMER'),(2,'CHAT-620484','2026-10-09 17:57:37.577652','hi','CUSTOMER'),(3,'CHAT-620484','2026-10-09 17:59:21.305911','hi','CUSTOMER'),(4,'CHAT-620484','2026-10-09 18:02:28.379977','hi','CUSTOMER'),(5,'CHAT-620484','2026-10-09 18:02:30.814151','Chào bạn, tôi là trợ lý AI của VKU Support. Tôi có thể giúp gì cho bạn?','AI'),(6,'CHAT-620484','2026-10-09 18:03:00.706933','sản phẩm của tôi bị lỗi','CUSTOMER'),(7,'CHAT-620484','2026-10-09 18:03:58.515064','sản phẩm của tôi bị lỗi','CUSTOMER'),(8,'CHAT-620484','2026-10-09 18:04:06.135129','Tôi rất tiếc khi biết sản phẩm của bạn đang gặp lỗi. Đây là một vấn đề cần được bộ phận hỗ trợ kỹ thuật kiểm tra trực tiếp. Tôi sẽ chuyển thông tin của bạn đến nhân viên hỗ trợ để họ liên hệ với bạn sớm nhất có thể và giúp bạn giải quyết vấn đề này.','AI'),(9,'CHAT-620484','2026-10-09 18:06:25.100414','chào bạn','AGENT'),(10,'CHAT-620484','2026-10-09 18:06:35.443670','sản phẩm của tôi bị lỗi','CUSTOMER'),(11,'CHAT-557075','2026-10-09 18:48:49.303091','hii','CUSTOMER'),(12,'CHAT-101968','2026-10-16 11:54:24.242222','hello, bạn là ai','CUSTOMER'),(13,'CHAT-101968','2026-10-16 11:54:26.338221','Chào bạn, tôi là trợ lý AI chăm sóc khách hàng của VKU Support. Tôi ở đây để giúp bạn giải đáp các thắc mắc và cung cấp thông tin liên quan đến các dịch vụ của chúng tôi.','AI'),(14,'CHAT-101968','2026-10-16 11:54:48.442640','chính sách của bên mình là gì nhỉ','CUSTOMER'),(15,'CHAT-101968','2026-10-16 11:56:23.949222','chính sách của bên mình là gì nhỉ','CUSTOMER'),(16,'CHAT-101968','2026-10-16 11:56:31.331457','Chào bạn, VKU Support có các chính sách sau:\n\n**1. Thời gian làm việc và kênh hỗ trợ:**\n*   **Thời gian làm việc:** Từ 08:00 đến 17:30 (Thứ 2 đến Thứ 6), Thứ 7 làm việc từ 08:00 đến 12:00. Nghỉ Chủ Nhật và các ngày lễ Tết.\n*   **Kênh tiếp nhận hỗ trợ:** Website Support (/support/new), Email: support@vku.edu.vn, Hotline: 1900-xxxx.\n\n**2. Chính sách đổi trả và hoàn tiền:**\n*   **Điều kiện đổi trả:** Sản phẩm hoặc dịch vụ phát sinh lỗi kỹ thuật từ nhà cung cấp trong vòng 7 ngày kể từ khi nhận.\n*   **Yêu cầu sản phẩm:** Còn nguyên tem mác, nguyên vỏ hộp và đầy đủ phụ kiện đi kèm.\n*   **Thời gian xử lý hoàn tiền:** Từ 24h đến 48h làm việc sau khi Ticket yêu cầu hoàn tiền được xác minh thành công.\n\n**3. Quy trình xử lý Ticket và SLA:**\n*   **Mức độ ưu tiên LOW / MEDIUM:** Thời gian phản hồi tối đa là 4 giờ làm việc.\n*   **Mức độ ưu tiên HIGH / URGENT:** Thời gian phản hồi khẩn cấp trong vòng 1 giờ làm việc.\n*   **Quy trình Mở lại Ticket (Reopen):** Khi nhận email kết quả xử lý, nếu chưa hài lòng có thể gửi phản hồi trực tiếp qua link feedback. Hệ thống sẽ tự động kích hoạt chuyển trạng thái Ticket thành REOPENED để nhân viên hỗ trợ tiếp.\n\n**4. Trạng thái Ticket hệ thống:**\n*   **NEW:** Ticket mới tạo, chờ gán nhân viên.\n*   **IN_PROGRESS / ASSIGNED:** Nhân viên đang tiếp nhận và xử lý.\n*   **RESOLVED:** Đã xử lý xong, hệ thống gửi email AI phản hồi cho khách.\n*   **CLOSED:** Khách hàng xác nhận hài lòng và đóng ticket.','AI'),(17,'CHAT-101968','2026-10-16 11:57:05.047712','tôi muốn gặp nhân viên nói chuyện','CUSTOMER'),(18,'CHAT-101968','2026-10-16 11:57:06.866730','Yêu cầu của bạn đã được ghi nhận. Tôi sẽ chuyển tiếp cuộc trò chuyện của bạn tới nhân viên hỗ trợ của VKU Support ngay lập tức. Xin vui lòng đợi trong giây lát.','AI'),(19,'CHAT-101968','2026-10-16 11:57:27.725017','chào bạn, bạn cần hổ trợ gì ạ','AGENT'),(20,'CHAT-101968','2026-10-16 11:57:52.596245','à không có gì','CUSTOMER');
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
                             `account_id` bigint DEFAULT NULL,
                             `name` varchar(255) DEFAULT NULL,
                             `email` varchar(255) DEFAULT NULL,
                             `phone` varchar(255) DEFAULT NULL,
                             `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             PRIMARY KEY (`id`),
                             UNIQUE KEY `uk_customers_account_id` (`account_id`),
                             CONSTRAINT `fk_customers_accounts` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,1,'Nguyn Hong Phc','customer1@gmail.com','0905123456','2026-10-16 10:06:51'),(2,NULL,'Khch Vng Lai Chatbot','guest@gmail.com','0912000111','2026-10-16 10:06:51'),(3,4,'Nguyễn Hoàng Phúc','testchatbox@gmail.com','09031232131 ','2026-10-16 10:55:01');
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
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_logs`
--

LOCK TABLES `ticket_logs` WRITE;
/*!40000 ALTER TABLE `ticket_logs` DISABLE KEYS */;
INSERT INTO `ticket_logs` VALUES (1,'AUTOMATION_PROCESS_COMPLETED','2026-10-06 17:14:52.932818','Đã tự động phân loại: COMPLAINT, độ ưu tiên: HIGH, gán cho Agent Nguyen Van A (ID: 1)','N8N_WORKFLOW',7),(2,'CUSTOMER_FEEDBACK','2026-10-08 16:03:58.737424','Tôi vẫn chưa nhận được sản phẩm mới.','CUSTOMER',7),(3,'REASSIGN_TICKET','2026-10-08 17:33:36.053834','Hệ thống đã phân công ticket cho Nhân viên ID:1 . Mức ưu tiên: URGENT','SYSTEM',7),(4,'CUSTOMER_FEEDBACK','2026-10-08 17:37:34.707785','Tôi vẫn chưa nhận được sản phẩm mới.','CUSTOMER',7),(5,'ASSIGN_TICKET','2026-10-09 02:24:01.256006','Hệ thống đã phân công ticket cho Nhân viên ID:2 . Mức ưu tiên: MEDIUM','SYSTEM',10),(6,'STATUS_CHANGED','2026-10-09 03:37:44.536219','Nhân viên đã cập nhật hướng xử lý: Tôi sẽ hoàn tiền cho ','AGENT',7),(7,'STATUS_CHANGED','2026-10-09 03:40:46.747535','Nhân viên đã cập nhật hướng xử lý: Tôi sẽ hoàn tiền cho ','AGENT',7),(8,'CUSTOMER_FEEDBACK','2026-10-09 04:01:34.606392','','CUSTOMER',7),(9,'CUSTOMER_FEEDBACK','2026-10-09 04:05:43.971143','Tôi chưa nhận được ','CUSTOMER',7),(10,'CUSTOMER_FEEDBACK','2026-10-09 04:07:31.479192','Tôi đã nhận ','CUSTOMER',7),(11,'REASSIGN_TICKET','2026-10-09 04:08:00.894272','Hệ thống đã phân công ticket cho Nhân viên ID:3 . Mức ưu tiên: URGENT','SYSTEM',7),(12,'STATUS_CHANGED','2026-10-09 04:09:11.455629','Nhân viên đã cập nhật hướng xử lý: Tôi sẽ hoàn tiền cho ','AGENT',7),(13,'CUSTOMER_FEEDBACK','2026-10-09 04:09:54.909702','tôi đã nhận được tiền. Cảm ơn bạn!','CUSTOMER',7),(14,'ASSIGN_TICKET','2026-10-09 14:28:55.533453','Hệ thống đã phân công ticket cho Nhân viên ID:2 . Mức ưu tiên: HIGH','SYSTEM',11),(15,'STATUS_CHANGED','2026-10-09 14:39:34.979349','Nhân viên đã cập nhật hướng xử lý: Toi se doi san pham moi cho ban','AGENT',11),(16,'CUSTOMER_FEEDBACK','2026-10-09 14:41:49.934962','Toi da nhan duoc san pham moi','CUSTOMER',11),(17,'CUSTOMER_FEEDBACK','2026-10-09 16:29:17.409904','tôi đã hài lòng ','CUSTOMER',11),(18,'ASSIGN_TICKET','2026-10-16 11:23:50.858890','Hệ thống đã phân công ticket cho Nhân viên ID:2 . Mức ưu tiên: HIGH','SYSTEM',14),(19,'STATUS_CHANGED','2026-10-16 11:40:29.326056','Nhân viên đã cập nhật hướng xử lý: Kính gửi quý khách,\n\nYêu cầu của bạn đã được cập nhật và xử lý thành công theo đúng chính sách của hệ thống.\n\nTrân trọng,\nĐội ngũ CSKH VKU Support Center.','AGENT',14),(20,'CUSTOMER_FEEDBACK','2026-10-16 11:42:41.629492','Tôi vẫn chưa đăng nhập được, bạn hãy kiểm tra lại ','CUSTOMER',14),(21,'REASSIGN_TICKET','2026-10-16 11:42:55.319695','Hệ thống đã phân công ticket cho Nhân viên ID:2 . Mức ưu tiên: URGENT','SYSTEM',14),(22,'STATUS_CHANGED','2026-10-16 11:44:10.339225','Nhân viên đã cập nhật hướng xử lý: Kính gửi quý khách,\nGhi chú xử lý từ nhân viên: \"Đã kiểm tra và xử lý xong sự cố cho khách hàng\".\nTrân trọng,\nĐội ngũ CSKH VKU Support Center.','AGENT',14),(23,'CUSTOMER_FEEDBACK','2026-10-16 11:45:10.923677','Đã đăng nhập được','CUSTOMER',14),(24,'ASSIGN_TICKET','2026-10-16 13:05:57.039282','Hệ thống đã phân công ticket cho Nhân viên ID:2 . Mức ưu tiên: HIGH','SYSTEM',15);
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_messages`
--

LOCK TABLES `ticket_messages` WRITE;
/*!40000 ALTER TABLE `ticket_messages` DISABLE KEYS */;
INSERT INTO `ticket_messages` VALUES (1,7,'CUSTOMER','11','Sản phẩm bị lỗi','2026-10-06 15:24:59'),(2,8,'CUSTOMER','12','lỗi trang web 404','2026-10-09 02:18:59'),(3,9,'CUSTOMER','13','Không đăng nhập được tài khoản','2026-10-09 02:22:53'),(4,10,'CUSTOMER','14','Không đăng nhập được tài khoản','2026-10-09 02:23:46'),(5,11,'CUSTOMER','15','San pham khong dung duoc','2026-10-09 14:28:37'),(6,12,'CUSTOMER','16','Không đăng nhập được ','2026-10-09 18:47:07'),(8,14,'CUSTOMER','3','Không thể đăng nhập ','2026-10-16 11:10:27'),(9,15,'CUSTOMER','3','he thong khong an toan ','2026-10-16 13:05:43');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_reports`
--

LOCK TABLES `ticket_reports` WRITE;
/*!40000 ALTER TABLE `ticket_reports` DISABLE KEYS */;
INSERT INTO `ticket_reports` VALUES (1,NULL,NULL,'SATISFIED',NULL,'TK-23F86851','2026-10-09 16:29:19.819190',120,0,'Toi se doi san pham moi cho ban'),(2,NULL,NULL,'SATISFIED',NULL,'TK-571B31D2','2026-10-16 11:45:13.665084',34,0,'Kính gửi quý khách,\nGhi chú xử lý từ nhân viên: \"Đã kiểm tra và xử lý xong sự cố cho khách hàng\".\nTrân trọng,\nĐội ngũ CSKH VKU Support Center.');
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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
INSERT INTO `tickets` VALUES (1,'TK-2CE840DE',1,'Hỗ trợ khách hàng: Nguyen Van B','NEW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,'TK-2E95E154',8,'Hỗ trợ khách hàng: Nguyen Phi Phuc','NEW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,'TK-B22CFAFC',9,'Hỗ trợ khách hàng: abc','NEW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,'TK-51526A47',1,'Hỗ trợ khách hàng: Nguyen Van B','NEW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,'TK-82780344',1,'Hỗ trợ khách hàng: abc','NEW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,'TK-3B53700D',10,'Hỗ trợ khách hàng: Nguyen Phúc Hoàng','NEW',NULL,NULL,'2026-10-06 15:16:35','2026-10-06 15:16:40',NULL,NULL,NULL,NULL,NULL,NULL),(7,'TK-F9EC552B',11,'Hỗ trợ khách hàng: Phúc Nguyễn','CLOSED','URGENT','COMPLAINT','2026-10-06 15:24:59','2026-10-09 04:09:59',3,NULL,'2026-10-08 23:07:55.000000','Tôi sẽ hoàn tiền cho ','RESOLVED','SATISFIED'),(8,'TK-56538733',12,'Hỗ trợ khách hàng: Nguyễn Phúc Phi ','NEW',NULL,'OTHER','2026-10-09 02:18:59','2026-10-09 02:19:04',NULL,NULL,NULL,NULL,NULL,NULL),(9,'TK-938E3219',13,'Hỗ trợ khách hàng: Nguyễn Phúc phi ','NEW',NULL,'PRODUCT_SUPPORT','2026-10-09 02:22:53','2026-10-09 02:22:56',NULL,NULL,NULL,NULL,NULL,NULL),(10,'TK-777920E5',14,'Hỗ trợ khách hàng: Nguyễn Phúc Phi ','ASSIGNED','MEDIUM','PRODUCT_SUPPORT','2026-10-09 02:23:46','2026-10-09 02:24:01',2,NULL,'2026-10-09 03:23:57.000000',NULL,NULL,NULL),(11,'TK-23F86851',15,'Abadsad','CLOSED','HIGH','PRODUCT_SUPPORT','2026-10-09 14:28:37','2026-10-09 16:29:20',2,NULL,'2026-10-09 09:28:51.000000','Toi se doi san pham moi cho ban','RESOLVED','SATISFIED'),(12,'TK-5EE94322',16,'Không đăng nhập được ','NEW',NULL,'PRODUCT_SUPPORT','2026-10-09 18:47:07','2026-10-09 18:47:12',NULL,NULL,NULL,NULL,NULL,NULL),(14,'TK-571B31D2',3,'Lỗi','CLOSED','URGENT','PRODUCT_SUPPORT','2026-10-16 11:10:27','2026-10-16 11:45:14',2,NULL,'2026-10-16 06:42:52.000000','Kính gửi quý khách,\nGhi chú xử lý từ nhân viên: \"Đã kiểm tra và xử lý xong sự cố cho khách hàng\".\nTrân trọng,\nĐội ngũ CSKH VKU Support Center.','RESOLVED','SATISFIED'),(15,'TK-850BF286',3,'abc','ASSIGNED','HIGH','PRODUCT_SUPPORT','2026-10-16 13:05:43','2026-10-16 13:05:57',2,NULL,'2026-10-16 15:05:52.000000',NULL,NULL,NULL);
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

-- Dump completed on 2026-10-16 13:15:15
