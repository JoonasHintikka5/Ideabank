// load the things we need
var mongoose = require('mongoose');

// define the schema for our ideas model
var ideasSchema = mongoose.Schema({
		name: String,
		date: Date,
		filename: String,
		path: String,
		data: Buffer,
		contentType: String,
		img: [{filename: String, data: Buffer, contentType: String}], // How to upload multiple images from array?
		idea: String
	});

module.exports = mongoose.model('Idea', ideasSchema);