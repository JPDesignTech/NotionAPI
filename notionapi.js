"user strict";

const express = require("express");
const parser = require("body-parser");
const logger = require("logger");
const cors = require("cors");

const NotionAPI = express();

const env = process.env.NODE_ENV;
let config;

switch (env) {
  case "production":
    config = require("./config/production");
    NotionAPI.use(https());
    break;
  case "development":
    config = require("./config/development");
    break;
  default:
    config = require("./config/development");
    break;
}

NotionAPI.parser.urlencoded({ extended: false });
NotionAPI.use(parser.json());
NotionAPI.use(cors());

const routes = {
  home: {
    get: require("./routes/home/get.js"),
  },
  notion: {
    db: require("./routes/notion/route"),
  },
};
