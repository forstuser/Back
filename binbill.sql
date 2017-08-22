-- phpMyAdmin SQL Dump
-- version 4.1.14
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: Aug 22, 2017 at 04:13 PM
-- Server version: 5.6.17
-- PHP Version: 5.5.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

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
  `lattitude` varchar(255) NOT NULL,
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

INSERT INTO `table_authorized_service_center` (`center_id`, `brand_id`, `center_name`, `address_house_no`, `address_block`, `address_street`, `address_sector`, `address_city`, `address_state`, `address_pin_code`, `address_nearby`, `lattitude`, `longitude`, `open_days`, `timings`, `status_id`) VALUES
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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=10 ;

--
-- Dumping data for table `table_brands`
--

INSERT INTO `table_brands` (`brand_id`, `brand_name`, `brand_description`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 'Test', '', '2017-08-03 14:57:35', '2017-08-21 16:06:52', 1, 3),
(2, 'Testdsf', '', '2017-08-03 14:57:42', '2017-08-03 17:40:20', 1, 3),
(3, 'Test2', 'sdfsf', '2017-08-03 15:10:25', '2017-08-03 17:40:39', 1, 3),
(4, 'Test3', 'sdfsf', '2017-08-03 15:10:53', '2017-08-21 16:06:49', 1, 3),
(5, 'sss', '', '2017-08-14 16:45:29', '2017-08-21 16:06:54', 1, 3),
(6, 'Tata', 'Motor cars', '2017-08-21 16:06:42', '2017-08-21 16:06:42', 1, 1),
(7, 'Honda', 'Motor Car', '2017-08-21 16:07:08', '2017-08-21 16:07:08', 1, 1),
(8, 'Audi', 'Motor Cars', '2017-08-21 16:07:26', '2017-08-21 16:07:26', 1, 1),
(9, 'Maruti', 'Motor cars', '2017-08-21 16:07:46', '2017-08-21 16:07:46', 1, 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=11 ;

--
-- Dumping data for table `table_brand_details`
--

INSERT INTO `table_brand_details` (`brand_detail_id`, `brand_id`, `contactdetails_type_id`, `display_name`, `details`, `status_id`) VALUES
(1, 1, 1, 'Suport', 'fsdfsdf', 3),
(2, 2, 3, 'Suport', '3333', 1),
(3, 2, 2, 'Suport', 'dfdf', 3),
(4, 2, 1, 'Suport', 'fsdfsdf', 1),
(5, 5, 1, 'zsdzx', 'sszcszd', 3),
(6, 5, 1, 'xxx', 'xxx', 3),
(7, 6, 1, 'TATA', 'www.tata.com', 1),
(8, 7, 0, '', '', 1),
(9, 8, 0, '', '', 1),
(10, 9, 0, '', '', 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=42 ;

--
-- Dumping data for table `table_categories`
--

INSERT INTO `table_categories` (`category_id`, `category_name`, `display_id`, `ref_id`, `category_level`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 'Test4', NULL, 0, 1, '2017-08-01 18:52:43', '2017-08-21 16:01:06', 1, 3),
(2, 'Automobile', NULL, 0, 1, '2017-08-01 18:58:03', '2017-08-21 13:22:57', 1, 1),
(3, 'Test2', NULL, 0, 1, '2017-08-01 18:59:28', '2017-08-21 16:01:03', 1, 3),
(4, 'Test', NULL, 1, 2, '2017-08-01 18:59:53', '2017-08-21 16:01:06', 1, 3),
(5, 'Test5', NULL, 0, 1, '2017-08-01 19:01:43', '2017-08-08 11:29:21', 1, 3),
(6, 'Test5', NULL, 1, 2, '2017-08-01 19:01:54', '2017-08-21 16:01:06', 1, 3),
(7, 'Test6', NULL, 1, 2, '2017-08-01 19:03:56', '2017-08-21 16:01:06', 1, 3),
(8, 'Test6', NULL, 4, 3, '2017-08-02 18:02:37', '2017-08-21 16:01:06', 1, 3),
(9, 'New', NULL, 0, 1, '2017-08-08 11:15:55', '2017-08-08 11:16:49', 1, 3),
(10, 'new', NULL, 0, 1, '2017-08-08 11:17:25', '2017-08-08 11:17:31', 1, 3),
(11, 'Electronics', NULL, 0, 1, '2017-08-08 11:20:51', '2017-08-18 13:15:53', 1, 1),
(12, 'new cat', NULL, 0, 2, '2017-08-08 11:29:04', '2017-08-08 11:29:04', 1, 1),
(13, 'go', NULL, 0, 2, '2017-08-08 11:32:15', '2017-08-08 11:32:15', 1, 1),
(14, 'osdsad', NULL, 0, 2, '2017-08-08 11:34:25', '2017-08-08 11:34:25', 1, 1),
(15, 'new cat ', NULL, 11, 2, '2017-08-08 11:36:09', '2017-08-18 13:23:25', 1, 3),
(16, 'new 2', NULL, 11, 2, '2017-08-08 11:36:40', '2017-08-18 13:23:22', 1, 3),
(17, 'abc11', NULL, 11, 2, '2017-08-08 11:37:15', '2017-08-08 11:38:06', 1, 3),
(18, 'abc2', NULL, 2, 2, '2017-08-08 11:37:24', '2017-08-21 16:00:33', 1, 3),
(19, 'new sub cat', NULL, 15, 3, '2017-08-08 13:13:37', '2017-08-18 13:23:25', 1, 3),
(20, 'new cat 222', NULL, 15, 3, '2017-08-08 13:15:35', '2017-08-18 13:23:25', 1, 3),
(21, 'new subs', NULL, 15, 3, '2017-08-08 13:17:43', '2017-08-18 13:23:25', 1, 3),
(22, 'abc3', NULL, 2, 2, '2017-08-08 13:19:30', '2017-08-08 13:19:35', 1, 3),
(23, 'test2 subcat', NULL, 3, 2, '2017-08-08 13:23:20', '2017-08-21 16:01:03', 1, 3),
(24, 'test 2 sub cat ', NULL, 23, 3, '2017-08-08 13:23:38', '2017-08-21 16:01:03', 1, 3),
(25, 'asdsad', NULL, 0, 1, '2017-08-08 18:37:43', '2017-08-08 18:43:17', 1, 3),
(26, 'asdasd', NULL, 11, 2, '2017-08-08 18:37:56', '2017-08-08 18:43:23', 1, 3),
(27, 'asdas', NULL, 16, 3, '2017-08-08 18:38:12', '2017-08-18 13:23:22', 1, 3),
(38, 'FormCat', NULL, 1, 2, '2017-08-14 18:49:24', '2017-08-21 16:01:06', 1, 3),
(39, 'Cars', NULL, 11, 2, '2017-08-18 13:02:00', '2017-08-18 13:06:41', 1, 3),
(40, 'Phone', NULL, 11, 2, '2017-08-18 13:08:07', '2017-08-18 13:08:07', 1, 1),
(41, 'Car', NULL, 2, 2, '2017-08-21 13:25:13', '2017-08-21 13:25:13', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_cateogry_form`
--

CREATE TABLE IF NOT EXISTS `table_cateogry_form` (
  `cateogry_form_id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `form_element_name` varchar(200) NOT NULL,
  `form_element_type` int(11) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`cateogry_form_id`),
  KEY `category_id` (`category_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=12 ;

--
-- Dumping data for table `table_cateogry_form`
--

INSERT INTO `table_cateogry_form` (`cateogry_form_id`, `category_id`, `form_element_name`, `form_element_type`, `status_id`) VALUES
(1, 38, 'Text', 1, 1),
(2, 38, 'Dropdown', 2, 1),
(3, 38, 'Type', 2, 1),
(4, 39, 'Color', 1, 1),
(5, 39, 'Speed', 2, 1),
(6, 40, 'IMEI ', 1, 1),
(7, 40, 'OS type', 2, 1),
(8, 41, 'Color', 1, 1),
(9, 41, 'Horse Power', 1, 1),
(10, 41, 'Oil', 2, 1),
(11, 41, 'Cooling', 2, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_cateogry_form_mapping`
--

CREATE TABLE IF NOT EXISTS `table_cateogry_form_mapping` (
  `mapping_id` int(11) NOT NULL AUTO_INCREMENT,
  `cateogry_form_id` int(11) NOT NULL,
  `dropdown_name` varchar(200) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`mapping_id`),
  KEY `cateogry_form_id` (`cateogry_form_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=15 ;

--
-- Dumping data for table `table_cateogry_form_mapping`
--

INSERT INTO `table_cateogry_form_mapping` (`mapping_id`, `cateogry_form_id`, `dropdown_name`, `status_id`) VALUES
(1, 2, 'Dropdown1', 1),
(2, 2, 'Dropdown2', 1),
(3, 3, 'dsd', 1),
(4, 3, 'sdasd', 1),
(5, 5, 'null', 1),
(6, 7, 'Android', 1),
(7, 7, 'IOS', 1),
(8, 7, 'Windows', 1),
(9, 10, 'Petrol', 1),
(10, 10, 'Diesel', 1),
(11, 10, 'CNG', 1),
(12, 10, 'Battery', 1),
(13, 11, 'AC', 1),
(14, 11, 'Non AC', 1);

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
(4, 'sadfsfd', 3),
(5, 'red', 3),
(6, 'blue', 3),
(7, 'pink', 1);

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
  PRIMARY KEY (`bill_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_consumer_bills`
--

INSERT INTO `table_consumer_bills` (`bill_id`, `user_id`, `bill_reference_id`, `uploaded_by`, `created_on`, `updated_on`, `updated_by_user_id`, `user_status`, `admin_status`) VALUES
(1, 10, 'BinBill 1', 1, '2017-08-09 06:17:16', '2017-08-09 04:12:10', 10, 8, 8),
(2, 10, 'BibBill2', 1, '2017-08-22 02:06:06', '2017-08-22 04:10:08', 10, 8, 8),
(3, 10, 'BibBill3', 1, '2017-08-22 00:00:00', '2017-08-22 00:00:00', 10, 8, 4);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_amc`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_amc` (
  `bill_amc_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `bill_product_id` int(11) NOT NULL,
  `seller_type` int(11) NOT NULL COMMENT '1=brand,2=seller',
  `seller_id` int(11) NOT NULL,
  `policy_number` varchar(100) NOT NULL,
  `premium_type` varchar(50) NOT NULL,
  `premium_amount` float(15,2) NOT NULL,
  `policy_effective_date` datetime NOT NULL,
  `policy_expiry_date` datetime NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`bill_amc_id`),
  KEY `bill_product_id` (`bill_product_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `table_consumer_bill_amc`
--

INSERT INTO `table_consumer_bill_amc` (`bill_amc_id`, `user_id`, `bill_product_id`, `seller_type`, `seller_id`, `policy_number`, `premium_type`, `premium_amount`, `policy_effective_date`, `policy_expiry_date`, `status_id`) VALUES
(1, 10, 1, 2, 1, 'sd', 'Yearly', 200.00, '0000-00-00 00:00:00', '0000-00-00 00:00:00', 1),
(2, 10, 1, 2, 0, 'sd', 'Yearly', 200.00, '0000-00-00 00:00:00', '0000-00-00 00:00:00', 1),
(3, 10, 2, 2, 1, 'sd', 'Yearly', 200.00, '0000-00-00 00:00:00', '0000-00-00 00:00:00', 1),
(4, 10, 1, 1, 1, 'sd', 'Yearly', 200.00, '0000-00-00 00:00:00', '0000-00-00 00:00:00', 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_amc_copies`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_amc_copies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_amc_id` int(11) NOT NULL,
  `bill_copy_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=7 ;

--
-- Dumping data for table `table_consumer_bill_amc_copies`
--

INSERT INTO `table_consumer_bill_amc_copies` (`id`, `bill_amc_id`, `bill_copy_id`) VALUES
(1, 1, 2),
(2, 2, 1),
(3, 2, 2),
(4, 3, 2),
(5, 4, 1),
(6, 4, 2);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_amc_exclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_amc_exclusions` (
  `amc_exclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_amc_id` int(11) NOT NULL,
  `exclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`amc_exclusions_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=11 ;

--
-- Dumping data for table `table_consumer_bill_amc_exclusions`
--

INSERT INTO `table_consumer_bill_amc_exclusions` (`amc_exclusions_id`, `bill_amc_id`, `exclusions_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 1),
(4, 2, 2),
(5, 2, 1),
(6, 3, 1),
(7, 3, 2),
(8, 4, 1),
(9, 4, 2),
(10, 4, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_amc_inclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_amc_inclusions` (
  `amc_inclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_amc_id` int(11) NOT NULL,
  `inclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`amc_inclusions_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=11 ;

--
-- Dumping data for table `table_consumer_bill_amc_inclusions`
--

INSERT INTO `table_consumer_bill_amc_inclusions` (`amc_inclusions_id`, `bill_amc_id`, `inclusions_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 1),
(4, 2, 2),
(5, 2, 1),
(6, 3, 1),
(7, 3, 2),
(8, 4, 1),
(9, 4, 2),
(10, 4, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_copies`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_copies` (
  `bill_copy_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_id` int(11) NOT NULL,
  `bill_copy_name` varchar(200) NOT NULL,
  `bill_copy_type` varchar(20) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`bill_copy_id`),
  KEY `bill_id` (`bill_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `table_consumer_bill_copies`
--

INSERT INTO `table_consumer_bill_copies` (`bill_copy_id`, `bill_id`, `bill_copy_name`, `bill_copy_type`, `status_id`) VALUES
(1, 1, 'jdfskljklfjsd.PNG', 'Image', 1),
(2, 1, 'dsadsa.PNG', 'Image', 1),
(3, 2, 'sa.PNG', 'PNG', 1),
(4, 3, 'tewrewf.PNG', 'PNG', 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_details`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_details` (
  `bill_detail_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `table_consumer_bill_details`
--

INSERT INTO `table_consumer_bill_details` (`bill_detail_id`, `user_id`, `consumer_name`, `consumer_email_id`, `consumer_phone_no`, `document_id`, `invoice_number`, `total_purchase_value`, `taxes`, `purchase_date`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 10, 'Amit', '', '', 1, '123', 1000.00, 10.00, '2017-08-17 00:00:00', '2017-08-22 14:38:03', '2017-08-22 14:38:03', 9, 1),
(2, 10, 'Pritam', 'pritamparker@gmail.com', '999999', 1, '21312', 10000.00, 12.00, '2017-08-17 00:00:00', '2017-08-22 19:25:17', '2017-08-22 19:25:17', 9, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_details_copies`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_details_copies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_detail_id` int(11) NOT NULL,
  `bill_copy_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `table_consumer_bill_details_copies`
--

INSERT INTO `table_consumer_bill_details_copies` (`id`, `bill_detail_id`, `bill_copy_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 1),
(4, 2, 2);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_insurance`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_insurance` (
  `bill_insurance_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `bill_product_id` int(11) NOT NULL,
  `seller_type` int(11) NOT NULL COMMENT '1=brand,2=seller',
  `seller_id` int(11) NOT NULL,
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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `table_consumer_bill_insurance`
--

INSERT INTO `table_consumer_bill_insurance` (`bill_insurance_id`, `user_id`, `bill_product_id`, `seller_type`, `seller_id`, `insurance_plan`, `policy_number`, `amount_insured`, `premium_type`, `premium_amount`, `policy_effective_date`, `policy_expiry_date`, `status_id`) VALUES
(1, 10, 1, 2, 1, 'sadsad', 'sad', 1000.00, 'Yearly', 100.00, '2017-08-17 00:00:00', '2018-08-17 00:00:00', 1),
(2, 10, 1, 2, 1, 'sadsad', 'sad', 1000.00, 'Yearly', 100.00, '2017-08-17 00:00:00', '2018-08-17 00:00:00', 1),
(3, 10, 2, 2, 1, 'sadsad', 'sad', 1000.00, 'Yearly', 100.00, '2017-08-17 00:00:00', '2018-08-17 00:00:00', 1),
(4, 10, 1, 2, 1, 'sadsad', 'sad', 1000.00, 'Yearly', 100.00, '2017-08-17 00:00:00', '2018-08-17 00:00:00', 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_insurance_copies`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_insurance_copies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_insurance_id` int(11) NOT NULL,
  `bill_copy_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `table_consumer_bill_insurance_copies`
--

INSERT INTO `table_consumer_bill_insurance_copies` (`id`, `bill_insurance_id`, `bill_copy_id`) VALUES
(1, 1, 1),
(2, 2, 4),
(3, 3, 1),
(4, 4, 4);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_insurance_exclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_insurance_exclusions` (
  `insurance_exclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_insurance_id` int(11) NOT NULL,
  `exclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`insurance_exclusions_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=7 ;

--
-- Dumping data for table `table_consumer_bill_insurance_exclusions`
--

INSERT INTO `table_consumer_bill_insurance_exclusions` (`insurance_exclusions_id`, `bill_insurance_id`, `exclusions_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 1),
(4, 3, 1),
(5, 3, 2),
(6, 4, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_insurance_inclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_insurance_inclusions` (
  `insurance_inclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_insurance_id` int(11) NOT NULL,
  `inclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`insurance_inclusions_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=7 ;

--
-- Dumping data for table `table_consumer_bill_insurance_inclusions`
--

INSERT INTO `table_consumer_bill_insurance_inclusions` (`insurance_inclusions_id`, `bill_insurance_id`, `inclusions_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 1),
(4, 3, 1),
(5, 3, 2),
(6, 4, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_mapping`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_id` int(11) NOT NULL,
  `bill_ref_type` int(11) NOT NULL COMMENT '1=bill,2=product',
  `ref_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `table_consumer_bill_mapping`
--

INSERT INTO `table_consumer_bill_mapping` (`id`, `bill_id`, `bill_ref_type`, `ref_id`) VALUES
(1, 1, 1, 1),
(2, 3, 2, 1),
(3, 2, 1, 2),
(4, 3, 2, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_products`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_products` (
  `bill_product_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `table_consumer_bill_products`
--

INSERT INTO `table_consumer_bill_products` (`bill_product_id`, `user_id`, `bill_detail_id`, `product_name`, `master_category_id`, `category_id`, `brand_id`, `color_id`, `value_of_purchase`, `taxes`, `tag`, `status_id`) VALUES
(1, 10, 1, 'Text', 1, 38, 1, 1, 1000.00, 10.00, 'dsadad', 1),
(2, 10, 2, 'product 1', 2, 41, 8, 7, 10000.00, 12.00, 'cars', 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_product_meta_data`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_product_meta_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_product_id` int(11) NOT NULL,
  `cateogry_form_id` int(11) NOT NULL,
  `form_element_value` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_consumer_bill_product_meta_data`
--

INSERT INTO `table_consumer_bill_product_meta_data` (`id`, `bill_product_id`, `cateogry_form_id`, `form_element_value`) VALUES
(1, 1, 1, 'dasda'),
(2, 1, 2, '2'),
(3, 2, 0, 'undefined');

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_repair`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_repair` (
  `bill_repair_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `bill_product_id` int(11) NOT NULL,
  `seller_type` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `value_of_repair` float(15,2) NOT NULL,
  `taxes` float(15,2) NOT NULL,
  `repair_invoice_number` varchar(100) NOT NULL,
  `repair_date` datetime NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`bill_repair_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `table_consumer_bill_repair`
--

INSERT INTO `table_consumer_bill_repair` (`bill_repair_id`, `user_id`, `bill_product_id`, `seller_type`, `seller_id`, `value_of_repair`, `taxes`, `repair_invoice_number`, `repair_date`, `status_id`) VALUES
(1, 10, 1, 2, 1, 200.00, 20.00, '123456', '2017-08-17 00:00:00', 1),
(2, 10, 1, 2, 1, 0.00, 0.00, '200', '0000-00-00 00:00:00', 1),
(3, 10, 2, 2, 1, 200.00, 20.00, '123456', '2017-08-17 00:00:00', 1),
(4, 10, 1, 1, 1, 200.00, 20.00, '123', '0000-00-00 00:00:00', 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_repair_copies`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_repair_copies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_repair_id` int(11) NOT NULL,
  `bill_copy_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `table_consumer_bill_repair_copies`
--

INSERT INTO `table_consumer_bill_repair_copies` (`id`, `bill_repair_id`, `bill_copy_id`) VALUES
(1, 1, 1),
(2, 2, 4),
(3, 3, 1),
(4, 4, 4);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=7 ;

--
-- Dumping data for table `table_consumer_bill_seller_mapping`
--

INSERT INTO `table_consumer_bill_seller_mapping` (`bill_seller_info_id`, `bill_detail_id`, `ref_type`, `seller_ref_id`) VALUES
(1, 1, 1, 2),
(2, 1, 2, 1),
(3, 1, 2, 2),
(4, 2, 1, 7),
(5, 2, 2, 56),
(6, 2, 2, 53);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_warranty`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_warranty` (
  `bill_warranty_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `bill_product_id` int(11) NOT NULL,
  `seller_type` int(11) NOT NULL COMMENT '1=brand,2=seller',
  `seller_id` int(11) NOT NULL,
  `warranty_type` varchar(100) NOT NULL,
  `policy_number` varchar(100) NOT NULL,
  `premium_type` varchar(100) NOT NULL,
  `premium_amount` float(15,2) NOT NULL,
  `policy_effective_date` datetime NOT NULL,
  `policy_expiry_date` datetime NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`bill_warranty_id`),
  KEY `bill_product_id` (`bill_product_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `table_consumer_bill_warranty`
--

INSERT INTO `table_consumer_bill_warranty` (`bill_warranty_id`, `user_id`, `bill_product_id`, `seller_type`, `seller_id`, `warranty_type`, `policy_number`, `premium_type`, `premium_amount`, `policy_effective_date`, `policy_expiry_date`, `status_id`) VALUES
(1, 10, 1, 1, 1, 'Warranty', 'sadad', 'Yearly', 2000.00, '2017-08-17 00:00:00', '2018-08-17 00:00:00', 1),
(2, 10, 1, 2, 1, 'Extend Warranty', 'sadad', 'Yearly', 2000.00, '2018-08-17 00:00:00', '2019-08-17 00:00:00', 1),
(3, 10, 2, 2, 1, 'Warranty', 'sadad', 'Yearly', 2000.00, '2017-08-17 00:00:00', '2018-08-17 00:00:00', 1),
(4, 10, 1, 1, 1, 'Extend Warranty', 'sadad', 'Yearly', 2000.00, '2018-08-17 00:00:00', '2019-08-17 00:00:00', 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_warranty_copies`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_warranty_copies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_warranty_id` int(11) NOT NULL,
  `bill_copy_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `table_consumer_bill_warranty_copies`
--

INSERT INTO `table_consumer_bill_warranty_copies` (`id`, `bill_warranty_id`, `bill_copy_id`) VALUES
(1, 1, 1),
(2, 2, 4),
(3, 3, 1),
(4, 4, 4);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_warranty_exclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_warranty_exclusions` (
  `warranty_exclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_warranty_id` int(11) NOT NULL,
  `exclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`warranty_exclusions_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=7 ;

--
-- Dumping data for table `table_consumer_bill_warranty_exclusions`
--

INSERT INTO `table_consumer_bill_warranty_exclusions` (`warranty_exclusions_id`, `bill_warranty_id`, `exclusions_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 1),
(4, 3, 1),
(5, 3, 2),
(6, 4, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_warranty_inclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_warranty_inclusions` (
  `warranty_inclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_warranty_id` int(11) NOT NULL,
  `inclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`warranty_inclusions_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=7 ;

--
-- Dumping data for table `table_consumer_bill_warranty_inclusions`
--

INSERT INTO `table_consumer_bill_warranty_inclusions` (`warranty_inclusions_id`, `bill_warranty_id`, `inclusions_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 1),
(4, 3, 1),
(5, 3, 2),
(6, 4, 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `table_cust_executive_tasks`
--

INSERT INTO `table_cust_executive_tasks` (`id`, `user_id`, `bill_id`, `comments`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(3, 9, 1, 'test', '2017-08-18 15:16:23', '2017-08-21 17:45:39', 5, 5),
(4, 9, 2, NULL, '2017-08-22 15:57:23', '2017-08-22 15:57:23', 1, 5);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=9 ;

--
-- Dumping data for table `table_list_of_exclusions`
--

INSERT INTO `table_list_of_exclusions` (`exclusions_id`, `category_id`, `exclusions_name`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 4, 'ddd', '2017-08-05 13:05:43', '2017-08-10 18:57:21', 1, 3),
(2, 4, 'sdadad', '2017-08-05 13:05:52', '2017-08-10 18:57:26', 1, 3),
(3, 6, 'appl', '2017-08-05 13:06:13', '2017-08-21 16:00:06', 1, 3),
(4, 15, 'sddsf', '2017-08-10 18:50:51', '2017-08-21 16:00:08', 1, 3),
(5, 15, 'exclusion', '2017-08-10 18:52:10', '2017-08-10 19:07:45', 1, 3),
(6, 15, 'final', '2017-08-10 18:54:14', '2017-08-21 16:00:11', 1, 3),
(7, 41, 'Wiper', '2017-08-21 15:52:20', '2017-08-21 15:52:20', 1, 1),
(8, 41, 'Mirror', '2017-08-21 15:52:40', '2017-08-21 15:52:40', 1, 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=6 ;

--
-- Dumping data for table `table_list_of_inclusions`
--

INSERT INTO `table_list_of_inclusions` (`inclusions_id`, `category_id`, `inclusions_name`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 6, 'dgfdgfdg', '2017-08-05 14:57:11', '2017-08-10 19:14:03', 1, 3),
(2, 18, 'inclu2', '2017-08-10 19:12:48', '2017-08-21 16:00:17', 1, 3),
(3, 41, 'Body', '2017-08-21 15:53:50', '2017-08-21 15:53:50', 1, 1),
(4, 41, 'Tyres', '2017-08-21 15:54:00', '2017-08-21 15:54:00', 1, 1),
(5, 41, 'Engine', '2017-08-21 15:54:12', '2017-08-21 15:54:12', 1, 1);

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
  `lattitude` varchar(255) NOT NULL,
  `longitude` varchar(255) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`offline_seller_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=57 ;

--
-- Dumping data for table `table_offline_seller`
--

INSERT INTO `table_offline_seller` (`offline_seller_id`, `offline_seller_name`, `offline_seller_owner_name`, `offline_seller_gstin_no`, `offline_seller_pan_number`, `offline_seller_registration_no`, `is_service_provider`, `is_onboarded`, `address_house_no`, `address_block`, `address_street`, `address_sector`, `address_city`, `address_state`, `address_pin_code`, `address_nearby`, `lattitude`, `longitude`, `status_id`) VALUES
(1, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(2, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(3, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(4, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(5, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(6, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(7, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(8, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(9, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(10, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(11, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(12, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(13, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(14, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(15, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(16, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(17, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(18, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(19, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(20, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(21, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(22, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(23, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(24, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(25, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(26, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(27, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(28, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(29, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(30, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(31, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(32, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(33, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(34, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(35, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(36, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(37, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(38, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(39, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(40, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(41, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(42, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(43, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(44, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(45, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(46, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(47, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(48, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(49, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(50, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(51, 'dsd', '', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '', '', '', '', 3),
(52, 'sdfdsfdsf', '', '', '', '', 0, 0, '', '', '', '', 'dsf', 'dsf', '', '', '', '', 3),
(53, 'Offline seller1', 'Vivek Kumar', '1233', 'AASASDSDD', '12F2321', 0, 0, '123A', 'G Block', '', '48', 'Gurgaon', 'Haryana', '110068', '', '', '', 1),
(54, 'The Mobile Store', 'Deepanshu', '121212', 'ASDFASDFADSF', '', 0, 0, '', '', '', '', 'Saket', 'New Delhi', '', '', '', '', 1),
(55, 'The Tech', 'Bhuvan', '123123123', '', '', 0, 0, '', '', '', '', 'South Delhi', 'New Delhi', '', '', '', '', 1),
(56, 'New Seller', 'Billu', '123123', '', '', 0, 0, '', '', '', '', 'North Delhi', 'New Delhi', '', '', '', '', 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=57 ;

--
-- Dumping data for table `table_offline_seller_details`
--

INSERT INTO `table_offline_seller_details` (`seller_detail_id`, `offline_seller_id`, `contactdetail_type_id`, `display_name`, `details`, `status_id`) VALUES
(1, 1, 1, 'sadsa', 'sad', 3),
(2, 2, 1, 'sadsa', 'sad', 3),
(3, 3, 1, 'sadsa', 'sad', 3),
(4, 4, 1, 'sadsa', 'sad', 3),
(5, 5, 1, 'sadsa', 'sad', 3),
(6, 6, 1, 'sadsa', 'sad', 3),
(7, 7, 1, 'sadsa', 'sad', 3),
(8, 8, 1, 'sadsa', 'sad', 3),
(9, 9, 1, 'sadsa', 'sad', 3),
(10, 10, 1, 'sadsa', 'sad', 3),
(11, 11, 1, 'sadsa', 'sad', 3),
(12, 12, 1, 'sdf', 'dsf', 3),
(13, 13, 1, 'sadsa', 'sad', 3),
(14, 14, 1, 'sdf', 'dsf', 3),
(15, 15, 1, 'sadsa', 'sad', 3),
(16, 16, 1, 'sdf', 'dsf', 3),
(17, 17, 1, 'sadsa', 'sad', 3),
(18, 18, 1, 'sdf', 'dsf', 3),
(19, 19, 1, 'sadsa', 'sad', 3),
(20, 20, 1, 'sdf', 'dsf', 3),
(21, 21, 1, 'sadsa', 'sad', 3),
(22, 22, 1, 'sdf', 'dsf', 3),
(23, 23, 1, 'sadsa', 'sad', 3),
(24, 24, 1, 'sdf', 'dsf', 3),
(25, 25, 1, 'sadsa', 'sad', 3),
(26, 26, 1, 'sdf', 'dsf', 3),
(27, 27, 1, 'sadsa', 'sad', 3),
(28, 28, 1, 'sdf', 'dsf', 3),
(29, 29, 1, 'sadsa', 'sad', 3),
(30, 30, 1, 'sdf', 'dsf', 3),
(31, 31, 1, 'sadsa', 'sad', 3),
(32, 32, 1, 'sdf', 'dsf', 3),
(33, 33, 1, 'sadsa', 'sad', 3),
(34, 34, 1, 'sdf', 'dsf', 3),
(35, 35, 1, 'sadsa', 'sad', 3),
(36, 36, 1, 'sdf', 'dsf', 3),
(37, 37, 1, 'sadsa', 'sad', 3),
(38, 38, 1, 'sdf', 'dsf', 3),
(39, 39, 1, 'sadsa', 'sad', 3),
(40, 40, 1, 'sdf', 'dsf', 3),
(41, 41, 1, 'sadsa', 'sad', 3),
(42, 42, 1, 'sdf', 'dsf', 3),
(43, 43, 1, 'sadsa', 'sad', 3),
(44, 44, 1, 'sdf', 'dsf', 3),
(45, 45, 1, 'sadsa', 'sad', 3),
(46, 46, 1, 'sdf', 'dsf', 3),
(47, 47, 1, 'sadsa', 'sad', 3),
(48, 48, 1, 'sdf', 'dsf', 3),
(49, 49, 1, 'sadsa', 'sad', 3),
(50, 50, 1, 'sdf', 'dsf', 3),
(51, 51, 1, 'sadsa', 'sad', 3),
(52, 52, 1, 'sdf', 'dsf', 3),
(53, 53, 3, 'Phone', '99999999999', 1),
(54, 54, 0, '', '', 1),
(55, 55, 2, 'Email', 'abc@gmail.com', 1),
(56, 56, 3, 'Phone', '96610912213', 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=9 ;

--
-- Dumping data for table `table_online_seller`
--

INSERT INTO `table_online_seller` (`seller_id`, `seller_name`, `seller_url`, `seller_gstin_no`, `status_id`) VALUES
(1, 'Testdsf', 'sad', 'asd', 3),
(2, 'Test1', 'url', 'sdfsdfdfdffds', 3),
(3, 'Test3', '', '', 3),
(4, 'new seller', 'undefined', 'sdsdf', 3),
(5, 'new online seller', 'undefined', 'sdsdf', 3),
(6, 'Flipkart', 'www.flipkart.com', '12213213', 1),
(7, 'Amazon', 'www.amazon.com', '234234', 1),
(8, 'Snapdeal', 'www.snapdeal.com', '77723213', 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=11 ;

--
-- Dumping data for table `table_online_seller_details`
--

INSERT INTO `table_online_seller_details` (`seller_detail_id`, `seller_id`, `contactdetail_type_id`, `display_name`, `details`, `status_id`) VALUES
(1, 1, 1, 'Suport', '3333', 3),
(2, 2, 3, 'Suport', '11', 3),
(3, 1, 1, 'Suport', '3333', 3),
(4, 1, 2, 'Suport', 'dfdf', 3),
(5, 3, 3, 'Suport', '2222222', 3),
(6, 4, 2, 'asdas', 'assadasd', 3),
(7, 5, 0, '', '', 3),
(8, 6, 3, 'Flipkart', '9999999999', 1),
(9, 7, 0, 'null', 'null', 1),
(10, 8, 0, 'null', 'null', 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `table_qual_executive_tasks`
--

INSERT INTO `table_qual_executive_tasks` (`id`, `user_id`, `bill_id`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(2, 8, 1, '2017-08-22 15:07:53', '2017-08-22 15:07:53', 1, 6);

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
(1, 'JDO3CU3UXUxoCYBomq8mELsOn', 1, '2017-08-01 16:09:40', '2017-08-01 16:09:40'),
(2, 'FsW1PgMduPFtQmBB8xRZoIcTW', 9, '2017-08-10 15:32:32', '2017-08-10 15:32:32'),
(3, 'gdCkwddnSsia4u6xBHIL65UxN', 8, '2017-08-10 16:41:52', '2017-08-10 16:41:52'),
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
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=14 ;

--
-- Dumping data for table `table_users`
--

INSERT INTO `table_users` (`user_id`, `user_type_id`, `fullname`, `gmail_id`, `facebook_id`, `email_id`, `mobile_no`, `password`, `tmp_password`, `location`, `latitude`, `longitude`, `image`, `os_type_id`, `gcm_id`, `device_id`, `device_model`, `apk_version`, `created_on`, `updated_on`, `last_login`, `status_id`) VALUES
(1, 1, 'SuperAdmin', '', '', 'superadmin@binbill.com', '', '81dc9bdb52d04dc20036dbd8313ed055', '1234', '', '', '', '', 0, '', '', '', '', '0000-00-00 00:00:00', '0000-00-00 00:00:00', '0000-00-00 00:00:00', 1),
(5, 2, 'Admin1', NULL, NULL, 'admin11@binbill.com', NULL, '289dff07669d7a23de0ef88d2f7129e7', '234', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-02 14:34:40', '2017-08-08 18:37:24', '0000-00-00 00:00:00', 1),
(6, 2, 'Admin', NULL, NULL, 'admin1@binbill.com', NULL, '0e7517141fb53f21ee439b355b5a1d0a', 'Admin@123', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-02 15:38:16', '2017-08-02 16:51:59', '0000-00-00 00:00:00', 3),
(7, 2, 'Admin', NULL, NULL, 'admin1@binbill.com', NULL, '0e7517141fb53f21ee439b355b5a1d0a', 'Admin@123', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-05 12:15:32', '2017-08-05 12:15:32', '0000-00-00 00:00:00', 1),
(8, 4, 'QE1', NULL, NULL, 'qe@gmail.com', NULL, '81dc9bdb52d04dc20036dbd8313ed055', '1234', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-05 12:17:04', '2017-08-10 19:34:20', '0000-00-00 00:00:00', 1),
(9, 3, 'CE12', NULL, NULL, 'ce@gmail.com', NULL, '81dc9bdb52d04dc20036dbd8313ed055', '1234', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-08 11:20:16', '2017-08-10 19:25:51', '0000-00-00 00:00:00', 1),
(10, 5, 'Amit Kuamr', NULL, NULL, NULL, '9953145118', '81dc9bdb52d04dc20036dbd8313ed055', '1234', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-09 02:14:08', '2017-08-09 04:11:06', '2017-08-09 07:13:13', 1),
(11, 3, 'ce', NULL, NULL, 'ce@binbill.com', NULL, '81dc9bdb52d04dc20036dbd8313ed055', '1234', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-10 19:24:15', '2017-08-21 16:01:26', '0000-00-00 00:00:00', 1),
(12, 3, 'cenasnsasd', NULL, NULL, 'ashdjk@gmaoil.com', NULL, 'd1758a69c60f126d5523868055d370ec', 'sadfjksdf', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-14 11:30:13', '2017-08-14 11:30:32', '0000-00-00 00:00:00', 3),
(13, 4, 'qe', NULL, NULL, 'qe@binbill.com', NULL, '81dc9bdb52d04dc20036dbd8313ed055', '1234', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-21 16:01:51', '2017-08-21 16:01:51', '0000-00-00 00:00:00', 1);

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
