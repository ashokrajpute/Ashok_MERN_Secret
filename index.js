//jshint esversion:6
require('dotenv').config()
// console.log(process.env) 
const express =require('express');
const bodyparser=require('body-parser');
const mongoose =require('mongoose');
var encrypt = require('mongoose-encryption');
var md5 = require('md5');
var session =require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-Local-Mongoose");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate'); 

//console.log(md5('message'));

var app=express();
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended:true}));
app.use(session({
  secret:"our little secret.",
  resave:false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

 mongoose.connect('mongodb+srv://ashok2468rajpute:R%40jpute8642%40shok@cluster0.rk3xxlh.mongodb.net/UserDB');

let userSchema=new mongoose.Schema({
   email: String,
   password: String,
   googleId: String,
   secret: String

});
//var sec = "Thisisourlittlesecret.";

//userSchema.plugin(encrypt, { secret: sec ,encryptedFields: ['password'] });
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
let userModel=new mongoose.model('secrets',userSchema);

passport.use(userModel.createStrategy());
//passport.serializeUser(userModel.serializeUser());
//passport.deserializeUser(userModel.deserializeUser());
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    console.log(user.id);
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    console.log("===");
    console.log(user);
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  //console.log(profile);
  userModel.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));


app.get('/',function(req,res){
res.render('home.ejs');
});
app.get('/register',function(req,res){
res.render('register.ejs');
});
app.get('/login',function(req,res){
res.render('login.ejs');
});

app.get('/auth/google',
passport.authenticate('google', { scope: ['profile'] })
);
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/secrets",async function(req,res){
// if(req.isAuthenticated()){
//   res.render("secrets.ejs");
// }
// else{
//   res.redirect("/login");
// }
var d=await userModel.find({"secret":{$ne:null}});
console.log(d);
res.render("secrets.ejs",{data:d});
});
app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit.ejs");
  }
  else{
    res.redirect("/login");
  }
  });
  app.post("/submit",async function(req,res){
    var s=req.body.secret;
    
 var c=await userModel.findById(req.user.id);
 c.secret=s;
 c.save();
 //console.log(c);
  res.redirect("/secrets")
    });

app.get("/logout",function(req,res){
//req.logout();
//res.redirect('/');
req.logout(function(err) {
  if (err) { return next(err); }
  res.redirect('/');
});
})
app.post('/register',async function(req,res){
  //   let username=req.body.username;
  //   let pwd=md5(req.body.password);
  //  // console.log(pwd);
  //   let data=await userModel.find({email: username});
  //  // console.log(data);
  //   if(data.length==0){
  //      let d= new userModel({
  //           email: username,
  //           password: pwd
  //      });
  //      d.save();
  //     res.render('secrets.ejs',d);
  //   }
  //   else{
  //    res.render('register.ejs');
  //   }
 userModel.register({username: req.body.username},req.body.password,function(err,user){
  if(err){
    console.log(err);
    res.redirect("/register");
  }
  else{
passport.authenticate("local")(req,res,function(){
  res.redirect("/secrets");
})


  }

 })



});
app.post('/login',async function(req,res){
    // let username=req.body.username;
    // let pwd=md5(req.body.password);
    // let data=await userModel.find({email: username,password: pwd});
   
    // if(data.length!=0){

    //   res.render('secrets.ejs',data[0]);
    // }
    // else{
    //  res.render('login.ejs');
    // }
const use=new userModel({
  usename:req.body.username,
  password: req.body.password
});
req.login(use,function(err){
if(err){console.log(err);}
else{
  passport.authenticate("local")(req,res,function(){
    res.redirect("/secrets");
  })
}

})

});


let port =process.env.PORT;
if(port==null||port==""){
  port=3000;
}

app.listen(port,()=>{
   console.log(`server setup at ${port}`);
})
