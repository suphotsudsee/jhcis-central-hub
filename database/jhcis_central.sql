/*
 Navicat Premium Data Transfer

 Source Server         : localhost_xampp
 Source Server Type    : MySQL
 Source Server Version : 100432
 Source Host           : localhost:3306
 Source Schema         : jhcis_central

 Target Server Type    : MySQL
 Target Server Version : 100432
 File Encoding         : 65001

 Date: 23/03/2026 18:33:57
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for central_queries
-- ----------------------------
DROP TABLE IF EXISTS `central_queries`;
CREATE TABLE `central_queries`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `summary_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sql_text` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(0) NOT NULL DEFAULT current_timestamp(0),
  `updated_at` datetime(0) NOT NULL DEFAULT current_timestamp(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `summary_type`(`summary_type`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for health_facilities
-- ----------------------------
DROP TABLE IF EXISTS `health_facilities`;
CREATE TABLE `health_facilities`  (
  `hcode` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `facility_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `api_key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(0) NOT NULL DEFAULT current_timestamp(0),
  `updated_at` datetime(0) NOT NULL DEFAULT current_timestamp(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`hcode`) USING BTREE,
  UNIQUE INDEX `api_key`(`api_key`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for summary_financial
-- ----------------------------
DROP TABLE IF EXISTS `summary_financial`;
CREATE TABLE `summary_financial`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `hcode` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_date` date NOT NULL,
  `report_period` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime(0) NOT NULL DEFAULT current_timestamp(0),
  `updated_at` datetime(0) NOT NULL DEFAULT current_timestamp(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_summary_financial_hcode_date`(`hcode`, `report_date`) USING BTREE,
  INDEX `idx_summary_financial_hcode`(`hcode`) USING BTREE,
  INDEX `idx_summary_financial_report_date`(`report_date`) USING BTREE,
  INDEX `idx_summary_financial_summary_type`(`summary_type`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for summary_general
-- ----------------------------
DROP TABLE IF EXISTS `summary_general`;
CREATE TABLE `summary_general`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `hcode` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_date` date NOT NULL,
  `report_period` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime(0) NOT NULL DEFAULT current_timestamp(0),
  `updated_at` datetime(0) NOT NULL DEFAULT current_timestamp(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_summary_general_hcode_date`(`hcode`, `report_date`) USING BTREE,
  INDEX `idx_summary_general_hcode`(`hcode`) USING BTREE,
  INDEX `idx_summary_general_report_date`(`report_date`) USING BTREE,
  INDEX `idx_summary_general_summary_type`(`summary_type`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for summary_lab
-- ----------------------------
DROP TABLE IF EXISTS `summary_lab`;
CREATE TABLE `summary_lab`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `hcode` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_date` date NOT NULL,
  `report_period` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime(0) NOT NULL DEFAULT current_timestamp(0),
  `updated_at` datetime(0) NOT NULL DEFAULT current_timestamp(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_summary_lab_hcode_date`(`hcode`, `report_date`) USING BTREE,
  INDEX `idx_summary_lab_hcode`(`hcode`) USING BTREE,
  INDEX `idx_summary_lab_report_date`(`report_date`) USING BTREE,
  INDEX `idx_summary_lab_summary_type`(`summary_type`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for summary_op
-- ----------------------------
DROP TABLE IF EXISTS `summary_op`;
CREATE TABLE `summary_op`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `hcode` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_date` date NOT NULL,
  `report_period` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime(0) NOT NULL DEFAULT current_timestamp(0),
  `updated_at` datetime(0) NOT NULL DEFAULT current_timestamp(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_summary_op_hcode_date`(`hcode`, `report_date`) USING BTREE,
  INDEX `idx_summary_op_hcode`(`hcode`) USING BTREE,
  INDEX `idx_summary_op_report_date`(`report_date`) USING BTREE,
  INDEX `idx_summary_op_summary_type`(`summary_type`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for summary_person
-- ----------------------------
DROP TABLE IF EXISTS `summary_person`;
CREATE TABLE `summary_person`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `hcode` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_date` date NOT NULL,
  `report_period` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime(0) NOT NULL DEFAULT current_timestamp(0),
  `updated_at` datetime(0) NOT NULL DEFAULT current_timestamp(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_summary_person_hcode_date`(`hcode`, `report_date`) USING BTREE,
  INDEX `idx_summary_person_hcode`(`hcode`) USING BTREE,
  INDEX `idx_summary_person_report_date`(`report_date`) USING BTREE,
  INDEX `idx_summary_person_summary_type`(`summary_type`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for summary_pharmacy
-- ----------------------------
DROP TABLE IF EXISTS `summary_pharmacy`;
CREATE TABLE `summary_pharmacy`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `hcode` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_date` date NOT NULL,
  `report_period` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime(0) NOT NULL DEFAULT current_timestamp(0),
  `updated_at` datetime(0) NOT NULL DEFAULT current_timestamp(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_summary_pharmacy_hcode_date`(`hcode`, `report_date`) USING BTREE,
  INDEX `idx_summary_pharmacy_hcode`(`hcode`) USING BTREE,
  INDEX `idx_summary_pharmacy_report_date`(`report_date`) USING BTREE,
  INDEX `idx_summary_pharmacy_summary_type`(`summary_type`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for summary_pp
-- ----------------------------
DROP TABLE IF EXISTS `summary_pp`;
CREATE TABLE `summary_pp`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `hcode` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_date` date NOT NULL,
  `report_period` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime(0) NOT NULL DEFAULT current_timestamp(0),
  `updated_at` datetime(0) NOT NULL DEFAULT current_timestamp(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_summary_pp_hcode_date`(`hcode`, `report_date`) USING BTREE,
  INDEX `idx_summary_pp_hcode`(`hcode`) USING BTREE,
  INDEX `idx_summary_pp_report_date`(`report_date`) USING BTREE,
  INDEX `idx_summary_pp_summary_type`(`summary_type`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for summary_resource
-- ----------------------------
DROP TABLE IF EXISTS `summary_resource`;
CREATE TABLE `summary_resource`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `hcode` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_date` date NOT NULL,
  `report_period` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime(0) NOT NULL DEFAULT current_timestamp(0),
  `updated_at` datetime(0) NOT NULL DEFAULT current_timestamp(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_summary_resource_hcode_date`(`hcode`, `report_date`) USING BTREE,
  INDEX `idx_summary_resource_hcode`(`hcode`) USING BTREE,
  INDEX `idx_summary_resource_report_date`(`report_date`) USING BTREE,
  INDEX `idx_summary_resource_summary_type`(`summary_type`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
