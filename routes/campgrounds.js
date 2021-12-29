const express = require('express');
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const expressError = require('../utils/ExpressError');
const Campground = require('../models/campground');
const { campgroundSchema } = require('../schemas.js');
const {isLoggedIn,isAuthor, validateCampground} = require('../middleware');
const multer = require('multer');
const {storage} = require('../cloudinary');
const upload = multer({storage});

router.get('/',catchAsync(async(req,res)=>{
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index',{campgrounds});
}))

router.get('/new', isLoggedIn,(req,res)=>{
    res.render('campgrounds/new')
})

router.get('/:id',catchAsync(async(req,res)=>{
    const campground =  await Campground.findById(req.params.id).populate({
        path:'reviews',
        populate:{
            path:'author' //populate author of review
        }
    }).populate('author');//populate author of campground
    if(!campground){
        req.flash('error', 'Campground not found!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show',{campground});
}))

router.get('/:id/edit',isLoggedIn,isAuthor,catchAsync(async(req,res)=>{
    const {id} = req.params;
    const campground = await Campground.findById(id);
    if(!campground){
        req.flash('error', 'Campground not found!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit',{campground});
}))


router.post('/',isLoggedIn,upload.array('image'),validateCampground,catchAsync(async (req,res,next)=>{
    //if(!req.body.campground) throw new ExpressError('Invalid Campground Data',400)
    const campground = new Campground(req.body.campground);
    campground.images = req.files.map(f=>({url: f.path, filename:f.filename}));
    campground.author = req.user._id;
    await campground.save();
    req.flash('success','Successfully made a new campground');
    res.redirect(`/campgrounds/${campground._id}`)
}))

router.put('/:id',isLoggedIn,isAuthor,validateCampground,catchAsync(async (req,res)=>{
    const {id} = req.params;
    const campground = await Campground.findByIdAndUpdate(id,{...req.body.campground})
    req.flash('success','Successfully updated the campground');
    res.redirect(`/campgrounds/${campground._id}`);
}))

router.delete('/:id',isLoggedIn,isAuthor,catchAsync(async (req,res)=>{
    const {id} = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success','Campground deleted!');
    res.redirect('/campgrounds');
}))

module.exports = router;
