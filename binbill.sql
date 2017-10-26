-- phpMyAdmin SQL Dump
-- version 4.5.4.1deb2ubuntu2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Aug 19, 2017 at 12:32 PM
-- Server version: 5.7.19-0ubuntu0.16.04.1
-- PHP Version: 7.0.22-0ubuntu0.16.04.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `binbill`
--

-- --------------------------------------------------------

--
-- Table structure for table `table_authorized_service_center`
--

CREATE TABLE IF NOT EXISTS `table_authorized_service_center` (
  `center_id` int(11) NOT NULL AUTO_INCREMENT,
  `brand_id` int(11) NOT NULL,
  `center_name` varchar(200) NOT NULL,
  `address_house_no` varchar(100) NOT NULL,
  `address_block` varchar(100) NOT NULL,
  `address_street` varchar(100) NOT NULL,
  `address_sector` varchar(100) NOT NULL,
  `address_city` varchar(100) NOT NULL,
  `address_state` varchar(100) NOT NULL,
  `address_pin_code` int(11) NOT NULL,
  `address_nearby` varchar(200) NOT NULL,
  `latitude` varchar(255) NOT NULL,
  `longitude` varchar(255) NOT NULL,
  `open_days` varchar(255) NOT NULL,
  `timings` varchar(255) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`center_id`),
  KEY `brand_id` (`brand_id`,`status_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_authorized_service_center`
--

INSERT INTO `table_authorized_service_center` (`center_id`, `brand_id`, `center_name`, `address_house_no`, `address_block`, `address_street`, `address_sector`, `address_city`, `address_state`, `address_pin_code`, `address_nearby`, `latitude`, `longitude`, `open_days`, `timings`, `status_id`) VALUES
(1, 1, 'Testingxzvdsv111', '', 'Test1', '', '', 'South Delhi', 'Delhi', 110062, 'Test1', '', '', 'Test1', 'undefined', 3),
(2, 2, 'Testing123', '', 'Test1', '', '', 'South Delhi', 'Delhi', 110062, 'Test1', '', '', 'Test1', 'undefined', 1),
(3, 3, 'new service center123', '', '', '', '', 'Delhi', 'Haryana', 0, '', '', '', '24 hours', 'undefined', 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_authorized_service_center_details`
--

CREATE TABLE IF NOT EXISTS `table_authorized_service_center_details` (
  `center_detail_id` int(11) NOT NULL AUTO_INCREMENT,
  `center_id` int(11) NOT NULL,
  `contactdetail_type_id` int(11) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `details` varchar(100) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`center_detail_id`),
  KEY `center_id` (`center_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `table_authorized_service_center_details`
--

INSERT INTO `table_authorized_service_center_details` (`center_detail_id`, `center_id`, `contactdetail_type_id`, `display_name`, `details`, `status_id`) VALUES
(1, 1, 1, 'Suport', '3333', 3),
(2, 1, 1, 'Suport', '3333', 3),
(3, 2, 1, 'Suport', '2222222', 1),
(4, 3, 0, '', '', 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_brands`
--

CREATE TABLE IF NOT EXISTS `table_brands` (
  `brand_id` int(11) NOT NULL AUTO_INCREMENT,
  `brand_name` varchar(200) NOT NULL,
  `brand_description` text NOT NULL,
  `created_on` datetime NOT NULL,
  `updated_on` datetime NOT NULL,
  `updated_by_user_id` int(11) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`brand_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=6 ;

--
-- Dumping data for table `table_brands`
--

INSERT INTO `table_brands` (`brand_id`, `brand_name`, `brand_description`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 'Test', '', '2017-08-03 14:57:35', '2017-08-03 16:17:30', 1, 1),
(2, 'Testdsf', '', '2017-08-03 14:57:42', '2017-08-03 17:40:20', 1, 3),
(3, 'Test2', 'sdfsf', '2017-08-03 15:10:25', '2017-08-03 17:40:39', 1, 3),
(4, 'Test3', 'sdfsf', '2017-08-03 15:10:53', '2017-08-03 15:10:53', 1, 1),
(5, 'sss', '', '2017-08-14 16:45:29', '2017-08-18 13:13:29', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_brand_details`
--

CREATE TABLE IF NOT EXISTS `table_brand_details` (
  `brand_detail_id` int(11) NOT NULL AUTO_INCREMENT,
  `brand_id` int(11) NOT NULL,
  `contactdetails_type_id` int(11) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `details` varchar(255) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`brand_detail_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=7 ;

--
-- Dumping data for table `table_brand_details`
--

INSERT INTO `table_brand_details` (`brand_detail_id`, `brand_id`, `contactdetails_type_id`, `display_name`, `details`, `status_id`) VALUES
(1, 1, 1, 'Suport', 'fsdfsdf', 3),
(2, 2, 3, 'Suport', '3333', 1),
(3, 2, 2, 'Suport', 'dfdf', 3),
(4, 2, 1, 'Suport', 'fsdfsdf', 1),
(5, 5, 1, 'zsdzx', 'sszcszd', 1),
(6, 5, 1, 'xxx', 'xxx', 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_categories`
--

CREATE TABLE IF NOT EXISTS `table_categories` (
  `category_id` int(11) NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `display_id` int(11) DEFAULT NULL,
  `ref_id` int(11) DEFAULT NULL,
  `category_level` int(11) NOT NULL,
  `created_on` datetime NOT NULL,
  `updated_on` datetime NOT NULL,
  `updated_by_user_id` int(11) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=41 ;

--
-- Dumping data for table `table_categories`
--

INSERT INTO `table_categories` (`category_id`, `category_name`, `display_id`, `ref_id`, `category_level`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 'Test4', NULL, 0, 1, '2017-08-01 18:52:43', '2017-08-02 18:18:54', 1, 1),
(2, 'Test1', NULL, 0, 1, '2017-08-01 18:58:03', '2017-08-01 18:58:03', 1, 1),
(3, 'Test2', NULL, 0, 1, '2017-08-01 18:59:28', '2017-08-01 18:59:28', 1, 1),
(4, 'Test', NULL, 1, 2, '2017-08-01 18:59:53', '2017-08-02 18:18:54', 1, 1),
(5, 'Test5', NULL, 0, 1, '2017-08-01 19:01:43', '2017-08-08 11:29:21', 1, 3),
(6, 'Test5', NULL, 1, 2, '2017-08-01 19:01:54', '2017-08-02 18:18:54', 1, 3),
(7, 'Test6', NULL, 1, 2, '2017-08-01 19:03:56', '2017-08-02 18:18:54', 1, 3),
(8, 'Test6', NULL, 4, 3, '2017-08-02 18:02:37', '2017-08-02 18:18:54', 1, 1),
(9, 'New', NULL, 0, 1, '2017-08-08 11:15:55', '2017-08-08 11:16:49', 1, 3),
(10, 'new', NULL, 0, 1, '2017-08-08 11:17:25', '2017-08-08 11:17:31', 1, 3),
(11, 'Electronics', NULL, 0, 1, '2017-08-08 11:20:51', '2017-08-18 13:15:53', 1, 1),
(12, 'new cat', NULL, 0, 2, '2017-08-08 11:29:04', '2017-08-08 11:29:04', 1, 1),
(13, 'go', NULL, 0, 2, '2017-08-08 11:32:15', '2017-08-08 11:32:15', 1, 1),
(14, 'osdsad', NULL, 0, 2, '2017-08-08 11:34:25', '2017-08-08 11:34:25', 1, 1),
(15, 'new cat ', NULL, 11, 2, '2017-08-08 11:36:09', '2017-08-18 13:23:25', 1, 3),
(16, 'new 2', NULL, 11, 2, '2017-08-08 11:36:40', '2017-08-18 13:23:22', 1, 3),
(17, 'abc11', NULL, 11, 2, '2017-08-08 11:37:15', '2017-08-08 11:38:06', 1, 3),
(18, 'abc2', NULL, 2, 2, '2017-08-08 11:37:24', '2017-08-08 11:37:24', 1, 1),
(19, 'new sub cat', NULL, 15, 3, '2017-08-08 13:13:37', '2017-08-18 13:23:25', 1, 3),
(20, 'new cat 222', NULL, 15, 3, '2017-08-08 13:15:35', '2017-08-18 13:23:25', 1, 3),
(21, 'new subs', NULL, 15, 3, '2017-08-08 13:17:43', '2017-08-18 13:23:25', 1, 3),
(22, 'abc3', NULL, 2, 2, '2017-08-08 13:19:30', '2017-08-08 13:19:35', 1, 3),
(23, 'test2 subcat', NULL, 3, 2, '2017-08-08 13:23:20', '2017-08-08 13:23:20', 1, 1),
(24, 'test 2 sub cat ', NULL, 23, 3, '2017-08-08 13:23:38', '2017-08-08 13:23:38', 1, 1),
(25, 'asdsad', NULL, 0, 1, '2017-08-08 18:37:43', '2017-08-08 18:43:17', 1, 3),
(26, 'asdasd', NULL, 11, 2, '2017-08-08 18:37:56', '2017-08-08 18:43:23', 1, 3),
(27, 'asdas', NULL, 16, 3, '2017-08-08 18:38:12', '2017-08-18 13:23:22', 1, 3),
(38, 'FormCat', NULL, 1, 2, '2017-08-14 18:49:24', '2017-08-18 11:58:08', 1, 1),
(39, 'Cars', NULL, 11, 2, '2017-08-18 13:02:00', '2017-08-18 13:06:41', 1, 3),
(40, 'Phone', NULL, 11, 2, '2017-08-18 13:08:07', '2017-08-18 13:08:07', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_category_form`
--

CREATE TABLE IF NOT EXISTS `table_category_form` (
  `category_form_id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `form_element_name` varchar(200) NOT NULL,
  `form_element_type` int(11) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`category_form_id`),
  KEY `category_id` (`category_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=8 ;

--
-- Dumping data for table `table_category_form`
--

INSERT INTO `table_category_form` (`category_form_id`, `category_id`, `form_element_name`, `form_element_type`, `status_id`) VALUES
(1, 38, 'Text', 1, 1),
(2, 38, 'Dropdown', 2, 1),
(3, 38, 'Type', 2, 1),
(4, 39, 'Color', 1, 1),
(5, 39, 'Speed', 2, 1),
(6, 40, 'IMEI ', 1, 1),
(7, 40, 'OS type', 2, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_category_form_mapping`
--

CREATE TABLE IF NOT EXISTS `table_category_form_mapping` (
  `mapping_id` int(11) NOT NULL AUTO_INCREMENT,
  `category_form_id` int(11) NOT NULL,
  `dropdown_name` varchar(200) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`mapping_id`),
  KEY `category_form_id` (`category_form_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=9 ;

--
-- Dumping data for table `table_category_form_mapping`
--

INSERT INTO `table_category_form_mapping` (`mapping_id`, `category_form_id`, `dropdown_name`, `status_id`) VALUES
(1, 2, 'Dropdown1', 1),
(2, 2, 'Dropdown2', 1),
(3, 3, 'dsd', 1),
(4, 3, 'sdasd', 1),
(5, 5, 'null', 1),
(6, 7, 'Android', 1),
(7, 7, 'IOS', 1),
(8, 7, 'Windows', 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_color`
--

CREATE TABLE IF NOT EXISTS `table_color` (
  `color_id` int(11) NOT NULL AUTO_INCREMENT,
  `color_name` varchar(100) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`color_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=8 ;

--
-- Dumping data for table `table_color`
--

INSERT INTO `table_color` (`color_id`, `color_name`, `status_id`) VALUES
(1, 'Red', 3),
(2, 'Red', 3),
(3, 'Black', 3),
(4, 'sadfsfd', 3);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bills`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bills` (
  `bill_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `bill_reference_id` varchar(100) NOT NULL,
  `uploaded_by` int(11) NOT NULL,
  `created_on` datetime NOT NULL,
  `updated_on` datetime NOT NULL,
  `updated_by_user_id` int(11) NOT NULL,
  `user_status` int(11) NOT NULL COMMENT 'status_id',
  `admin_status` int(11) NOT NULL COMMENT 'status_id',
  PRIMARY KEY (`bill_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `table_consumer_bills`
--

INSERT INTO `table_consumer_bills` (`bill_id`, `user_id`, `bill_reference_id`, `uploaded_by`, `created_on`, `updated_on`, `updated_by_user_id`, `user_status`, `admin_status`) VALUES
(1, 10, 'BinBill 1', 1, '2017-08-09 06:17:16', '2017-08-09 04:12:10', 10, 8, 8);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_amc`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_amc` (
  `bill_amc_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_product_id` int(11) NOT NULL,
  `amc_provider_type` int(11) NOT NULL COMMENT '1=brand,2=seller',
  `amc_provider_id` int(11) NOT NULL,
  `policy_number` varchar(100) NOT NULL,
  `premium_type` varchar(50) NOT NULL,
  `premium_amount` float(15,2) NOT NULL,
  `policy_effective_date` datetime NOT NULL,
  `policy_expiry_date` datetime NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`bill_amc_id`),
  KEY `bill_product_id` (`bill_product_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `table_consumer_bill_amc`
--

INSERT INTO `table_consumer_bill_amc` (`bill_amc_id`, `bill_product_id`, `amc_provider_type`, `amc_provider_id`, `policy_number`, `premium_type`, `premium_amount`, `policy_effective_date`, `policy_expiry_date`, `status_id`) VALUES
(1, 1, 1, 1, 'sd', 'Yearly', 200.00, '0000-00-00 00:00:00', '0000-00-00 00:00:00', 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_amc_copies`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_amc_copies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_amc_id` int(11) NOT NULL,
  `bill_image` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `table_consumer_bill_amc_copies`
--

INSERT INTO `table_consumer_bill_amc_copies` (`id`, `bill_amc_id`, `bill_image`) VALUES
(1, 1, '1.png'),
(2, 1, '2.png');

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_amc_exclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_amc_exclusions` (
  `amc_exclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_amc_id` int(11) NOT NULL,
  `exclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`amc_exclusions_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_consumer_bill_amc_exclusions`
--

INSERT INTO `table_consumer_bill_amc_exclusions` (`amc_exclusions_id`, `bill_amc_id`, `exclusions_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_amc_inclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_amc_inclusions` (
  `amc_inclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_amc_id` int(11) NOT NULL,
  `inclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`amc_inclusions_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_consumer_bill_amc_inclusions`
--

INSERT INTO `table_consumer_bill_amc_inclusions` (`amc_inclusions_id`, `bill_amc_id`, `inclusions_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_copies`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_copies` (
  `bill_copy_id` int(11) NOT NULL,
  `bill_id` int(11) NOT NULL,
  `bill_copy_name` varchar(200) NOT NULL,
  `bill_copy_type` varchar(20) NOT NULL,
  `status_id` int(11) NOT NULL,
  `updated_by_user_id` int(11) NOT NULL,
  `uploaded_by_id` int(11) NOT NULL,
  PRIMARY KEY (`bill_copy_id`),
  KEY `bill_id` (`bill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `table_consumer_bill_copies`
--

INSERT INTO `table_consumer_bill_copies` (`bill_copy_id`, `bill_id`, `bill_copy_name`, `bill_copy_type`, `status_id`, `updated_by_user_id`, `uploaded_by_id`) VALUES
(15, 21, '2-21-1502976808748.txt', 'txt', 6, 0, 0),
(16, 21, '2-21-1502976672377.jpeg', 'jpeg', 6, 0, 0),
(17, 22, '2-22-1502976823816.txt', 'txt', 6, 0, 0),
(18, 22, '2-22-1502976822781.jpeg', 'jpeg', 6, 0, 0),
(19, 27, '2-27-1503039520499.txt', 'txt', 6, 2, 2),
(20, 27, '2-27-1503039519437.jpeg', 'jpeg', 6, 2, 2);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_details`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_details` (
  `bill_detail_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_id` int(11) NOT NULL,
  `consumer_name` varchar(200) NOT NULL,
  `consumer_email_id` varchar(200) NOT NULL,
  `consumer_phone_no` varchar(15) NOT NULL,
  `document_id` int(11) NOT NULL,
  `invoice_number` varchar(100) NOT NULL,
  `total_purchase_value` float(15,2) NOT NULL,
  `taxes` float(15,2) NOT NULL,
  `purchase_date` datetime NOT NULL,
  `created_on` datetime NOT NULL,
  `updated_on` datetime NOT NULL,
  `updated_by_user_id` int(11) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`bill_detail_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `table_consumer_bill_details`
--

INSERT INTO `table_consumer_bill_details` (`bill_detail_id`, `bill_id`, `consumer_name`, `consumer_email_id`, `consumer_phone_no`, `document_id`, `invoice_number`, `total_purchase_value`, `taxes`, `purchase_date`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 1, 'Amit', '', '', 1, '123', 1000.00, 10.00, '2017-08-17 00:00:00', '2017-08-18 16:03:24', '2017-08-18 16:03:24', 9, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_details_copies`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_details_copies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_detail_id` int(11) NOT NULL,
  `bill_image` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `table_consumer_bill_details_copies`
--

INSERT INTO `table_consumer_bill_details_copies` (`id`, `bill_detail_id`, `bill_image`) VALUES
(1, 1, '1.png'),
(2, 1, '2.png');

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_insurance`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_insurance` (
  `bill_insurance_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_product_id` int(11) NOT NULL,
  `insurance_provider_type` int(11) NOT NULL COMMENT '1=brand,2=seller',
  `insurance_provider_id` int(11) NOT NULL,
  `insurance_plan` varchar(200) NOT NULL,
  `policy_number` varchar(100) NOT NULL,
  `amount_insured` float(15,2) NOT NULL,
  `premium_type` varchar(50) NOT NULL,
  `premium_amount` float(15,2) NOT NULL,
  `policy_effective_date` datetime NOT NULL,
  `policy_expiry_date` datetime NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`bill_insurance_id`),
  KEY `bill_product_id` (`bill_product_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `table_consumer_bill_insurance`
--

INSERT INTO `table_consumer_bill_insurance` (`bill_insurance_id`, `bill_product_id`, `insurance_provider_type`, `insurance_provider_id`, `insurance_plan`, `policy_number`, `amount_insured`, `premium_type`, `premium_amount`, `policy_effective_date`, `policy_expiry_date`, `status_id`) VALUES
(1, 1, 2, 52, 'sadsad', 'sad', 1000.00, 'Yearly', 100.00, '2017-08-17 00:00:00', '2018-08-17 00:00:00', 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_insurance_copies`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_insurance_copies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_insurance_id` int(11) NOT NULL,
  `bill_image` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `table_consumer_bill_insurance_copies`
--

INSERT INTO `table_consumer_bill_insurance_copies` (`id`, `bill_insurance_id`, `bill_image`) VALUES
(1, 1, '1.png'),
(2, 1, '2.png');

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_insurance_exclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_insurance_exclusions` (
  `insurance_exclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_insurance_id` int(11) NOT NULL,
  `exclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`insurance_exclusions_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_consumer_bill_insurance_exclusions`
--

INSERT INTO `table_consumer_bill_insurance_exclusions` (`insurance_exclusions_id`, `bill_insurance_id`, `exclusions_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_insurance_inclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_insurance_inclusions` (
  `insurance_inclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_insurance_id` int(11) NOT NULL,
  `inclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`insurance_inclusions_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_consumer_bill_insurance_inclusions`
--

INSERT INTO `table_consumer_bill_insurance_inclusions` (`insurance_inclusions_id`, `bill_insurance_id`, `inclusions_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_products`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_products` (
  `bill_product_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_detail_id` int(11) NOT NULL,
  `product_name` varchar(200) NOT NULL,
  `master_category_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `brand_id` int(11) NOT NULL,
  `color_id` int(11) NOT NULL,
  `value_of_purchase` float(15,2) NOT NULL,
  `taxes` float(15,2) NOT NULL,
  `tag` varchar(200) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`bill_product_id`),
  KEY `bill_id` (`bill_detail_id`,`master_category_id`,`category_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `table_consumer_bill_products`
--

INSERT INTO `table_consumer_bill_products` (`bill_product_id`, `bill_detail_id`, `product_name`, `master_category_id`, `category_id`, `brand_id`, `color_id`, `value_of_purchase`, `taxes`, `tag`, `status_id`) VALUES
(1, 1, 'Text', 1, 4, 1, 1, 1000.00, 10.00, 'dsadad', 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_product_meta_data`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_product_meta_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_product_id` int(11) NOT NULL,
  `category_form_id` int(11) NOT NULL,
  `form_element_value` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `table_consumer_bill_product_meta_data`
--

INSERT INTO `table_consumer_bill_product_meta_data` (`id`, `bill_product_id`, `category_form_id`, `form_element_value`) VALUES
(1, 1, 1, 'dasda'),
(2, 1, 2, '2');

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_seller_mapping`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_seller_mapping` (
  `bill_seller_info_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_detail_id` int(11) NOT NULL,
  `ref_type` int(11) NOT NULL COMMENT '1=online seller, 2=offline seller',
  `seller_ref_id` int(11) NOT NULL,
  PRIMARY KEY (`bill_seller_info_id`),
  KEY `bill_product_id` (`bill_detail_id`,`seller_ref_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `table_consumer_bill_seller_mapping`
--

INSERT INTO `table_consumer_bill_seller_mapping` (`bill_seller_info_id`, `bill_detail_id`, `ref_type`, `seller_ref_id`) VALUES
(1, 1, 1, 2),
(2, 1, 2, 51);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_warranty`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_warranty` (
  `bill_warranty_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_product_id` int(11) NOT NULL,
  `warranty_provider_type` int(11) NOT NULL COMMENT '1=brand,2=seller',
  `warranty_provider_id` int(11) NOT NULL,
  `warranty_type` varchar(100) NOT NULL,
  `policy_number` varchar(100) NOT NULL,
  `premium_type` varchar(100) NOT NULL,
  `premium_amount` float(15,2) NOT NULL,
  `policy_effective_date` datetime NOT NULL,
  `policy_expiry_date` datetime NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`bill_warranty_id`),
  KEY `bill_product_id` (`bill_product_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `table_consumer_bill_warranty`
--

INSERT INTO `table_consumer_bill_warranty` (`bill_warranty_id`, `bill_product_id`, `warranty_provider_type`, `warranty_provider_id`, `warranty_type`, `policy_number`, `premium_type`, `premium_amount`, `policy_effective_date`, `policy_expiry_date`, `status_id`) VALUES
(1, 1, 1, 1, 'Warranty', 'sadad', 'Yearly', 2000.00, '2017-08-17 00:00:00', '2018-08-17 00:00:00', 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_warranty_copies`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_warranty_copies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_warranty_id` int(11) NOT NULL,
  `bill_image` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `table_consumer_bill_warranty_copies`
--

INSERT INTO `table_consumer_bill_warranty_copies` (`id`, `bill_warranty_id`, `bill_image`) VALUES
(1, 1, '1.png'),
(2, 1, '2.png');

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_warranty_exclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_warranty_exclusions` (
  `warranty_exclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_warranty_id` int(11) NOT NULL,
  `exclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`warranty_exclusions_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_consumer_bill_warranty_exclusions`
--

INSERT INTO `table_consumer_bill_warranty_exclusions` (`warranty_exclusions_id`, `bill_warranty_id`, `exclusions_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_warranty_inclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_warranty_inclusions` (
  `warranty_inclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_warranty_id` int(11) NOT NULL,
  `inclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`warranty_inclusions_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_consumer_bill_warranty_inclusions`
--

INSERT INTO `table_consumer_bill_warranty_inclusions` (`warranty_inclusions_id`, `bill_warranty_id`, `inclusions_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_contactdetails_type`
--

CREATE TABLE IF NOT EXISTS `table_contactdetails_type` (
  `contactdetails_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `contactdetails_type_name` varchar(100) NOT NULL,
  PRIMARY KEY (`contactdetails_type_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_contactdetails_type`
--

INSERT INTO `table_contactdetails_type` (`contactdetails_type_id`, `contactdetails_type_name`) VALUES
(1, 'URL'),
(2, 'Email-ID'),
(3, 'Phone Number');

-- --------------------------------------------------------

--
-- Table structure for table `table_cust_executive_tasks`
--

CREATE TABLE IF NOT EXISTS `table_cust_executive_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `bill_id` int(11) NOT NULL,
  `comments` text,
  `created_on` datetime NOT NULL,
  `updated_on` datetime NOT NULL,
  `updated_by_user_id` int(11) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`,`bill_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_cust_executive_tasks`
--

INSERT INTO `table_cust_executive_tasks` (`id`, `user_id`, `bill_id`, `comments`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(3, 9, 1, NULL, '2017-08-18 15:16:23', '2017-08-18 15:16:23', 1, 6);

-- --------------------------------------------------------

--
-- Table structure for table `table_document_types`
--

CREATE TABLE IF NOT EXISTS `table_document_types` (
  `document_id` int(11) NOT NULL AUTO_INCREMENT,
  `document_name` varchar(255) NOT NULL,
  PRIMARY KEY (`document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `table_list_of_exclusions`
--

CREATE TABLE IF NOT EXISTS `table_list_of_exclusions` (
  `exclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `exclusions_name` varchar(200) NOT NULL,
  `created_on` datetime NOT NULL,
  `updated_on` datetime NOT NULL,
  `updated_by_user_id` int(11) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`exclusions_id`),
  KEY `category_id` (`category_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=7 ;

--
-- Dumping data for table `table_list_of_exclusions`
--

INSERT INTO `table_list_of_exclusions` (`exclusions_id`, `category_id`, `exclusions_name`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 4, 'ddd', '2017-08-05 13:05:43', '2017-08-10 18:57:21', 1, 3),
(2, 4, 'sdadad', '2017-08-05 13:05:52', '2017-08-10 18:57:26', 1, 3),
(3, 6, 'appl', '2017-08-05 13:06:13', '2017-08-10 19:07:19', 1, 1),
(4, 15, 'sddsf', '2017-08-10 18:50:51', '2017-08-10 18:50:51', 1, 1),
(5, 15, 'exclusion', '2017-08-10 18:52:10', '2017-08-10 19:07:45', 1, 3),
(6, 15, 'final', '2017-08-10 18:54:14', '2017-08-10 18:54:14', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_list_of_inclusions`
--

CREATE TABLE IF NOT EXISTS `table_list_of_inclusions` (
  `inclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `inclusions_name` varchar(200) NOT NULL,
  `created_on` datetime NOT NULL,
  `updated_on` datetime NOT NULL,
  `updated_by_user_id` int(11) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`inclusions_id`),
  KEY `category_id` (`category_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `table_list_of_inclusions`
--

INSERT INTO `table_list_of_inclusions` (`inclusions_id`, `category_id`, `inclusions_name`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 6, 'dgfdgfdg', '2017-08-05 14:57:11', '2017-08-10 19:14:03', 1, 3),
(2, 18, 'inclu2', '2017-08-10 19:12:48', '2017-08-10 19:12:54', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_offline_seller`
--

CREATE TABLE IF NOT EXISTS `table_offline_seller` (
  `offline_seller_id` int(11) NOT NULL AUTO_INCREMENT,
  `offline_seller_name` varchar(255) NOT NULL,
  `offline_seller_owner_name` varchar(200) NOT NULL,
  `offline_seller_gstin_no` varchar(100) NOT NULL,
  `offline_seller_pan_number` varchar(50) NOT NULL,
  `offline_seller_registration_no` varchar(200) NOT NULL,
  `is_service_provider` tinyint(1) NOT NULL,
  `is_onboarded` tinyint(1) NOT NULL,
  `address_house_no` varchar(100) NOT NULL,
  `address_block` varchar(100) NOT NULL,
  `address_street` varchar(100) NOT NULL,
  `address_sector` varchar(100) NOT NULL,
  `address_city` varchar(100) NOT NULL,
  `address_state` varchar(100) NOT NULL,
  `address_pin_code` varchar(11) NOT NULL,
  `address_nearby` varchar(255) NOT NULL,
  `latitude` varchar(255) NOT NULL,
  `longitude` varchar(255) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`offline_seller_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=53 ;

--
-- Dumping data for table `table_offline_seller`
--

INSERT INTO `table_offline_seller` (`offline_seller_id`, `offline_seller_name`, `offline_seller_owner_name`, `offline_seller_gstin_no`, `offline_seller_pan_number`, `offline_seller_registration_no`, `is_service_provider`, `is_onboarded`, `address_house_no`, `address_block`, `address_street`, `address_sector`, `address_city`, `address_state`, `address_pin_code`, `address_nearby`, `latitude`, `longitude`, `status_id`) VALUES
(1, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(2, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(3, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(4, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(5, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(6, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(7, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(8, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(9, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(10, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(11, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(12, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(13, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(14, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(15, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(16, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(17, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(18, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(19, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(20, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(21, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(22, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(23, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(24, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(25, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(26, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(27, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(28, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(29, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(30, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(31, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(32, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(33, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(34, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(35, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(36, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(37, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(38, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(39, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(40, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(41, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(42, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(43, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(44, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(45, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(46, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(47, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(48, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(49, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(50, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1),
(51, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 1),
(52, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_offline_seller_details`
--

CREATE TABLE IF NOT EXISTS `table_offline_seller_details` (
  `seller_detail_id` int(11) NOT NULL AUTO_INCREMENT,
  `offline_seller_id` int(11) NOT NULL,
  `contactdetail_type_id` int(11) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `details` varchar(200) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`seller_detail_id`),
  KEY `offline_seller_id` (`offline_seller_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=53 ;

--
-- Dumping data for table `table_offline_seller_details`
--

INSERT INTO `table_offline_seller_details` (`seller_detail_id`, `offline_seller_id`, `contactdetail_type_id`, `display_name`, `details`, `status_id`) VALUES
(1, 1, 1, 'sadsa', 'sad', 1),
(2, 2, 1, 'sadsa', 'sad', 1),
(3, 3, 1, 'sadsa', 'sad', 1),
(4, 4, 1, 'sadsa', 'sad', 1),
(5, 5, 1, 'sadsa', 'sad', 1),
(6, 6, 1, 'sadsa', 'sad', 1),
(7, 7, 1, 'sadsa', 'sad', 1),
(8, 8, 1, 'sadsa', 'sad', 1),
(9, 9, 1, 'sadsa', 'sad', 1),
(10, 10, 1, 'sadsa', 'sad', 1),
(11, 11, 1, 'sadsa', 'sad', 1),
(12, 12, 1, 'sdf', 'dsf', 1),
(13, 13, 1, 'sadsa', 'sad', 1),
(14, 14, 1, 'sdf', 'dsf', 1),
(15, 15, 1, 'sadsa', 'sad', 1),
(16, 16, 1, 'sdf', 'dsf', 1),
(17, 17, 1, 'sadsa', 'sad', 1),
(18, 18, 1, 'sdf', 'dsf', 1),
(19, 19, 1, 'sadsa', 'sad', 1),
(20, 20, 1, 'sdf', 'dsf', 1),
(21, 21, 1, 'sadsa', 'sad', 1),
(22, 22, 1, 'sdf', 'dsf', 1),
(23, 23, 1, 'sadsa', 'sad', 1),
(24, 24, 1, 'sdf', 'dsf', 1),
(25, 25, 1, 'sadsa', 'sad', 1),
(26, 26, 1, 'sdf', 'dsf', 1),
(27, 27, 1, 'sadsa', 'sad', 1),
(28, 28, 1, 'sdf', 'dsf', 1),
(29, 29, 1, 'sadsa', 'sad', 1),
(30, 30, 1, 'sdf', 'dsf', 1),
(31, 31, 1, 'sadsa', 'sad', 1),
(32, 32, 1, 'sdf', 'dsf', 1),
(33, 33, 1, 'sadsa', 'sad', 1),
(34, 34, 1, 'sdf', 'dsf', 1),
(35, 35, 1, 'sadsa', 'sad', 1),
(36, 36, 1, 'sdf', 'dsf', 1),
(37, 37, 1, 'sadsa', 'sad', 1),
(38, 38, 1, 'sdf', 'dsf', 1),
(39, 39, 1, 'sadsa', 'sad', 1),
(40, 40, 1, 'sdf', 'dsf', 1),
(41, 41, 1, 'sadsa', 'sad', 1),
(42, 42, 1, 'sdf', 'dsf', 1),
(43, 43, 1, 'sadsa', 'sad', 1),
(44, 44, 1, 'sdf', 'dsf', 1),
(45, 45, 1, 'sadsa', 'sad', 1),
(46, 46, 1, 'sdf', 'dsf', 1),
(47, 47, 1, 'sadsa', 'sad', 1),
(48, 48, 1, 'sdf', 'dsf', 1),
(49, 49, 1, 'sadsa', 'sad', 1),
(50, 50, 1, 'sdf', 'dsf', 1),
(51, 51, 1, 'sadsa', 'sad', 1),
(52, 52, 1, 'sdf', 'dsf', 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_online_seller`
--

CREATE TABLE IF NOT EXISTS `table_online_seller` (
  `seller_id` int(11) NOT NULL AUTO_INCREMENT,
  `seller_name` varchar(150) NOT NULL,
  `seller_url` varchar(255) NOT NULL,
  `seller_gstin_no` varchar(100) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`seller_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=6 ;

--
-- Dumping data for table `table_online_seller`
--

INSERT INTO `table_online_seller` (`seller_id`, `seller_name`, `seller_url`, `seller_gstin_no`, `status_id`) VALUES
(1, 'Testdsf', 'sad', 'asd', 1),
(2, 'Test1', 'url', 'sdfsdfdfdffds', 1),
(3, 'Test3', '', '', 1),
(4, 'new seller', 'undefined', 'sdsdf', 3),
(5, 'new online seller', 'undefined', 'sdsdf', 3);

-- --------------------------------------------------------

--
-- Table structure for table `table_online_seller_details`
--

CREATE TABLE IF NOT EXISTS `table_online_seller_details` (
  `seller_detail_id` int(11) NOT NULL AUTO_INCREMENT,
  `seller_id` int(11) NOT NULL,
  `contactdetail_type_id` int(11) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `details` varchar(255) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`seller_detail_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=8 ;

--
-- Dumping data for table `table_online_seller_details`
--

INSERT INTO `table_online_seller_details` (`seller_detail_id`, `seller_id`, `contactdetail_type_id`, `display_name`, `details`, `status_id`) VALUES
(1, 1, 1, 'Suport', '3333', 3),
(2, 2, 3, 'Suport', '11', 1),
(3, 1, 1, 'Suport', '3333', 1),
(4, 1, 2, 'Suport', 'dfdf', 1),
(5, 3, 3, 'Suport', '2222222', 1),
(6, 4, 2, 'asdas', 'assadasd', 3),
(7, 5, 0, '', '', 3);

-- --------------------------------------------------------

--
-- Table structure for table `table_os_type`
--

CREATE TABLE IF NOT EXISTS `table_os_type` (
  `os_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `os_type_name` varchar(100) NOT NULL,
  PRIMARY KEY (`os_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `table_qual_executive_tasks`
--

CREATE TABLE IF NOT EXISTS `table_qual_executive_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `bill_id` int(11) NOT NULL,
  `created_on` datetime NOT NULL,
  `updated_on` datetime NOT NULL,
  `updated_by_user_id` int(11) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`,`bill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `table_seller_category_brand_type_mapping`
--

CREATE TABLE IF NOT EXISTS `table_seller_category_brand_type_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `brand_id` int(11) NOT NULL,
  `ref_type_id` int(11) NOT NULL,
  `ref_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`,`brand_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `table_seller_onlineseller_mapping`
--

CREATE TABLE IF NOT EXISTS `table_seller_onlineseller_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `offline_seller_id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `table_seller_provider_type`
--

CREATE TABLE IF NOT EXISTS `table_seller_provider_type` (
  `seller_provider_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `seller_provider_type_name` varchar(100) NOT NULL,
  PRIMARY KEY (`seller_provider_type_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=6 ;

--
-- Dumping data for table `table_seller_provider_type`
--

INSERT INTO `table_seller_provider_type` (`seller_provider_type_id`, `seller_provider_type_name`) VALUES
(1, 'Products'),
(2, 'Insurance'),
(3, 'Warranty'),
(4, 'AMC'),
(5, 'Service');

-- --------------------------------------------------------

--
-- Table structure for table `table_seller_provider_type_mapping`
--

CREATE TABLE IF NOT EXISTS `table_seller_provider_type_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `seller_provider_type_id` int(11) NOT NULL,
  `ref_type` int(11) NOT NULL COMMENT '1=brand,2=seller',
  `ref_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `table_status`
--

CREATE TABLE IF NOT EXISTS `table_status` (
  `status_id` int(11) NOT NULL AUTO_INCREMENT,
  `status_name` varchar(50) NOT NULL,
  PRIMARY KEY (`status_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=9 ;

--
-- Dumping data for table `table_status`
--

INSERT INTO `table_status` (`status_id`, `status_name`) VALUES
(1, 'Active'),
(2, 'Inactive'),
(3, 'Delete'),
(4, 'New'),
(5, 'Complete'),
(6, 'Incomplete'),
(7, 'Reassigned'),
(8, 'Under Progress');

-- --------------------------------------------------------

--
-- Table structure for table `table_token`
--

CREATE TABLE IF NOT EXISTS `table_token` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token_id` varchar(100) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_on` datetime NOT NULL,
  `expiry_on` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `table_token`
--

INSERT INTO `table_token` (`id`, `token_id`, `user_id`, `created_on`, `expiry_on`) VALUES
(1, 'sqifscWHi3E7lIUQTSbAK2d9g', 1, '2017-08-01 16:09:40', '2017-08-01 16:09:40'),
(2, 'YgdCcHmmaKoOIH5SIbrT0dnwz', 9, '2017-08-10 15:32:32', '2017-08-10 15:32:32'),
(3, 'TPqnAtWo46o5CKt6feohm2900', 8, '2017-08-10 16:41:52', '2017-08-10 16:41:52'),
(4, 'Ub3KxSEoPsycRjMd6ZljqcjcU', 11, '2017-08-18 15:17:54', '2017-08-18 15:17:54');

-- --------------------------------------------------------

--
-- Table structure for table `table_users`
--

CREATE TABLE IF NOT EXISTS `table_users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_type_id` int(11) NOT NULL,
  `fullname` varchar(150) DEFAULT NULL,
  `gmail_id` varchar(100) DEFAULT NULL,
  `facebook_id` varchar(100) DEFAULT NULL,
  `email_id` varchar(100) DEFAULT NULL,
  `mobile_no` varchar(15) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `tmp_password` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `latitude` varchar(255) DEFAULT NULL,
  `longitude` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `os_type_id` int(11) DEFAULT NULL,
  `gcm_id` varchar(255) DEFAULT NULL,
  `device_id` varchar(100) DEFAULT NULL,
  `device_model` varchar(100) DEFAULT NULL,
  `apk_version` varchar(10) DEFAULT NULL,
  `created_on` datetime NOT NULL,
  `updated_on` datetime NOT NULL,
  `last_login` datetime NOT NULL,
  `status_id` int(11) NOT NULL DEFAULT '1',
  `token` varchar(2000) DEFAULT NULL,
  `expiresIn` bigint(255) DEFAULT NULL,
  `passwordResetToken` varchar(2000) DEFAULT NULL,
  `accessLevel` varchar(255) DEFAULT NULL,
  `trueCallerAuthKey` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=15 ;

--
-- Dumping data for table `table_users`
--

INSERT INTO `table_users` (`user_id`, `user_type_id`, `fullname`, `gmail_id`, `facebook_id`, `email_id`, `mobile_no`, `password`, `tmp_password`, `location`, `latitude`, `longitude`, `image`, `os_type_id`, `gcm_id`, `device_id`, `device_model`, `apk_version`, `created_on`, `updated_on`, `last_login`, `status_id`, `token`, `expiresIn`, `passwordResetToken`, `accessLevel`, `trueCallerAuthKey`) VALUES
(1, 1, 'SuperAdmin', '', '', 'superadmin@binbill.com', '', '81dc9bdb52d04dc20036dbd8313ed055', '1234', '', '', '', '', 0, '', '', '', '', '0000-00-00 00:00:00', '0000-00-00 00:00:00', '0000-00-00 00:00:00', 1, NULL, NULL, NULL, NULL, NULL),
(5, 2, 'Admin1', NULL, NULL, 'admin11@binbill.com', NULL, '289dff07669d7a23de0ef88d2f7129e7', '234', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-02 14:34:40', '2017-08-08 18:37:24', '0000-00-00 00:00:00', 1, NULL, NULL, NULL, NULL, NULL),
(6, 2, 'Admin', NULL, NULL, 'admin1@binbill.com', NULL, '0e7517141fb53f21ee439b355b5a1d0a', 'Admin@123', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-02 15:38:16', '2017-08-02 16:51:59', '0000-00-00 00:00:00', 3, NULL, NULL, NULL, NULL, NULL),
(7, 2, 'Admin', NULL, NULL, 'admin1@binbill.com', NULL, '0e7517141fb53f21ee439b355b5a1d0a', 'Admin@123', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-05 12:15:32', '2017-08-05 12:15:32', '0000-00-00 00:00:00', 1, NULL, NULL, NULL, NULL, NULL),
(8, 4, 'QE1', NULL, NULL, 'qe@gmail.com', NULL, '81dc9bdb52d04dc20036dbd8313ed055', '1234', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-05 12:17:04', '2017-08-10 19:34:20', '0000-00-00 00:00:00', 1, NULL, NULL, NULL, NULL, NULL),
(9, 3, 'CE12', NULL, NULL, 'ce@gmail.com', NULL, '81dc9bdb52d04dc20036dbd8313ed055', '1234', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-08 11:20:16', '2017-08-10 19:25:51', '0000-00-00 00:00:00', 1, NULL, NULL, NULL, NULL, NULL),
(10, 5, 'Amit Kuamr', NULL, NULL, NULL, '9953145118', '81dc9bdb52d04dc20036dbd8313ed055', '1234', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-09 02:14:08', '2017-08-09 04:11:06', '2017-08-09 07:13:13', 1, NULL, NULL, NULL, NULL, NULL),
(11, 3, 'ce', NULL, NULL, 'cddd@dd', NULL, '81dc9bdb52d04dc20036dbd8313ed055', '1234', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-10 19:24:15', '2017-08-10 19:24:15', '0000-00-00 00:00:00', 1, NULL, NULL, NULL, NULL, NULL),
(12, NULL, NULL, NULL, NULL, NULL, '8826262175', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-18 13:40:46', '2017-08-18 13:40:46', '2017-08-18 14:42:42', 1, 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MTIsIlVzZXJUeXBlSUQiOm51bGwsIk5hbWUiOm51bGwsIkdvb2dsZUF1dGhLZXkiOm51bGwsIkZhY2Vib29rQXV0aEtleSI6bnVsbCwiRW1haWxBZGRyZXNzIjpudWxsLCJQaG9uZU5vIjoiODgyNjI2MjE3NSIsIlBhc3N3b3JkIjpudWxsLCJPVFAiOm51bGwsIkxvY2F0aW9uIjpudWxsLCJMYXRpdHVkZSI6bnVsbCwiTG9uZ2l0dWRlIjpudWxsLCJJbWFnZUxpbmsiOm51bGwsIk9TVHlwZUlkIjpudWxsLCJhY2Nlc3NMZXZlbCI6InVzZXIiLCJjcmVhdGVkQXQiOiIyMDE3LTA4LTE4VDEzOjQwOjQ2LjAwMFoiLCJHQ01JZCI6bnVsbCwicGFzc3dvcmRSZXNldFRva2VuIjpudWxsLCJ1cGRhdGVkQXQiOiIyMDE3LTA4LTE4VDEzOjQwOjQ2LjAwMFoiLCJkZXZpY2VJZCI6bnVsbCwiZGV2aWNlTW9kZWwiOm51bGwsImFwa1ZlcnNpb24iOm51bGwsIkxhc3RMb2dpbk9uIjoiMjAxNy0wOC0xOFQxNDo0Mjo0Mi4wMDBaIiwiaWF0IjoxNTAzMDY3MzYyLCJleHAiOjE1MDQ1NzEwNzcxODh9.FHNW0XVOGnBD_dfdzzvVZv2DZtgsphyZHZKOwDlOhZw9LtQO-Ty7D_3RbzrAztsokeJyoHDG8HfFZm_KH-RdQcGIbBY_zV-x7wgEI-SynLsYz4_Bh_K6RaQKIUuBrTfpw6f1q3PIX9pYLex7lFAJV4cs0ALoPZ3v8ZbK4eeE83k', 1503068009826, NULL, 'user', NULL),
(13, NULL, NULL, NULL, NULL, NULL, '7230027999', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-18 13:59:53', '2017-08-18 13:59:53', '2017-08-18 15:25:30', 1, 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MTMsIlVzZXJUeXBlSUQiOm51bGwsIk5hbWUiOm51bGwsIkdvb2dsZUF1dGhLZXkiOm51bGwsIkZhY2Vib29rQXV0aEtleSI6bnVsbCwiRW1haWxBZGRyZXNzIjpudWxsLCJQaG9uZU5vIjoiNzIzMDAyNzk5OSIsIlBhc3N3b3JkIjpudWxsLCJPVFAiOm51bGwsIkxvY2F0aW9uIjpudWxsLCJMYXRpdHVkZSI6bnVsbCwiTG9uZ2l0dWRlIjpudWxsLCJJbWFnZUxpbmsiOm51bGwsIk9TVHlwZUlkIjpudWxsLCJhY2Nlc3NMZXZlbCI6InVzZXIiLCJjcmVhdGVkQXQiOiIyMDE3LTA4LTE4VDEzOjU5OjUzLjAwMFoiLCJHQ01JZCI6bnVsbCwicGFzc3dvcmRSZXNldFRva2VuIjpudWxsLCJ1cGRhdGVkQXQiOiIyMDE3LTA4LTE4VDEzOjU5OjUzLjAwMFoiLCJkZXZpY2VJZCI6bnVsbCwiZGV2aWNlTW9kZWwiOm51bGwsImFwa1ZlcnNpb24iOm51bGwsIkxhc3RMb2dpbk9uIjoiMjAxNy0wOC0xOFQxNToyNTozMC4wMDBaIiwic3RhdHVzX2lkIjoxLCJpYXQiOjE1MDMxMjE5MTYsImV4cCI6MTUwNDYyNTY4NDkzMn0.emmcNDj86vmGvdSdtZP8HuKjWb57F6HSmMkwPaD_BU5R1NXjN1nys2p8MjVlaj5sJLJxnRNkfAueFno7AKAQD1fWLNxM7rPmr35KX8Z1XEk-Pgr2peW1C83D07Y-BZi9NrNyliM0dKXVqQblUAQl4Gsh-oxCgmhSwG6AshaqCR0', 1503122563016, NULL, 'user', NULL),
(14, NULL, NULL, NULL, NULL, NULL, '7409733726', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-18 14:02:38', '2017-08-18 14:02:38', '2017-08-18 14:02:38', 1, 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NMZXZlbCI6InVzZXIiLCJjcmVhdGVkQXQiOiIyMDE3LTA4LTE4VDE0OjAyOjM4LjAwMFoiLCJ1cGRhdGVkQXQiOiIyMDE3LTA4LTE4VDE0OjAyOjM4LjAwMFoiLCJMYXN0TG9naW5PbiI6bnVsbCwiSUQiOjE0LCJQaG9uZU5vIjoiNzQwOTczMzcyNiIsImlhdCI6MTUwMzA2NDk1OCwiZXhwIjoxNTA0NTY4NjcwODA0fQ.A-6oj1yC4pD0r6MsMk4OcjK3sI7UXtEpvXWmfdTX-4dEeNcrD4qU2Gl7Oo4qdfqxSA3AnWGa7M_cS4sgpVIqHLg5cnxVKlStBPz16JsdyT8ptKSZWekkkdx3BbhtjSJB1R_Aa9Lef08VhFgerV_cX6NdSP932chmcZlRte_bgzk', 1503065605846, NULL, 'user', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `table_users_temp`
--

CREATE TABLE `table_users_temp` (
  `user_id` int(11) NOT NULL,
  `tmp_password` varchar(255) DEFAULT NULL,
  `mobile_no` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `secret` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `table_users_temp`
--

INSERT INTO `table_users_temp` (`user_id`, `tmp_password`, `mobile_no`, `createdAt`, `updatedAt`, `secret`) VALUES
(1, '129659', '+919694833641', '2017-08-18 10:10:58', '2017-08-18 10:10:58', ''),
(2, '662488', '919694833641', '2017-08-18 10:16:31', '2017-08-18 10:16:31', ''),
(3, '470885', '7230027999', '2017-08-18 10:21:33', '2017-08-18 15:24:47', 'OJZGIMTPOUXUERLVNR5GYNBPIRWEIQRU'),
(4, '143625', '9694833641', '2017-08-18 10:26:31', '2017-08-18 12:35:04', 'N5MEG2CKJAZTQMKVOFQUMVCOORKG2ZCE'),
(5, '511376', '8826262175', '2017-08-18 12:47:08', '2017-08-18 14:42:15', 'J5VDQQSTOFTDQZ3ZIZUGS4BZOJ2G2TKV'),
(6, '055391', '9412901981', '2017-08-18 13:53:38', '2017-08-18 13:53:38', 'NBFFKOKDJ5FES3LUORZDM2JQGAZW652M'),
(7, '697644', '7409733726', '2017-08-18 13:53:57', '2017-08-18 14:11:01', 'PE2XIR2GPFKWS2CTPJJHSQLLGV2TQODG');

-- --------------------------------------------------------

--
-- Table structure for table `table_user_type`
--

CREATE TABLE IF NOT EXISTS `table_user_type` (
  `user_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_type_name` varchar(100) NOT NULL,
  PRIMARY KEY (`user_type_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=8 ;

--
-- Dumping data for table `table_user_type`
--

INSERT INTO `table_user_type` (`user_type_id`, `user_type_name`) VALUES
(1, 'SuperAdmin'),
(2, 'Admin'),
(3, 'Customer Executive'),
(4, 'Quality Executive'),
(5, 'Consumer'),
(6, 'Date Manager'),
(7, 'Merchant');


/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;