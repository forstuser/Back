-- phpMyAdmin SQL Dump
-- version 4.1.14
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: Aug 05, 2017 at 03:15 PM
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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `table_authorized_service_center`
--

INSERT INTO `table_authorized_service_center` (`center_id`, `brand_id`, `center_name`, `address_house_no`, `address_block`, `address_street`, `address_sector`, `address_city`, `address_state`, `address_pin_code`, `address_nearby`, `lattitude`, `longitude`, `open_days`, `timings`, `status_id`) VALUES
(1, 1, 'Testingxzvdsv', '', 'Test1', '', '', 'South Delhi', 'Delhi', 110062, 'Test1', '', '', 'Test1', 'Test1', 1),
(2, 1, 'Testing', '', 'Test1', '', '', 'South Delhi', 'Delhi', 110062, 'Test1', '', '', 'Test1', 'Test1', 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_authorized_service_center_details`
--

INSERT INTO `table_authorized_service_center_details` (`center_detail_id`, `center_id`, `contactdetail_type_id`, `display_name`, `details`, `status_id`) VALUES
(1, 1, 1, 'Suport', '3333', 1),
(2, 1, 1, 'Suport', '3333', 1),
(3, 2, 1, 'Suport', '2222222', 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `table_brands`
--

INSERT INTO `table_brands` (`brand_id`, `brand_name`, `brand_description`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 'Test', '', '2017-08-03 14:57:35', '2017-08-03 16:17:30', 1, 1),
(2, 'Testdsf', '', '2017-08-03 14:57:42', '2017-08-03 17:40:20', 1, 3),
(3, 'Test2', 'sdfsf', '2017-08-03 15:10:25', '2017-08-03 17:40:39', 1, 3),
(4, 'Test3', 'sdfsf', '2017-08-03 15:10:53', '2017-08-03 15:10:53', 1, 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `table_brand_details`
--

INSERT INTO `table_brand_details` (`brand_detail_id`, `brand_id`, `contactdetails_type_id`, `display_name`, `details`, `status_id`) VALUES
(1, 1, 1, 'Suport', 'fsdfsdf', 3),
(2, 2, 3, 'Suport', '3333', 1),
(3, 2, 2, 'Suport', 'dfdf', 3),
(4, 2, 1, 'Suport', 'fsdfsdf', 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=9 ;

--
-- Dumping data for table `table_categories`
--

INSERT INTO `table_categories` (`category_id`, `category_name`, `display_id`, `ref_id`, `category_level`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 'Test4', NULL, 0, 1, '2017-08-01 18:52:43', '2017-08-02 18:18:54', 1, 3),
(2, 'Test1', NULL, 0, 1, '2017-08-01 18:58:03', '2017-08-01 18:58:03', 1, 1),
(3, 'Test2', NULL, 0, 1, '2017-08-01 18:59:28', '2017-08-01 18:59:28', 1, 1),
(4, 'Test', NULL, 1, 2, '2017-08-01 18:59:53', '2017-08-02 18:18:54', 1, 3),
(5, 'Test5', NULL, 0, 1, '2017-08-01 19:01:43', '2017-08-01 19:01:43', 1, 1),
(6, 'Test5', NULL, 1, 2, '2017-08-01 19:01:54', '2017-08-02 18:18:54', 1, 3),
(7, 'Test6', NULL, 1, 2, '2017-08-01 19:03:56', '2017-08-02 18:18:54', 1, 3),
(8, 'Test6', NULL, 4, 3, '2017-08-02 18:02:37', '2017-08-02 18:18:54', 1, 3);

-- --------------------------------------------------------

--
-- Table structure for table `table_color`
--

CREATE TABLE IF NOT EXISTS `table_color` (
  `color_id` int(11) NOT NULL AUTO_INCREMENT,
  `color_name` varchar(100) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`color_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `table_color`
--

INSERT INTO `table_color` (`color_id`, `color_name`, `status_id`) VALUES
(1, 'Red', 3),
(2, 'Red', 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_list_of_exclusions`
--

INSERT INTO `table_list_of_exclusions` (`exclusions_id`, `category_id`, `exclusions_name`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 4, 'ddd', '2017-08-05 13:05:43', '2017-08-05 14:25:23', 1, 1),
(2, 4, 'sdadad', '2017-08-05 13:05:52', '2017-08-05 15:25:13', 1, 1),
(3, 6, 'dasd', '2017-08-05 13:06:13', '2017-08-05 13:06:13', 1, 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `table_list_of_inclusions`
--

INSERT INTO `table_list_of_inclusions` (`inclusions_id`, `category_id`, `inclusions_name`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 6, 'dgfdgfdg', '2017-08-05 14:57:11', '2017-08-05 14:59:50', 1, 1);

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
  `address_house_no` int(100) NOT NULL,
  `address_block` int(100) NOT NULL,
  `address_street` int(100) NOT NULL,
  `address_sector` int(100) NOT NULL,
  `address_city` int(100) NOT NULL,
  `address_state` int(100) NOT NULL,
  `address_pin_code` int(11) NOT NULL,
  `address_nearby` int(255) NOT NULL,
  `lattitude` int(255) NOT NULL,
  `longitude` varchar(255) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`offline_seller_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

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
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_online_seller`
--

INSERT INTO `table_online_seller` (`seller_id`, `seller_name`, `seller_url`, `seller_gstin_no`, `status_id`) VALUES
(1, 'Testdsf', 'sad', 'asd', 1),
(2, 'Test1', '', '', 1),
(3, 'Test3', '', '', 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=6 ;

--
-- Dumping data for table `table_online_seller_details`
--

INSERT INTO `table_online_seller_details` (`seller_detail_id`, `seller_id`, `contactdetail_type_id`, `display_name`, `details`, `status_id`) VALUES
(1, 1, 1, 'Suport', '3333', 3),
(2, 2, 3, 'Suport', '2222222', 1),
(3, 1, 1, 'Suport', '3333', 1),
(4, 1, 2, 'Suport', 'dfdf', 1),
(5, 3, 3, 'Suport', '2222222', 1);

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
-- Table structure for table `table_status`
--

CREATE TABLE IF NOT EXISTS `table_status` (
  `status_id` int(11) NOT NULL AUTO_INCREMENT,
  `status_name` varchar(50) NOT NULL,
  PRIMARY KEY (`status_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_status`
--

INSERT INTO `table_status` (`status_id`, `status_name`) VALUES
(1, 'Active'),
(2, 'Inactive'),
(3, 'Delete');

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `table_token`
--

INSERT INTO `table_token` (`id`, `token_id`, `user_id`, `created_on`, `expiry_on`) VALUES
(1, '72L0ddzozUeHZhkNYQFNlnIbu', 1, '2017-08-01 16:09:40', '2017-08-01 16:09:40');

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=9 ;

--
-- Dumping data for table `table_users`
--

INSERT INTO `table_users` (`user_id`, `user_type_id`, `fullname`, `gmail_id`, `facebook_id`, `email_id`, `mobile_no`, `password`, `tmp_password`, `location`, `latitude`, `longitude`, `image`, `os_type_id`, `gcm_id`, `device_id`, `device_model`, `apk_version`, `created_on`, `updated_on`, `last_login`, `status_id`) VALUES
(1, 1, 'SuperAdmin', '', '', 'superadmin@binbill.com', '', '81dc9bdb52d04dc20036dbd8313ed055', '1234', '', '', '', '', 0, '', '', '', '', '0000-00-00 00:00:00', '0000-00-00 00:00:00', '0000-00-00 00:00:00', 1),
(5, 2, 'Admin1', NULL, NULL, 'admin11@binbill.com', NULL, '289dff07669d7a23de0ef88d2f7129e7', '234', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-02 14:34:40', '2017-08-02 16:30:54', '0000-00-00 00:00:00', 1),
(6, 2, 'Admin', NULL, NULL, 'admin1@binbill.com', NULL, '0e7517141fb53f21ee439b355b5a1d0a', 'Admin@123', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-02 15:38:16', '2017-08-02 16:51:59', '0000-00-00 00:00:00', 3),
(7, 2, 'Admin', NULL, NULL, 'admin1@binbill.com', NULL, '0e7517141fb53f21ee439b355b5a1d0a', 'Admin@123', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-05 12:15:32', '2017-08-05 12:15:32', '0000-00-00 00:00:00', 1),
(8, 2, 'Admin', NULL, NULL, 'admin@gmail.com', NULL, '81dc9bdb52d04dc20036dbd8313ed055', '1234', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2017-08-05 12:17:04', '2017-08-05 12:17:04', '0000-00-00 00:00:00', 1);

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
