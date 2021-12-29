if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require('ejs-mate')
const Campground = require('./models/campground');
const methodOverride = require('method-override');
const campground = require("./models/campground");
const {campgroundSchema, reviewSchema} = require('./schemas');
const catchAsync = require("./utils/catchAsync");
const expressError = require('./utils/ExpressError');
const Review = require('./models/review');
const session= require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

const userRoutes = require('./routes/users')
const campgroundRoutes = require('./routes/campgrounds')
const reviewRoutes = require('./routes/reviews')


mongoose.connect("mongodb://localhost:27017/yelp-camp", {
    useNewUrlParser: true,
    useCreateIndex:true,
    useUnifiedTopology: true,
    useFindAndModify: false
  });

const db = mongoose.connection;
db.on("error",console.error.bind(console,"connection error!"));
db.once("open",()=>{
    console.log("DB Connected!");
});


app.engine('ejs',ejsMate);
app.set('useFindAndModify', false);
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname,'public')));
app.set('view engine','ejs')
app.set("views", path.join(__dirname, "views"));

const sessionConfig = {
    secret : 'hello!',
    resave: false,
    saveUninitialized: true,
    cookie : {
        expires: Date.now() +1000*60*60*24*7, //Date.now() returns date in milliseconds, we want 7 day cookie
        maxAge : 1000*60*60*24*7
    }
}
app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const validateCampground = (req,res,next) =>{
    const {error} = campgroundSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',');
        throw new expressError(msg,400);
    }
    else next()
}

const validateReview = (req,res,next) =>{
    const {error} = reviewSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',');
        throw new expressError(msg,400);
    }
    else next()
}

app.use((req,res,next)=>{
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.use('/', userRoutes);
app.use('/campgrounds/:id/reviews',reviewRoutes);
app.use('/campgrounds', campgroundRoutes);

app.get('/',(req,res)=>{
    res.render('home')
})

app.all('*',(req,res,next)=>{
    next(new expressError('Page Not Found',404))
})

app.use((err,req,res,next)=>{
    const {statusCode=500} = err;
    if(!err.message) err.message='Something went wrong!';
    res.status(statusCode).render('error',{err})
})

app.listen(3000,()=>{
    console.log('Serving on Port 3000!')
})

