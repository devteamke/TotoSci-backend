const mongoose = require('mongoose');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const Posts = mongoose.model('Posts');
const Places = mongoose.model('Places');
const Comments = mongoose.model('Comments');
const Saved = mongoose.model('Saved');
const PostLike = mongoose.model('PostLike');
const Users = mongoose.model('Users');
const ObjectId = require('mongodb').ObjectID
const driver = require('../../neo4j')
//image upload
const multer                = require('multer');
const cloudinary            = require('cloudinary');
//cloudinary config
cloudinary.config({ 
    cloud_name: 'dfvyoh7qx', 
    api_key: 571435583928238, 
    api_secret: "stZi7uFlmw3qIMr6LTBQbntCwMA"
  });
//Mutler configuration move during refactoring
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  },
   onError : function(err, next) {
   //   console.log('error', err);
      next(err);
    }
});
var fileFilter = function (req, file, cb) {
    // accept image files only
    if(req.originalUrl=='/new_post', upload.single('image')){
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif|)$/i)) {
               req.fileValidationError ='Invalid file type';
                  cb(null, true);
            }
            cb(null, true);
    }
};

var maxSize =1 * 1024 * 1024 *25
var upload = multer({ storage: storage,limits:{ fileSize: maxSize }, fileFilter: fileFilter, })  

router.post('/new_post', passport.authenticate('jwt', { session: false }), upload.single('image'),(req, res, next) => {
    
   const { body } = req;
   const { user } =req;
   console.log(user._id)
    console.log('[received from app]',body)
    let errors = [] 
     if(!body.title) {
         errors.push('Title is required')
     } 
     if(!body.place_id) {
         errors.push('Place id is required')
     } 
     if(!body.body) {
         errors.push('Body is required')
     } 
     if(errors.length>0) {
          return res.status(200).json({success:false, message:'Some errors were encountered',errors:errors});
     }
    if(req.fileValidationError){
          return res.status(200).json({success: false, message: req.fileValidationError,});
     }
    if(!req.file){
   
    return res.status(200).json({success:false, message:'No file'});
        
    }else{
        var file=req.file.path;
       // console.log(req.file);
      //  return
        cloudinary.v2.uploader.upload(file,(error, result)=> {
            if(error){
              return res.status(200).json({success:false, message:'An error occured in changing your profile pic'});
            }else{
            console.log(result)
            Posts.create({
                 by:user._id,
                 title:body.title,
                 place_id:body.place_id,
                 rating:body.rating,
                 body:body.body,
                 image:result.secure_url 
                 
            })
            .then((post)=>{
                console.log(post)
                if(post){
                       return res.status(200).json({success:true, message:'Post Saved' ,post:post});
                    
                }
            })
            .catch((err)=>{
                return res.status(200).json({success:false, message:err.message}); 
            })
            }
            
        });
    
    }
 


});

/*returns all Posts */
router.get('/all', passport.authenticate('jwt', { session: false }),(req, res, next) => {
  return Posts.find()
    .sort({ createdAt: 'descending' })
    .then((posts) => res.json({ posts: posts.map(user=> user.toJSON()),success:true }))
    .catch(next);
});
/*returns all saved posts */
router.get('/saved_posts', passport.authenticate('jwt', { session: false }),(req, res, next) => {
    const { user } =req;
  return Saved.find({user_id:user._id})
    .sort({ createdAt: 'descending' })
    .then((saved)=>{
        let ids =[];
        saved.map((each)=>{
         var myObjectId = mongoose.Types.ObjectId(each.post_id);
         console.log(myObjectId)
            ids.push(myObjectId)
        })
        console.log('[ids]', ids )
        Posts.find({ _id: { $in:ids } })
             .then((posts)=>{
                 console.log('[posts]',posts)
                 res.json({ posts: posts.map(user=> user.toJSON()),success:true })
             })
       
    })
    .catch(next);
});
/*saves like  */
router.post('/save_like', passport.authenticate('jwt', { session: false }),(req, res, next) => {
   const { body } = req;
   const { user } =req;
   console.log('[data from app]',body)
    
    if(body.liked){
        PostLike.remove({user_id:user._id,post_id:body.post_id})
                .then((data)=>{
                    // console.log(data)
                     return res.json({success:true})
                })
        
    }else if (!body.liked){
         PostLike.create({user_id:user._id,post_id:body.post_id})
                 .then((newLike)=>{
                     console.log('[saved like]',newLike)
                      return res.json({success:true})
                 })
        
    }
});
/*saves post  */
router.post('/save_post', passport.authenticate('jwt', { session: false }),(req, res, next) => {
   const { body } = req;
   const { user } =req;
   console.log('[data from app]',body)
    
    if(body.saved){
        Saved.remove({user_id:user._id,post_id:body.post_id})
                .then((data)=>{
                    // console.log(data)
                     return res.json({success:true})
                })
        
    }else if (!body.saved){
         Saved.create({user_id:user._id, type:'post',post_id:body.post_id})
                 .then((saved)=>{
                     console.log('[saved post]',saved)
                      return res.json({success:true})
                 })
        
    }
});
/*saves place(also register) */
router.post('/save_place', passport.authenticate('jwt', { session: false }),(req, res, next) => {
   const { body } = req;
   const { user } =req;
   console.log('[data from app]',body)
   Places.findOne({place_id:body._id})
         .then((place)=>{
             console.log('[place from db]', place)
             if(place==null){
                 //save p[lace]
                 Places.create({place_id:body._id, name:body.name, location:body.location, phone_number:body.phone_number, photos:body.photos, rating:body.rating, vicinity:body.vicinity})
                       .then((newPlace)=>{
                           console.log('[saved place]', newPlace)
                           
                       })
                       .catch((err)=>console.log(err))
               //create relation btw current user and place
             }else if(place!==null){
                 //dont save
                   //merge relation btw current user and place
                 
             }
         })
         .catch((err)=>console.log(err))
    

});
/*single post  */
router.post('/single', passport.authenticate('jwt', { session: false }), (req, res, next) => {
  const { body } = req;
  const { user } =req;
  let user_r =user;
  return Posts.findOne({_id:body._id})
    .then((post) =>{
     
      Users.findOne({_id:post.by})
          .then((user)=>{
              post =post.toObject();
              post.byName = user.username
              PostLike.findOne({user_id:req.user._id, post_id:post._id})
                      .then((like)=>{
                        //  console.log(user_r._id,' vs ', like.user_id)
                          if(like==null){
                              post.liked = false
                             
                          }else{
                              post.liked = true
                           
                          }
                            PostLike.countDocuments({post_id:post._id})
                                    .then((count)=>{
                                        post.likes = count;
                                       Saved.find({post_id:post._id})
                                       .then((saved)=>{
                                           
                                           if(saved.length>0){
                                               post.saved=true
                                           }else if(saved.length==0){
                                               post.saved= false
                                           }
                                            res.json({post:post,success:true})
                                       })
                                       
                                    })
                           
                      })

          })
          .catch((err)=>{console.log(err)})
        
    })
    .catch(next);
});
/*handle comments  */
router.post('/comments', passport.authenticate('jwt', { session: false }), (req, res, next) => {
  const { body } = req;
  const { user } =req;
  let user_r =user;
  return Comments.find({post_id:body._id})
                 .sort({createdAt:1})
                 .then((comments) =>{
                 
                 // console.log('[fetched comments]',comments)
                  res.json({comments:comments,success:true})
                                             
                 })
                 .catch(next);
});
/*saves comment */
router.post('/save_comment', passport.authenticate('jwt', { session: false }),(req, res, next) => {
   const { body } = req;
   const { user } =req;
   console.log('[data from app]',body)
    
  Comments.create({username:user.username,comment:body.comment,post_id:body.post_id})
                 .then((newComment)=>{
                    // console.log('[saved comment]',newComment)
                      return res.json({success:true})
                 })
        

});


router.patch('/:id', (req, res, next) => {
  const { body } = req;

  if(typeof body.title !== 'undefined') {
    req.article.title = body.title;
  }

  if(typeof body.author !== 'undefined') {
    req.article.author = body.author;
  }

  if(typeof body.body !== 'undefined') {
    req.article.body = body.body;
  }

  return req.article.save()
    .then(() => res.json({ article: req.article.toJSON() }))
    .catch(next);
});

// router.delete('/:id', (req, res, next) => {
//   return User.findByIdAndRemove(req.article._id)
//     .then(() => res.sendStatus(200))
//     .catch(next);
// });

module.exports = router;