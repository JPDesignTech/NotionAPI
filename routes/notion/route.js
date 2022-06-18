"use strict";

const express = require("express");
const router = express.Router();

// const verify = require('../../modules/verify');
const controller = require("./controller");

router.post("/notion", controller.createNotionTask);

module.exports = router;
