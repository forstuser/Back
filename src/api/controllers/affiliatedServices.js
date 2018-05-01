/*jshint esversion: 6 */
'use strict';

// create adapter for this controller
import AffiliatedServicesAdaptor from "../Adaptors/affiliatedServices";

let modals;
let affiliatedServicesAdaptor;

export default class affiliatedServicesController {
    constructor(modal) {
        modals = modal;
        affiliatedServicesAdaptor = new AffiliatedServicesAdaptor(modals);
    }

}