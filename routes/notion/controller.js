// const logger = require('../../modules/logger');

// const Firebase = require('firebase-admin');
// const firebase = Firebase.database();
// const { sendMessage } = require('./module');

const createNotionTask = async (req, res) => {
  return res.status(200).send({ message: "success" });
};

module.exports = {
  createNotionTask,
};
