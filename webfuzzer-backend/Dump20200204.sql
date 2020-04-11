CREATE DATABASE  IF NOT EXISTS `webfuzzer` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `webfuzzer`;
-- MySQL dump 10.13  Distrib 5.7.29, for Linux (x86_64)
--
-- Host: localhost    Database: webfuzzer
-- ------------------------------------------------------
-- Server version	5.7.29-0ubuntu0.18.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Endpoint`
--

DROP TABLE IF EXISTS `Endpoint`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Endpoint` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Url` varchar(150) DEFAULT NULL,
  `BaseRequest` text,
  `Hash` varchar(65) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Endpoint`
--

LOCK TABLES `Endpoint` WRITE;
/*!40000 ALTER TABLE `Endpoint` DISABLE KEYS */;
INSERT INTO `Endpoint` VALUES (11,'http://testphp.vulnweb.com:80/search.php?test=query','{\n  \"url\": \"http://testphp.vulnweb.com:80/search.php?test=query\",\n  \"cookies\": \"\",\n  \"headers\": {\n    \"User-Agent\": \"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:72.0) Gecko/20100101 Firefox/72.0\",\n    \"Accept\": \"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8\",\n    \"Accept-Language\": \"en-US,en;q=0.5\",\n    \"Accept-Encoding\": \"gzip, deflate\",\n    \"Content-Type\": \"application/x-www-form-urlencoded\",\n    \"Origin\": \"http://testphp.vulnweb.com\",\n    \"DNT\": \"1\",\n    \"Connection\": \"close\",\n    \"Referer\": \"http://testphp.vulnweb.com\",\n    \"Upgrade-Insecure-Requests\": \"1\"\n  },\n  \"data\": {\n    \"searchFor\": \"\\xa7a\\xa7\",\n    \"goButton\": \"go\"\n  },\n  \"method\": \"post\"\n}','f46aeadda1b8d33378debf0e4b1fd7b785c3a57cf071afb5eb009ac8f07b8da8'),(13,'http://testphp.vulnweb.com:80/search.php?test=query','{\n  \"url\": \"http://testphp.vulnweb.com:80/search.php?test=query\",\n  \"cookies\": \"\",\n  \"headers\": {\n    \"User-Agent\": \"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:72.0) Gecko/20100101 Firefox/72.0\",\n    \"Accept\": \"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8\",\n    \"Accept-Language\": \"en-US,en;q=0.5\",\n    \"Accept-Encoding\": \"gzip, deflate\",\n    \"Content-Type\": \"application/x-www-form-urlencoded\",\n    \"Origin\": \"http://testphp.vulnweb.com\",\n    \"DNT\": \"1\",\n    \"Connection\": \"close\",\n    \"Referer\": \"http://testphp.vulnweb.com/search.php?test=query\",\n    \"Upgrade-Insecure-Requests\": \"1\"\n  },\n  \"data\": {\n    \"searchFor\": \"\\xa7a\\xa7\",\n    \"goButton\": \"go\"\n  },\n  \"method\": \"post\"\n}','40532f89a3cc03dafe45d042d8c453b5bac5cec041e337ce2a8c2a6d1536a12d'),(17,'http://testphp.vulnweb.com:80/showimage.php?file=./pictures/1.jpg','{\n  \"url\": \"http://testphp.vulnweb.com:80/showimage.php?file=\\xa7./pictures/1.jpg\\xa7\",\n  \"cookies\": \"\",\n  \"headers\": {\n    \"User-Agent\": \"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:72.0) Gecko/20100101 Firefox/72.0\",\n    \"Accept\": \"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8\",\n    \"Accept-Language\": \"en-US,en;q=0.5\",\n    \"Accept-Encoding\": \"gzip, deflate\",\n    \"DNT\": \"1\",\n    \"Connection\": \"close\",\n    \"Upgrade-Insecure-Requests\": \"1\"\n  },\n  \"method\": \"get\"\n}','ac267f401e4a01ebae8e1e3b193908d89f7d01c0c26378dd78dac8553bf64497');
/*!40000 ALTER TABLE `Endpoint` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Request`
--

DROP TABLE IF EXISTS `Request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Request` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `IdEndpoint` int(11) DEFAULT NULL,
  `Timestamp` timestamp NULL DEFAULT NULL,
  `VulnTypes` varchar(50) DEFAULT NULL,
  `Strategy` varchar(13) DEFAULT NULL,
  `Config` text DEFAULT NULL,
  `Status` enum('Submitted','Queued','Processing','Completed') NOT NULL DEFAULT 'Submitted',
  `IdResult` int(11) DEFAULT NULL,
  `Note` text,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Request`
--

LOCK TABLES `Request` WRITE;
/*!40000 ALTER TABLE `Request` DISABLE KEYS */;
INSERT INTO `Request` VALUES (9,11,'2020-01-21 08:02:32','{\n  \"vulnTypes\": [\n    \"0\", \"1\"\n  ]\n}','sniper','{\n  \"0\": {\n    \"label\": \"XSS\",\n    \"payloadFile\": \"xss/xss-polyglots.txt\",\n    \"match\": [\n      \"y4t0g4m1\",\n      \"XSS\"\n    ],\n    \"time\": 5\n  },\n  \"1\":{ \n    \"label\":\"LFI\",\n    \"payloadFile\":\"lfi/lfi-full.txt\",\n    \"match\":[ \n      \"root:x:\"\n    ],\n    \"time\":\"\"\n  }\n}','Submitted',NULL,NULL),(10,17,'2020-02-03 08:22:15','{\n  \"vulnTypes\": [\n    \"1\"\n  ]\n}','sniper','{\n  \"1\": {\n    \"label\": \"LFI\",\n    \"payloadFile\": \"lfi/lfi-full.txt\",\n    \"match\": [\n      \"root:x:\"\n    ],\n    \"time\": \"\"\n  }\n}','Completed',8,NULL);
/*!40000 ALTER TABLE `Request` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Result`
--

DROP TABLE IF EXISTS `Result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Result` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Result` text,
  `Timestamp` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Result`
--

LOCK TABLES `Result` WRITE;
/*!40000 ALTER TABLE `Result` DISABLE KEYS */;
INSERT INTO `Result` VALUES (8,'{\n  \"1\": [\n    \"../..//etc/passwd\",\n    \"..%2f..%2f/etc/passwd\",\n    \"%2e%2e/%2e%2e//etc/passwd\",\n    \"%2e%2e%2f%2e%2e%2f/etc/passwd\"\n  ]\n}','2020-02-03 19:20:56');
/*!40000 ALTER TABLE `Result` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-02-04  3:38:35
