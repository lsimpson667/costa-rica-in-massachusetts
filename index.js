const express = require('express');  
const app = express();	          
const bodyParser = require('body-parser');
const path = require('path');
const mongodb = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 9000;

app.set("view engine", "ejs");   

app.use(express.static(path.join(__dirname, 'public'))); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded( {extended: true} ));

// Declare any constants or variables here for Database
let db_handler;
// const DB_URL = "mongodb://localhost:27017";
const DB_URL = process.env.DB_URL;
const DB_NAME = process.env.DB_NAME;
const USER_COLLECTION = process.env.USER_COLLECTION;
const EVENT_COLLECTION = process.env.EVENT_COLLECTION;

app.listen(PORT, () => {
    console.log(`Server Started on Port: ${PORT}`);
    // create connection to our database
    mongo_client = mongodb.MongoClient;
    mongo_client.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db_client) => {
        if(err) {
            console.log("ERROR:" + err);
        } else {
            // Upon success, print a message saying "Database Connected"
            console.log("DATABASE CONNECTED");
            // Upon success, you should also connect to the 'bsj' database.
            // Use db_handler for future use
            db_handler = db_client.db(DB_NAME);
        }
    })
});

// GET, GET, POST, GET, GET, PUT, DELETE
app.get('/', (request, response) => { 
    
    response.render('index', { 
        
    });
});

app.get('/events', (request, response) => { 
    
    response.render('events', { 
        
    });
});



app.post('/add', (req, res) => {
    // Do something here with your request body
    const form_data = req.body;
    console.log(req.body);

    const userFirstName = form_data['userFirstName'];
    const userLastName = form_data['userLastName'];
    const userEmail = form_data['userEmail'];
    const userPhoneNumber = parseInt(form_data['userPhoneNumber']);
    const userAddress = form_data['userAddress'];
    const userCity = form_data['userCity'];
    const userState = form_data['userState'];
    const userZipcode = form_data['userZipcode'];
    const HearAboutUs = form_data['HearAboutUs'];
    const userComment = form_data['userComment'];

    const user_obj = {
        userFirstName: userFirstName,
        userLastName: userLastName,
        userPhoneNumber: userPhoneNumber,
        userPhoneNumber: userPhoneNumber,
        userAddress: userAddress,
        userCity: userCity,
        userState: userState,
        userZipcode: userZipcode,
        HearAboutUs: HearAboutUs,
        userComment: userComment
    }
    console.log(user_obj);

    db_handler.collection(USER_COLLECTIONS).insertOne(user_obj, (error, result) => {
        if (error) {
            console.log(error);
        }else {
            console.log("A USER ENTRY HAS BEEN ADDED");
            // send response to browser once we are done with db
            // redirect sends client to a specified route.
            res.redirect('/#submit-container');
        }
    })
});

// ADMIN ROUTES>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

app.get('/admin', (request, response) => { 
    
    response.render('admin', { 
        
    });
});

app.get('/admin/add_event', (request, response) => { 
    
    db_handler.collection(EVENT_COLLECTION).find({}).toArray( (err, result)=> {
        if (err) {
            console.log(err);
        }
        else {
            // console.log(result);
            // render it to show the page with specified info on it. (IT IS NOT A ROUTE!)
            response.render('add_event', {
            'all_events': result 
        });
        }
    });
});


app.post('/admin/add_event', (request, response) => { 
    const form_data = request.body;
    console.log(request.body);

    const event_name = form_data['eventName'];
    const event_date = form_data['eventDate'];
    const event_time = form_data['eventTime'];
    const event_location = form_data['eventLocation'];

    const event_obj = {
        event_name: event_name,
        event_date: event_date, 
        event_time: event_time,
        event_location: event_location
    }
    console.log(event_obj);

    db_handler.collection(EVENT_COLLECTION).insertOne(event_obj, (error, result) => {
        if (error) {
            console.log(error);
        }else {
            console.log("AN EVENT HAS BEEN ADDED");
            // send response to browser once we are done with db
            // redirect sends client to a specified route.
            response.redirect('/admin/add_event');
        }
    })
});

// // admin route
// app.get('/admin/:update_event', (request, response) => { 
//     const parameters = req.params;
//     const update_event = parameters['update_event']; // render it to show the page with specified info on it. (IT IS NOT A ROUTE!)

//     db_handler.collection(EVENT_COLLECTION).find({update_event: update_event}).toArray( (err, result) => {
//         if (err) {
//             res.send("Company not found");
//             console.log(err);
//         }
//         else {
//         res.render('company', {
//             'single_company': result[0]
//         });
//         }
//     });