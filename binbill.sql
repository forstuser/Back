-- phpMyAdmin SQL Dump
-- version 4.1.14
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: Aug 14, 2017 at 03:43 PM
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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=6 ;

--
-- Dumping data for table `table_brands`
--

INSERT INTO `table_brands` (`brand_id`, `brand_name`, `brand_description`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 'Test', '', '2017-08-03 14:57:35', '2017-08-03 16:17:30', 1, 1),
(2, 'Testdsf', '', '2017-08-03 14:57:42', '2017-08-03 17:40:20', 1, 3),
(3, 'Test2', 'sdfsf', '2017-08-03 15:10:25', '2017-08-03 17:40:39', 1, 3),
(4, 'Test3', 'sdfsf', '2017-08-03 15:10:53', '2017-08-03 15:10:53', 1, 1),
(5, 'sss', '', '2017-08-14 16:45:29', '2017-08-14 16:45:29', 9, 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=6 ;

--
-- Dumping data for table `table_brand_details`
--

INSERT INTO `table_brand_details` (`brand_detail_id`, `brand_id`, `contactdetails_type_id`, `display_name`, `details`, `status_id`) VALUES
(1, 1, 1, 'Suport', 'fsdfsdf', 3),
(2, 2, 3, 'Suport', '3333', 1),
(3, 2, 2, 'Suport', 'dfdf', 3),
(4, 2, 1, 'Suport', 'fsdfsdf', 1),
(5, 5, 0, '', '', 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=39 ;

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
(11, 'New', NULL, 0, 1, '2017-08-08 11:20:51', '2017-08-08 11:20:51', 1, 1),
(12, 'new cat', NULL, 0, 2, '2017-08-08 11:29:04', '2017-08-08 11:29:04', 1, 1),
(13, 'go', NULL, 0, 2, '2017-08-08 11:32:15', '2017-08-08 11:32:15', 1, 1),
(14, 'osdsad', NULL, 0, 2, '2017-08-08 11:34:25', '2017-08-08 11:34:25', 1, 1),
(15, 'new cat ', NULL, 11, 2, '2017-08-08 11:36:09', '2017-08-08 11:36:09', 1, 1),
(16, 'new 2', NULL, 11, 2, '2017-08-08 11:36:40', '2017-08-08 11:36:40', 1, 1),
(17, 'abc11', NULL, 11, 2, '2017-08-08 11:37:15', '2017-08-08 11:38:06', 1, 3),
(18, 'abc2', NULL, 2, 2, '2017-08-08 11:37:24', '2017-08-08 11:37:24', 1, 1),
(19, 'new sub cat', NULL, 15, 3, '2017-08-08 13:13:37', '2017-08-08 13:16:54', 1, 3),
(20, 'new cat 222', NULL, 15, 3, '2017-08-08 13:15:35', '2017-08-08 13:18:42', 1, 1),
(21, 'new subs', NULL, 15, 3, '2017-08-08 13:17:43', '2017-08-08 13:17:48', 1, 3),
(22, 'abc3', NULL, 2, 2, '2017-08-08 13:19:30', '2017-08-08 13:19:35', 1, 3),
(23, 'test2 subcat', NULL, 3, 2, '2017-08-08 13:23:20', '2017-08-08 13:23:20', 1, 1),
(24, 'test 2 sub cat ', NULL, 23, 3, '2017-08-08 13:23:38', '2017-08-08 13:23:38', 1, 1),
(25, 'asdsad', NULL, 0, 1, '2017-08-08 18:37:43', '2017-08-08 18:43:17', 1, 3),
(26, 'asdasd', NULL, 11, 2, '2017-08-08 18:37:56', '2017-08-08 18:43:23', 1, 3),
(27, 'asdas', NULL, 16, 3, '2017-08-08 18:38:12', '2017-08-08 18:38:12', 1, 1),
(38, 'FormCat', NULL, 1, 2, '2017-08-14 18:49:24', '2017-08-14 18:49:24', 1, 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `table_cateogry_form`
--

INSERT INTO `table_cateogry_form` (`cateogry_form_id`, `category_id`, `form_element_name`, `form_element_type`, `status_id`) VALUES
(1, 38, 'Text', 1, 1),
(2, 38, 'Dropdown', 2, 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `table_cateogry_form_mapping`
--

INSERT INTO `table_cateogry_form_mapping` (`mapping_id`, `cateogry_form_id`, `dropdown_name`, `status_id`) VALUES
(1, 2, 'Dropdown1', 1),
(2, 2, 'Dropdown2', 1);

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
  PRIMARY KEY (`bill_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `table_consumer_bills`
--

INSERT INTO `table_consumer_bills` (`bill_id`, `user_id`, `bill_reference_id`, `uploaded_by`, `created_on`, `updated_on`, `updated_by_user_id`, `user_status`, `admin_status`) VALUES
(1, 10, 'BinBill 1', 1, '2017-08-09 06:17:16', '2017-08-09 04:12:10', 10, 8, 5);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_copies`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_copies` (
  `bill_copie_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_id` int(11) NOT NULL,
  `bill_copie_name` varchar(200) NOT NULL,
  `bill_copie_type` varchar(20) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`bill_copie_id`),
  KEY `bill_id` (`bill_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `table_consumer_bill_copies`
--

INSERT INTO `table_consumer_bill_copies` (`bill_copie_id`, `bill_id`, `bill_copie_name`, `bill_copie_type`, `status_id`) VALUES
(1, 1, 'jdfskljklfjsd.PNG', 'Image', 1),
(2, 1, 'dsadsa.PNG', 'Image', 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `table_cust_executive_tasks`
--

INSERT INTO `table_cust_executive_tasks` (`id`, `user_id`, `bill_id`, `comments`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 9, 1, NULL, '2017-08-12 18:34:27', '2017-08-12 18:34:27', 1, 5);

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
  `lattitude` varchar(255) NOT NULL,
  `longitude` varchar(255) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`offline_seller_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=6 ;

--
-- Dumping data for table `table_offline_seller`
--

INSERT INTO `table_offline_seller` (`offline_seller_id`, `offline_seller_name`, `offline_seller_owner_name`, `offline_seller_gstin_no`, `offline_seller_pan_number`, `offline_seller_registration_no`, `is_service_provider`, `is_onboarded`, `address_house_no`, `address_block`, `address_street`, `address_sector`, `address_city`, `address_state`, `address_pin_code`, `address_nearby`, `lattitude`, `longitude`, `status_id`) VALUES
(1, 'Testing', 'Test', '', '', '', 0, 0, '', '', '', '', 'South Delhi', 'Delhi', '110062', 'Test1', '', '', 1),
(2, 'new seller', '', '', '', '', 0, 0, '', '', '', '', 'gurgaon', 'Haryana', 'null', 'null', 'null', 'null', 3),
(3, 'new', 'null', 'null', 'null', 'null', 0, 0, 'null', 'null', 'null', 'null', 'sdfsdf', 'sdfsdf', 'null', 'null', 'null', 'null', 3),
(4, 'Test', 'null', 'null', 'null', 'null', 0, 0, 'null', 'null', 'null', 'null', 'city', 'state', 'null', 'null', 'null', 'null', 3),
(5, 'test', '', '', '', 'null', 0, 0, 'null', 'null', 'null', 'null', 'asdasd', 'asdasd', 'null', 'null', 'null', 'null', 3);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=9 ;

--
-- Dumping data for table `table_offline_seller_details`
--

INSERT INTO `table_offline_seller_details` (`seller_detail_id`, `offline_seller_id`, `contactdetail_type_id`, `display_name`, `details`, `status_id`) VALUES
(1, 1, 1, 'Suport', '3335', 1),
(2, 1, 1, 'Suport', '2222222', 3),
(3, 1, 1, 'Suport', '2222222', 3),
(4, 1, 1, 'Suport', '3334', 3),
(5, 2, 2, 'email', 'email@gmail.com', 3),
(6, 3, 2, 'sdfs', 'dfsd', 3),
(7, 4, 0, 'null', 'null', 3),
(8, 5, 0, 'null', 'null', 3);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `table_qual_executive_tasks`
--

INSERT INTO `table_qual_executive_tasks` (`id`, `user_id`, `bill_id`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 8, 1, '2017-08-14 15:12:48', '2017-08-14 15:12:48', 1, 5);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_token`
--

INSERT INTO `table_token` (`id`, `token_id`, `user_id`, `created_on`, `expiry_on`) VALUES
(1, 'TkEKXWxdZuQnJmZKzcdqw432L', 1, '2017-08-01 16:09:40', '2017-08-01 16:09:40'),
(2, '8dbA97pP2d6udrYeaDlce3HUK', 9, '2017-08-10 15:32:32', '2017-08-10 15:32:32'),
(3, 'TPqnAtWo46o5CKt6feohm2900', 8, '2017-08-10 16:41:52', '2017-08-10 16:41:52');

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=13 ;

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
(11, 3, 'ce', NULL, NULL, 'cddd@dd', NULL, '81dc9bdb52d04dc20036dbd8313ed055', '1234', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-10 19:24:15', '2017-08-10 19:24:15', '0000-00-00 00:00:00', 1),
(12, 3, 'cenasnsasd', NULL, NULL, 'ashdjk@gmaoil.com', NULL, 'd1758a69c60f126d5523868055d370ec', 'sadfjksdf', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-14 11:30:13', '2017-08-14 11:30:32', '0000-00-00 00:00:00', 3);

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
