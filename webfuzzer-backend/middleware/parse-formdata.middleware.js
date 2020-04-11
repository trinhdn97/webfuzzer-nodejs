const formidable = require('formidable');
const { PassThrough } = require('stream');
const config = require('../globalConfig');
const toArray = require("stream-to-array");

module.exports = function (req, res, next) {
  const form = new formidable.IncomingForm();
  form.maxFileSize = config.maxFileSize;
  const pass = new PassThrough()
  const fields = {};
  form.onPart = part => {
    if (!part.filename) {
      form.handlePart(part)
      return
    }
    let file = part.name;
    let data = { file: {} };

    data.file.name = part.filename
    data.file.type = part.mime
    part.on('data', function (buffer) {
      pass.write(buffer)
    })
    part.on('end', function () {
      pass.end();
      data.data = pass;
      fields[file] = data;
    })
  }
  form.parse(req, function (err, body, files) {
    if (err) {
      throw err;
    }
    req.body = { ...body, ...fields }
    next();
  });
} 
