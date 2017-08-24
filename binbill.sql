-- phpMyAdmin SQL Dump
-- version 4.1.14
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: Aug 24, 2017 at 03:50 PM
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
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

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
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

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
(1, 'Samsung', '', '2017-08-24 18:32:22', '2017-08-24 18:32:22', 1, 1),
(2, 'Apple', '', '2017-08-24 18:32:29', '2017-08-24 18:33:38', 1, 1),
(3, 'Nokia', '', '2017-08-24 18:32:34', '2017-08-24 18:33:51', 1, 1),
(4, 'LG', '', '2017-08-24 18:32:41', '2017-08-24 18:33:45', 1, 1);

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
(1, 1, 0, '', '', 1),
(2, 2, 0, 'null', 'null', 1),
(3, 3, 0, 'null', 'null', 1),
(4, 4, 0, 'null', 'null', 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=14 ;

--
-- Dumping data for table `table_categories`
--

INSERT INTO `table_categories` (`category_id`, `category_name`, `display_id`, `ref_id`, `category_level`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 'Furniture Fittings and Utensils', NULL, 0, 1, '2017-08-24 18:01:43', '2017-08-24 18:01:43', 1, 1),
(2, 'Electrical & Electronics', NULL, 0, 1, '2017-08-24 18:04:48', '2017-08-24 18:06:45', 1, 3),
(3, 'Electrical & Electronics', NULL, 0, 1, '2017-08-24 18:06:17', '2017-08-24 18:06:17', 1, 1),
(4, 'Automobile', NULL, 0, 1, '2017-08-24 18:07:19', '2017-08-24 18:07:19', 1, 1),
(5, 'Travel and Dineout', NULL, 0, 1, '2017-08-24 18:08:10', '2017-08-24 18:08:10', 1, 1),
(6, 'Health care & Medical', NULL, 0, 1, '2017-08-24 18:10:42', '2017-08-24 18:10:42', 1, 1),
(7, 'Fashion and Fashion Accessories', NULL, 0, 1, '2017-08-24 18:12:27', '2017-08-24 18:12:27', 1, 1),
(8, 'test', NULL, 0, 1, '2017-08-24 18:13:23', '2017-08-24 18:13:38', 1, 3),
(9, ' Household Expenses & Utility Bills', NULL, 0, 1, '2017-08-24 18:17:25', '2017-08-24 18:17:25', 1, 1),
(10, 'Others', NULL, 0, 1, '2017-08-24 18:18:12', '2017-08-24 18:18:12', 1, 1),
(11, 'Personal Catalogue', NULL, 0, 1, '2017-08-24 18:19:01', '2017-08-24 18:19:01', 1, 1),
(12, ' Services( use Urban Clap )', NULL, 0, 1, '2017-08-24 18:20:43', '2017-08-24 18:20:43', 1, 1),
(13, ' Mobile ', NULL, 3, 2, '2017-08-24 18:29:06', '2017-08-24 18:29:06', 1, 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=8 ;

--
-- Dumping data for table `table_cateogry_form`
--

INSERT INTO `table_cateogry_form` (`cateogry_form_id`, `category_id`, `form_element_name`, `form_element_type`, `status_id`) VALUES
(1, 13, 'Model Name', 1, 1),
(2, 13, 'Model Number', 1, 1),
(3, 13, 'IMEI Number', 1, 1),
(4, 13, 'Type', 2, 1),
(5, 13, 'OS', 2, 1),
(6, 13, 'Battery', 2, 1),
(7, 13, 'Sim Type', 2, 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=23 ;

--
-- Dumping data for table `table_cateogry_form_mapping`
--

INSERT INTO `table_cateogry_form_mapping` (`mapping_id`, `cateogry_form_id`, `dropdown_name`, `status_id`) VALUES
(1, 4, 'Smart', 1),
(2, 4, 'Feature', 1),
(3, 4, 'Jio', 1),
(4, 4, 'Others', 1),
(5, 5, 'Android', 1),
(6, 5, 'iOS', 1),
(7, 5, 'Windows', 1),
(8, 5, 'Tizen', 1),
(9, 5, 'Sailfish OS', 1),
(10, 5, ' BlackBerry OS', 1),
(11, 5, ' Symbian', 1),
(12, 5, 'Firefox OS', 1),
(13, 5, ' Bada', 1),
(14, 5, 'webOS', 1),
(15, 5, 'Ubuntu Touch', 1),
(16, 5, 'Others', 1),
(17, 6, 'Removable', 1),
(18, 6, 'Non Removable', 1),
(19, 7, 'Single Sim', 1),
(20, 7, 'Double Sim', 1),
(21, 7, 'Triple Sim', 1),
(22, 7, 'Four Sim', 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_color`
--

CREATE TABLE IF NOT EXISTS `table_color` (
  `color_id` int(11) NOT NULL AUTO_INCREMENT,
  `color_name` varchar(100) NOT NULL,
  `status_id` int(11) NOT NULL,
  PRIMARY KEY (`color_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=7 ;

--
-- Dumping data for table `table_color`
--

INSERT INTO `table_color` (`color_id`, `color_name`, `status_id`) VALUES
(1, 'Red', 1),
(2, 'Black', 1),
(3, 'Blue', 1),
(4, 'Orange', 1),
(5, 'Yellow', 1),
(6, 'Violet', 1);

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
(2, 10, 'BibBill2', 1, '2017-08-22 02:06:06', '2017-08-22 04:10:08', 10, 8, 4),
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
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_amc_copies`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_amc_copies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_amc_id` int(11) NOT NULL,
  `bill_copy_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_amc_exclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_amc_exclusions` (
  `amc_exclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_amc_id` int(11) NOT NULL,
  `exclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`amc_exclusions_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_amc_inclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_amc_inclusions` (
  `amc_inclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_amc_id` int(11) NOT NULL,
  `inclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`amc_inclusions_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=6 ;

--
-- Dumping data for table `table_consumer_bill_copies`
--

INSERT INTO `table_consumer_bill_copies` (`bill_copy_id`, `bill_id`, `bill_copy_name`, `bill_copy_type`, `status_id`) VALUES
(1, 1, '1.PNG', 'PNG', 1),
(2, 1, '2.PNG', 'PNG', 1),
(3, 2, '3.PNG', 'PNG', 1),
(4, 2, '4.PNG', 'PNG', 1),
(5, 3, '5.PNG', 'PNG', 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `table_consumer_bill_details`
--

INSERT INTO `table_consumer_bill_details` (`bill_detail_id`, `user_id`, `consumer_name`, `consumer_email_id`, `consumer_phone_no`, `document_id`, `invoice_number`, `total_purchase_value`, `taxes`, `purchase_date`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 10, 'Pritam', 'pritamparker@gmail.com', '9661086188', 1, '12345', 50000.00, 5000.00, '2017-08-17 00:00:00', '2017-08-24 18:43:45', '2017-08-24 18:43:45', 9, 1);

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_details_copies`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_details_copies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_detail_id` int(11) NOT NULL,
  `bill_copy_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `table_consumer_bill_details_copies`
--

INSERT INTO `table_consumer_bill_details_copies` (`id`, `bill_detail_id`, `bill_copy_id`) VALUES
(1, 1, 1),
(2, 1, 2);

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
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_insurance_copies`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_insurance_copies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_insurance_id` int(11) NOT NULL,
  `bill_copy_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_insurance_exclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_insurance_exclusions` (
  `insurance_exclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_insurance_id` int(11) NOT NULL,
  `exclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`insurance_exclusions_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_insurance_inclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_insurance_inclusions` (
  `insurance_inclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_insurance_id` int(11) NOT NULL,
  `inclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`insurance_inclusions_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `table_consumer_bill_mapping`
--

INSERT INTO `table_consumer_bill_mapping` (`id`, `bill_id`, `bill_ref_type`, `ref_id`) VALUES
(1, 1, 1, 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `table_consumer_bill_products`
--

INSERT INTO `table_consumer_bill_products` (`bill_product_id`, `user_id`, `bill_detail_id`, `product_name`, `master_category_id`, `category_id`, `brand_id`, `color_id`, `value_of_purchase`, `taxes`, `tag`, `status_id`) VALUES
(1, 10, 1, 'iphone 6', 3, 13, 2, 2, 50000.00, 5000.00, 'Phone', 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=8 ;

--
-- Dumping data for table `table_consumer_bill_product_meta_data`
--

INSERT INTO `table_consumer_bill_product_meta_data` (`id`, `bill_product_id`, `cateogry_form_id`, `form_element_value`) VALUES
(1, 1, 1, 'iphone'),
(2, 1, 2, '6'),
(3, 1, 3, '1234567812346789'),
(4, 1, 4, '1'),
(5, 1, 5, '6'),
(6, 1, 6, '18'),
(7, 1, 7, '19');

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
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_repair_copies`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_repair_copies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_repair_id` int(11) NOT NULL,
  `bill_copy_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `table_consumer_bill_seller_mapping`
--

INSERT INTO `table_consumer_bill_seller_mapping` (`bill_seller_info_id`, `bill_detail_id`, `ref_type`, `seller_ref_id`) VALUES
(1, 1, 1, 1);

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
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_warranty_copies`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_warranty_copies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_warranty_id` int(11) NOT NULL,
  `bill_copy_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_warranty_exclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_warranty_exclusions` (
  `warranty_exclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_warranty_id` int(11) NOT NULL,
  `exclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`warranty_exclusions_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `table_consumer_bill_warranty_inclusions`
--

CREATE TABLE IF NOT EXISTS `table_consumer_bill_warranty_inclusions` (
  `warranty_inclusions_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_warranty_id` int(11) NOT NULL,
  `inclusions_id` int(11) NOT NULL,
  PRIMARY KEY (`warranty_inclusions_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

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
(1, 9, 1, NULL, '2017-08-24 18:36:10', '2017-08-24 18:36:10', 1, 6);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_list_of_exclusions`
--

INSERT INTO `table_list_of_exclusions` (`exclusions_id`, `category_id`, `exclusions_name`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 13, 'Battery', '2017-08-24 18:34:17', '2017-08-24 18:34:17', 1, 1),
(2, 13, 'Earphone', '2017-08-24 18:34:32', '2017-08-24 18:34:32', 1, 1),
(3, 13, 'Charger', '2017-08-24 18:35:00', '2017-08-24 18:35:00', 1, 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_list_of_inclusions`
--

INSERT INTO `table_list_of_inclusions` (`inclusions_id`, `category_id`, `inclusions_name`, `created_on`, `updated_on`, `updated_by_user_id`, `status_id`) VALUES
(1, 13, 'Battery', '2017-08-24 18:35:19', '2017-08-24 18:35:19', 1, 1),
(2, 13, 'Charger', '2017-08-24 18:35:25', '2017-08-24 18:35:25', 1, 1),
(3, 13, 'Motherboard', '2017-08-24 18:35:40', '2017-08-24 18:35:40', 1, 1);

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
(1, 'Flipkart', 'www.flipkart.com', '', 1),
(2, 'Snapdeal', 'www.snapdeal.com', '', 1),
(3, 'Amazon', 'www.amazon.com', 'null', 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `table_online_seller_details`
--

INSERT INTO `table_online_seller_details` (`seller_detail_id`, `seller_id`, `contactdetail_type_id`, `display_name`, `details`, `status_id`) VALUES
(1, 1, 0, '', '', 1),
(2, 2, 0, '', '', 1),
(3, 3, 0, 'null', 'null', 1);

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=6 ;

--
-- Dumping data for table `table_token`
--

INSERT INTO `table_token` (`id`, `token_id`, `user_id`, `created_on`, `expiry_on`) VALUES
(1, 'Q4k4hePma7KZ2LPK9GnwNAfub', 1, '2017-08-01 16:09:40', '2017-08-01 16:09:40'),
(2, '95CLTCfeXeQf9yq96YPYIXWli', 9, '2017-08-10 15:32:32', '2017-08-10 15:32:32'),
(3, 'lFFg5ZjCBAcrqde5AR5cq1CIu', 8, '2017-08-10 16:41:52', '2017-08-10 16:41:52'),
(4, 'Ub3KxSEoPsycRjMd6ZljqcjcU', 11, '2017-08-18 15:17:54', '2017-08-18 15:17:54'),
(5, 'osaue2LZqEC7uRzfEhatLxJZ5', 13, '2017-08-24 17:23:29', '2017-08-24 17:23:29');

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
