const express = require('express');  
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const dotenv = require('dotenv');
const passport = require('passport'); // adding passport
const LocalStrategy = require('passport-local').Strategy; // adds a strategy called Passport Local
const flash = require('connect-flash'); // gives error messages to Passport
const ensureLogin = require('connect-ensure-login');

const path = require('path');

const PORT = process.env.PORT || 9000;
const app = express();
dotenv.config();

app.set("view engine", "ejs");   

app.use(express.static(path.join(__dirname, 'public'))); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded( {extended: true} ));
app.use(require('express-session')({ 
    //REQUIRED key value pair - This is the secret used to sign the session ID cookie. This can be either a string for a single secret, or an array of multiple secrets. Before production, this should be secret: process.env.SESSION_SECRET. Real code should be in .env file
    secret: 'keyboard cat', 
    // optional key/value pair - Forces the session to be saved back to the session store, even if the session was never modified during the request. 
    resave: false, 
    // optional key/value pair - Forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified. Choosing false is useful for implementing login sessions, reducing server storage usage, or complying with laws that require permission before setting a cookie. Choosing false will also help with race conditions where a client makes multiple parallel requests without a session.
    saveUninitialized: false 
  }));
  app.use(flash()); // using connect-flash to show error messages
  
// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize()); // middleware is required to initialize Passport
app.use(passport.session()); // needed if the app is persistent login sessions (MongoDB)

// Declare any constants or variables here for Database
let db_handler;
const DB_URL = process.env.DB_URL;
// const DB_URL = process.env.DB_URL;
const DB_NAME = process.env.DB_NAME;
const USER_COLLECTION = process.env.USER_COLLECTION;
const EVENT_COLLECTION = process.env.EVENT_COLLECTION;
const ADMIN_COLLECTION = process.env.ADMIN_COLLECTION;

app.listen(PORT, () => {
    console.log(`Server Started on Port: ${PORT}`);
    // create connection to our database
    let mongo_client = mongodb.MongoClient;
    mongo_client.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db_client) => {
        if(err) {
            console.log("ERROR:" + err);
        } else {
            // Upon success, print a message saying "Database Connected"
            console.log("MONGODB DATABASE CONNECTED");
            // Upon success, you should also connect to the 'bsj' database.
            // Use db_handler for future use
            db_handler = db_client.db(DB_NAME);
        }
    })
});

// GET, GET, POST, GET, GET, PUT, DELETE
app.get('/', (req, res) => { 
    res.render('index', { 
        thanks: req.query.thanks

    });
});
// for login
app.get('/login',
(req, res) => {
  res.render('login');
});

app.post('/login', 
// passport.authenticate with the local strategy will handle the login request.
  passport.authenticate('local', {
    failureRedirect: '/login', 
    successRedirect: '/admin',
    failureFlash: true // NEW! this will turns on the error message for connect-flash
  })
);

app.get('/register', ensureLogin.ensureLoggedIn(), (req, res) => {
  res.render('register');
});


// This is also for registering
app.post('/admin', (req, res) => {
  const form_data = req.body;
  const username = form_data['username'];
  const password = form_data['password']
  const displayName = form_data['displayname']
  const email = form_data['email']

  const my_object = {
      username: username,
      password: password,
      displayname: displayName,
      email: email
  }
  
// validation starts here
// if (username.length < 8) {
//     res.send("Username cannot be less than 8 charaters.")
// }
// if (password.length <8) {
//     res.send("Password cannot be less than 8 charaters.")
// }
// if (email.length <10) {
//     res.send("Email cannot be less than 10 charaters.")
// }

// validation ends here
  db_handler.collection(ADMIN_COLLECTION).insertOne(my_object, (err, result) => {
  
    if (err) {
            console.log(result);
          console.log("Error: " + err);
      }
      else {

          console.log("One Entry Added");
          console.log(`Entry ${result}`)
          res.redirect('/register');
      }
  });
});
  
app.get('/logout',
  (req, res) => {
    req.logout();
    res.redirect('/');
});

  // connect-ensure-login is a middleware ensures that a user is logged in. If a request is received that is unauthenticated, the request will be redirected to a login page. The URL will be saved in the session, so the user can be conveniently returned to the page that was originally requested.
  app.get('/profile', ensureLogin.ensureLoggedIn(),
  (req, res) => {
      console.log(req.user.cmd.query);
    db_handler.collection(ADMIN_COLLECTION).find({username: req.user.cmd.query.username}).toArray((err, user) => {
      if(err) return console.log(err)
      let userObject = user[0]
      console.log(userObject)
      if(user) res.render('profile',{user: userObject})
    })
   
  });

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new LocalStrategy(
    (username, password, done) => {
     
      db_handler.collection(ADMIN_COLLECTION).find({username: username}).toArray((err, user) => {
        if(err){
          return err;
        }
        if(!user){
          return done(null, false);
        }
        if(user[0].password != password) {
          return done(null, false);
        }
        let userObject = user[0];
  
        if(user) {
          return done(null, userObject)
        }
      })
    }
  ));
  
  
  
  
// ROUTE FOR USER ENTRIES STARTS HERE >>>>>>>>>>>>>>>>>>>>>>>>>>>>

app.post('/add', (req, res) => {
    // Do something here with your request body
    const form_data = req.body;
    console.log(req.body);

    const userFirstName = form_data['userFirstName'];
    const userLastName = form_data['userLastName'];
    const userEmail = form_data['userEmail'];
    const userPhoneNumber = form_data['userPhoneNumber'];
    const userAddress = form_data['userAddress'];
    const userCity = form_data['userCity'];
    const userState = form_data['userState'];
    const userZipcode = form_data['userZipcode'];
    const HearAboutUs = form_data['HearAboutUs'];
    const userComment = form_data['userComment'];

    const user_obj = {
        userFirstName: userFirstName,
        userLastName: userLastName,
        userEmail: userEmail,
        userPhoneNumber: userPhoneNumber,
        userAddress: userAddress,
        userCity: userCity,
        userState: userState,
        userZipcode: userZipcode,
        HearAboutUs: HearAboutUs,
        userComment: userComment
    }
    console.log(user_obj);
// validation starts here
    // if (userFirstName.length <2 || userFirstName.length >20) {
    //     res.send("First name must be between 2-20 characters.")
    // }
    // if (userLastName.length <2 || userLastName.length > 15) {
    //     res.send("Last name must be between 2-20 characters.")
    // }
    // if (userEmail.length < 10) {
    //     res.send("Email Cannot be < 10 characters.");
    // }
    // if (userPhoneNumber.length < 10 || userPhoneNumber.length > 10) {
    //     res.send("Phone number must be 10 digits long.")
    // }
    // if (userAddress.length < 7) {
    //     res.send("Address cannot be less than 7 characters.")
    // }
    // if (userCity.length <5) {
    //     res.send("City cannot be less than 4 characters.")
    // }
    // if (userState.length < 2 || userState.length > 2) {
    //     res.send("State must be 2 characters.")
    // }
    // if (userZipcode.length < 5 || userZipcode.length > 5) {
    //     res.send("Zip code must be 5 characters.")
    // }    
    // if (userComment.length <10) {
    //     res.send("Comment must be at least 10 characters.")
    // }

// Validation ends herr
    db_handler.collection(USER_COLLECTION).insertOne(user_obj, (error, result) => {
        if (error) {
            console.log(error);
        }else {
            console.log("A USER ENTRY HAS BEEN ADDED");
            // send response to browser once we are done with db
            // redirect sends client to a specified route.
            
            // redirect me to this path
            res.redirect('/?thanks=yes#HearAboutUs');
            
        }
    })
});


// ADMIN ROUTES START HERE>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// This route shows 4 links ADD EEVENT, UPDATE EVENT, DELEDT EVENT, and SEE USER ENTRIES
app.get('/admin', ensureLogin.ensureLoggedIn(),
(req, res) => { 
    db_handler.collection(ADMIN_COLLECTION).find({username: req.user.username}).toArray((err, user) => {
        if(err) return console.log(err)
        if(user) res.render('admin')
      })
  
});

// This route goes shows all user entries in the link "see user entries" 
app.get('/admin/user_entries', ensureLogin.ensureLoggedIn(),(req, res) => {
    

    db_handler.collection(USER_COLLECTION).find({}).toArray( (error, result) => {
        if (error) {
            console.log(error);
        }else {
            console.log("");
        // render this .ejs file
            res.render('user_entries', {
            all_users: result
            })
        }
    });
});


// This route gets to the form for adding an event + event list below it
app.get('/admin/add_event', ensureLogin.ensureLoggedIn(),(req, res) => { 

    db_handler.collection(EVENT_COLLECTION).find({}).toArray( (err, result)=> {
        if (err) {
            console.log(err);
        }
        else {
            // console.log(result);
            // render it to show the page with specified info on it. (IT IS NOT A ROUTE!)
            res.render('add_event', {
            'all_events': result
        });
        }
    });
});

// This route shows a page with nothing but the event name and it's details
app.get('/admin/event_details/:event_id', ensureLogin.ensureLoggedIn(), (req, res) => { 

    const parameters = req.params;
    // converted into an object Id for mongo db compass
    const event_id = mongodb.ObjectId(parameters['event_id']); 

    db_handler.collection(EVENT_COLLECTION).find({_id: event_id}).toArray( (err, result) => {
        if (err) {
            res.send("EVENT NOT FOUND!");
            console.log(err);
        }
        else{
            // render it to show the page with specified info on it. (IT IS NOT A ROUTE!)
            res.render('event_details', {
            event: result[0]
            });
        }
    });
});

    // This link posts new events in several places (below the addd event form, on events.ejs page, and update event page)
app.post('/add_event', (req, res) => { 

    const form_data = req.body;
    console.log(req.body);

    const event_name = form_data['eventName'];
    const event_date = form_data['eventDate'];
    const event_time = form_data['eventTime'];
    const event_location = form_data['eventLocation'];
    const event_additionalInfo = form_data['eventAdditionalInfo'];

    const event_obj = {
        event_name: event_name,
        event_date: event_date, 
        event_time: event_time,
        event_location: event_location,
        event_additionalInfo: event_additionalInfo
    }
    console.log(event_obj);
// validation starts here
// if (event_name.length < 8) {
//     res.send("Username cannot be less than 8 charaters.")
// }
// if (event_location.length < 10) {
//     res.send("Location or address cannot 10 charaters.")
// }


// validation ends here
    db_handler.collection(EVENT_COLLECTION).insertOne(event_obj, (error, result) => {
        if (error) {
            console.log(error);
        }else {
            console.log("AN EVENT HAS BEEN ADDED");
            // send response to browser once we are done with db
            // redirect sends client to a specified route.
            res.redirect('/admin/view_events');
        }
    })
});
// This route shows a list of events that can be updated or deleted
app.get('/admin/update_event', ensureLogin.ensureLoggedIn(),(req, res) => { 

    db_handler.collection(EVENT_COLLECTION).find({}).toArray( (err, result) => {
        if (err) {
            res.send("");
            console.log(err);
        }
        else {
        res.render('event_name', {
            'all_events': result
            });
        }
    });
});
// This route shows an individual event with the option of updating or deleting it (once the form is submitted eventually want it to post events to the events.ejs as well)
app.get('/admin/update_event/:event_id', ensureLogin.ensureLoggedIn(), (req, res) => {

    const parameters = req.params;
    // converted into an object Id for mongo db compass
    const event_id = mongodb.ObjectId(parameters['event_id']); 

    db_handler.collection(EVENT_COLLECTION).find({_id: event_id}).toArray( (err, result) => {
        if (err) {
            res.send("EVENT NOT FOUND!");
            console.log(err);
        }
        else{
            res.render('indv_event', {
                event: result[0]
            });
        }
    });
});

// This route UPDATES an event and then redirects to the same page.
app.post('/update_event/:event_id', (req, res)  => {

    const parameters = req.params;
    const event_id = mongodb.ObjectId(parameters['event_id']); 

    const form_data = req.body;
    console.log(req.body);

    const event_name = form_data['eventName'];
    const event_date = form_data['eventDate'];
    const event_time = form_data['eventTime'];
    const event_location = form_data['eventLocation'];
    const event_additionalInfo = form_data['eventAdditionalInfo'];

    const new_values = {$set: {event_name: event_name, event_date: event_date, event_time: event_time, event_location: event_location, event_additionalInfo: event_additionalInfo}};
// validation starts here
// if (event_name.length < 8) {
//     res.send("Username cannot be less than 8 charaters.")
// }
// if (password.length <8) {
//     res.send("Password cannot be less than 8 charaters.")
// }
// if (event_location.length < 10) {
//     res.send("Location or address cannot 10 charaters.")
// }


// validation ends here

    db_handler.collection(EVENT_COLLECTION).updateOne({_id: event_id}, new_values, (err, result) => {
        if (err) {
            res.send("Could not update the event");
            console.log(err);
        } else {
            console.log(result);
        
        res.redirect('/admin/update_event/' + event_id);
        }
    });
});

// This route will delete the event and redirect to the page with the list of events
app.get('/update_event/delete/:event_id', (req, res) => {

    const parameters = req.params;
    const event_id = mongodb.ObjectId(parameters['event_id']); 

    db_handler.collection(EVENT_COLLECTION).deleteOne({_id: event_id}, (err, result) => {
        if (err) {
            res.send("Could not delete the event");
            console.log(err);
        }
        else {
            console.log(result);
            res.redirect('/admin');
        }
    });
});

// This route shows a list of all the events
app.get('/admin/view_events', ensureLogin.ensureLoggedIn(),(req, res) => {

    db_handler.collection(EVENT_COLLECTION).find({}).toArray( (err, result) => {
        if (err) {

            console.log(err);
        } else {
            console.log(result);
        res.render('view_events', {
            'all_events': result
            });
        }
    });
});

// for the events page>>>>>>>>>>>>>>>
// This route shows all events on the events.ejs page

app.get('/events', (req, res) => {
    db_handler.collection(EVENT_COLLECTION).find({}).toArray( (err, result) => {
        if (err) {

            console.log(err);
        }
        else {
            console.log(result);
        res.render('events', {
            'all_events': result
            });
        }
    });
});





  // Configure Passport authenticated session persistence.
  //
  // In order to restore authentication state across HTTP requests, Passport needs
  // to serialize users into and deserialize users out of the session.  The
  // typical implementation of this is as simple as supplying the user ID when
  // serializing, and querying the user record by ID from the database when
  // deserializing.
  passport.serializeUser((user, done) => {
    done(null, user.username);
  });
  
  passport.deserializeUser((username, done) => {
    db_handler.collection(ADMIN_COLLECTION).find({username: username}, function(err, username) {
        done(err, username);
      });
  }); 
