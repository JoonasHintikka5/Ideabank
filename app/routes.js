module.exports = function(app, passport, db) {

	var fs = require('fs');
	var multer = require('multer');
	var ObjectId = require('mongodb').ObjectID;
	var Idea = require('../app/models/ideas');

	// Global variables
	var name = "";
	var modifiedText = "";
	
	
	var Storage = multer.diskStorage({
		destination: function(req, file, callback) {
			callback(null, "./images/");
		},
		filename: function(req, file, callback) {
			callback(null, name + "_" + file.originalname);
		}
	});

	var upload = multer({
		 storage: Storage
	 }).array("images", 3); //Field name and max count
	
	function createImagePath(path, username) {
		
		var alku = path.substring(0, 7);
		var loppu = path.substring(7, path.length);
		var newPath = alku + username + "\\" + loppu;
		
		console.log("newPath: " + newPath);
		console.log("path: " + path);
		console.log("username: " + username);
		
		return newPath;
	}
	
	// =====================================
    // Get ideas to show in profile view ===
    // =====================================
	function getIdeas(res, query) {
	name = query.name;
	
	db.collection("ideas").find(query).toArray(function(err, ideas) {
		if (err) throw err;
		console.log("testi");
		res.render('profile.ejs', {title: "Ideas", ideas: ideas}, function(err, html){
			if (err) {
				console.log('error rendering html template:', err) 
				return
			} else {
				console.log("testing");
			}
			res.send(html);
		});
	});
}

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });

    // process the login form
    // app.post('/login', do all our passport stuff here);
	// process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    // app.post('/signup', do all our passport stuff here);
	app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        /*res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });*/
		console.log("user: " + req.user.local.username);
		var query = { name: req.user.local.username };
		getIdeas(res, query);
    });
	
	app.post('/profile', upload, function (req, res) {
	  console.log(req.body.datasaved);
	  console.log(req.body._id);
	  if (req.body._id !== undefined) { // Delete db object based on objectId.
		
		console.log(req.body._id);
		var item = { "_id" : ObjectId(req.body._id) }
		db.collection("ideas").deleteOne(item, function(err, obj) {
			if (err) throw err;
			console.log("1 document deleted");
			var query = { name: name };
			getIdeas(res, query);
		});
		  
	  } else if (req.body.datasaved !== undefined && req.files.length === 0) { // If there are no files to be saved to db.
			var newItem = new Idea();
			newItem.name = name;
			newItem.idea = req.body.datasaved;
			newItem.date = new Date();
			newItem.save(function (err, product, numAffected) {
				if (err) throw err;
				
				var query = { name: name };
				getIdeas(res, query);
			});
	  } else if (req.files !== undefined) { // If user has chosen files to be saved to db.
		console.log(req.files);
		var newItem = new Idea();
		newItem.name = name;
		newItem.idea = req.body.datasaved;
		newItem.date = new Date();
		for (var i = 0; i < req.files.length; i++) {
			console.log("Filename: " + req.files[i].filename);
			//newItem.filename = req.files[0].filename;
			var img = { filename: req.files[i].filename, data: fs.readFileSync(String(req.files[i].path)), contentType: "image/jpeg"};
			newItem.img[i] = img;
		} // Multiple images to save
		newItem.filename = req.files[0].filename;
		newItem.path = req.files[0].path; //createImagePath(req.files[0].path, name);
		newItem.contentType = "image/jpeg" //req.files[0].mimeType;
		newItem.data = fs.readFileSync(String(req.files[0].path));
		
		newItem.save(function (err, product, numAffected) {
			if (err) throw err;
			
			var query = { name: name };
			getIdeas(res, query);
		});
		  
	  }
	});
	
	// =====================================
    // Ideabank edit site ========
    // =====================================
    app.get('/edit', function(req, res) {
		console.log(req.query);
		Idea.findById(req.query._id, function (err, idea) {
			if (err) throw err;
			modifiedText = idea.idea;
			res.render('edit.ejs', {title: "Ideas", idea: idea}, function(err, html){
			if (err) {
				console.log('error rendering html template:', err) 
				return
			} else {
				console.log("testing edit");
			}
			res.send(html);
		});
		});
    });
	
	app.post('/edit', function(req, res) {
		console.log(req.body.datasaved);
		console.log(req.body._id);
		
		if (modifiedText === req.body.datasaved)
			return;
		
		Idea.update({ _id: req.body._id }, { $set: { idea: req.body.datasaved }}, function (err, idea) {
		  if (err) throw err;
		  console.log("IDEAA: " + idea);
		  console.dir(idea);
		  modifiedText = req.body.datasaved;
		  /*res.render('edit.ejs', {title: "Ideas", idea: idea}, function(err, html){
				if (err) {
					console.log('error rendering html template:', err) 
					return
				} else {
					console.log("testing edit");
				}
				res.send(html);
			});*/
			
			Idea.findById(req.body._id, function (err, idea) {
				if (err) throw err;
				res.render('edit.ejs', {title: "Ideas", idea: idea}, function(err, html){
					if (err) {
						console.log('error rendering html template:', err) 
						return
					} else {
						console.log("testing edit");
					}
					res.send(html);
				});
			});
		});
		
		
	});
	
	// =====================================
	// Get idea picture ====================
	// =====================================
	app.get('/images/:filename', function(req,res,next) {
		console.log(req.params);
		itemCount = 0;	
	  Idea.find( {'img.filename': req.params.filename}, function(err,item) {
		  if (err) return next(err);
		  console.log(item);
		  //res.contentType(item[0].img[0].contentType);
		  //res.send(item[0].img[0].data);
		  console.log("BEFORE itemCount: " + itemCount);
		  res.contentType(item[0].img[itemCount].contentType);
		  res.send(item[0].img[itemCount].data);
		  itemCount ++;
		  console.log("itemCount: " + itemCount);
		  
	  });
	});

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
