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
const PlaceLike = mongoose.model('PlaceLike');
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
              return res.status(200).json({success:false, message:'An error occured in saving your pic'});
            }else{
            console.log(result)
            Posts.create({
                 by:user._id,
                 title:body.title,
                 place_id:body.place_id,
                 place_name:body.place_name,
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
  return Saved.find({user_id:user._id, type:'post'})
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
/*saves like  of post  */
router.post('/save_like', passport.authenticate('jwt', { session: false }),(req, res, next) => {
   const { body } = req;
   const { user } =req;
   console.log('[data from app]',body)
   let countLikes = () =>{
       PostLike.countDocuments({post_id:body.post_id})
                .then((count)=>{
                    console.log('[likes number ]',count)
                    Posts.findOneAndUpdate({_id:body.post_id}, {$set:{likes:count}}, {new:true})
                         .then((updatedPost)=>{
                             console.log(updatedPost)
                         })
                         .catch(err=>console.log(err))
                })
                .catch((err)=>console.log(err))
   }
    if(body.liked){
        PostLike.remove({user_id:user._id,post_id:body.post_id})
                .then((data)=>{
                    // console.log(data)
                      res.json({success:true})
                     return countLikes();
                })
        
    }else if (!body.liked){
         PostLike.create({user_id:user._id,post_id:body.post_id})
                 .then((newLike)=>{
                     console.log('[saved like]',newLike)
                      res.json({success:true})
                      return countLikes();
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


/*returns all saved place */
router.get('/save_places_fetch', passport.authenticate('jwt', { session: false }),(req, res, next) => {
    const { user } =req;
  return Saved.find({user_id:user._id,type:'place'})
    .sort({ createdAt: 'descending' })
    .then((saved)=>{
        let ids =[];
        saved.map((each)=>{
       
            ids.push(each.place_id)
        })
        console.log('[ids]', ids )
        Places.find({ place_id: { $in:ids } })
             .then((places)=>{
                 console.log('[saved places]',places)
                 res.json({ places: places.map(user=> user.toJSON()),success:true })
             })
       
    })
    .catch(next);
});

/*check for like and save*/
router.post('/like_save_check', passport.authenticate('jwt', { session: false }),(req, res, next) => {
   const { body } = req;
   const { user } =req;
   console.log('[data from app]',body)
   Saved.findOne({user_id:user._id, place_id:body.place_id})
        .then((foundSaved)=>{
            console.log('[found saved]',foundSaved)
            PlaceLike.findOne({user_id:user._id, place_id:body.place_id})
                     .then((foundLiked)=>{
                                  var neo_session = driver.session();
                                     neo_session
                                    .run(`MATCH (p:Place {_id:'${body.place_id}' }), (u:User {_id:'${user._id}' }) MERGE (u)-[r:LIKES ]->(p)  ON CREATE SET r.weight = 10 ON MATCH SET r.weight = r.weight + 1 RETURN r`)
                                    .then((result)=> {
                                        result.records.forEach(function(record) {
                                            console.log(record)
                                            console.log(record._fields[0])
                                        });
                                
                                      neo_session.close();
                                    })
                                    .catch((error)=> {
                                        console.log(error);
                                    }); 
                        console.log('[found liked]',foundLiked)
                        let liked= null;
                        let saved = null;
                        if(foundSaved==null){
                            saved = false;
                        }else{
                            saved = true;
                        }
                        if(foundLiked ==null){
                            liked =false
                        }else{
                            liked = true
                        }
                        res.json({success:true,liked:liked, saved:saved})
                     })
                     .catch((err)=>console.log(err))
        })  
        .catch((err)=>{console.log(err)})
   
});
/*saves like  of place*/
router.post('/save_like_place', passport.authenticate('jwt', { session: false }),(req, res, next) => {
   const { body } = req;
   const { user } =req;
   console.log('[data from app]',body)
    
    if(body.liked){
        PlaceLike.remove({user_id:user._id,place_id:body.place_id})
                .then((data)=>{
                    // console.log(data)
                      var neo_session = driver.session();
                                     neo_session
                                    .run(`MATCH (u:User {_id: '${user._id}'})-[r:LIKES ]->(p:Place {_id:'${body.place_id}'})  DELETE r`)
                                    .then((result)=> {
                                        result.records.forEach(function(record) {
                                            console.log(record)
                                            console.log(record._fields[0])
                                        });
                                
                                      neo_session.close();
                                    })
                                    .catch((error)=> {
                                        console.log(error);
                                    });
                     res.json({success:true})
                     //DETACH DELETE n
                       
                })
        
    }else if (!body.liked){
         PlaceLike.create({user_id:user._id,place_id:body.place_id})
                 .then((newLike)=>{
                     console.log('[saved like]',newLike)
           
                     res.json({success:true})
                    
                             
                 })
        
    }
});
/*saves place user */
router.post('/save_place_user', passport.authenticate('jwt', { session: false }),(req, res, next) => {
   const { body } = req;
   const { user } =req;
   console.log('[data from app]',body)
    
    if(body.saved){
        Saved.remove({user_id:user._id,place_id:body.place_id})
                .then((data)=>{
                    // console.log(data)
                     return res.json({success:true})
                })
        
    }else if (!body.saved){
         Saved.create({user_id:user._id, type:'place',place_id:body.place_id})
                 .then((saved)=>{
                     console.log('[saved place]',saved)
                      return res.json({success:true})
                 })
        
    }
});
/*saves place(also register) */
router.post('/save_place', passport.authenticate('jwt', { session: false }),(req, res, next) => {
   const { body } = req;
   const { user } =req;
   //console.log('[data from app]',body)
   Places.findOne({place_id:body._id})
         .then((place)=>{
           //  console.log('[place from db]', place)
             if(place==null){
                 //save p[lace]
                 Places.create({place_id:body._id, name:body.name, location:body.location, phone_number:body.phone_number, photos:body.photos, rating:body.rating, vicinity:body.vicinity})
                       .then((newPlace)=>{
                          // console.log('[saved place]', newPlace)
                           res.json({success:true})
                                var neo_session = driver.session();
                                     neo_session
                                    .run(`CREATE (p:Place {_id:'${newPlace.place_id}',name:'${newPlace.name}'}) RETURN p`)
                                    .then((result)=> {
                                        result.records.forEach(function(record) {
                                            console.log(record)
                                            console.log(record._fields[0].properties)
                                        });
                                
                                      neo_session.close();
                                    })
                                    .catch((error)=> {
                                        console.log(error);
                                    });
                       })
                       .catch((err)=>console.log(err))
               //create relation btw current user and place
                    
             }else if(place!==null){
                 //dont save
                   //merge relation btw current user and place
                      var neo_session = driver.session();
                                     neo_session
                                    .run(`MATCH (p:Place {_id:'${place.place_id}' }), (u:User {_id:'${user._id}' }) MERGE (u)-[r:LIKES ]->(p)  ON  MATCH SET r.weight = r.weight + 1 RETURN r`)
                                    .then((result)=> {
                                        result.records.forEach(function(record) {
                                            console.log(record)
                                            console.log(record._fields[0])
                                        });
                                
                                      neo_session.close();
                                    })
                                    .catch((error)=> {
                                        console.log(error);
                                    });
                 res.json({success:true})
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
                                       Saved.find({post_id:post._id,user_id:user_r._id})
                                       .then((saved)=>{
                                           console
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
       let countComments = () =>{
       Comments.countDocuments({post_id:body.post_id})
                .then((count)=>{
                    console.log('[comments number ]',count)
                    Posts.findOneAndUpdate({_id:body.post_id}, {$set:{comments:count}}, {new:true})
                         .then((updatedPost)=>{
                             console.log(updatedPost)
                         })
                         .catch(err=>console.log(err))
                })
                .catch((err)=>console.log(err))
   }
  Comments.create({username:user.username,comment:body.comment,post_id:body.post_id})
                 .then((newComment)=>{
                    // console.log('[saved comment]',newComment)
                      res.json({success:true})
                      return countComments();
                 })
        

});

//get recommendations
/* recommendations from interest algorithm -> gets similary users
MATCH (p2:User)-[likes2:LIKES]->(i1:Interest) WHERE p2 <> p1
RETURN p1.username AS from,
       p2.username AS to,       
       likes1.weight AS fromWeight,
       likes2.weight AS toWeight,
       algo.similarity.euclideanDistance(collect(likes1.weight), collect(likes2.weight)) AS similarity */

router.post('/get_recommendations', passport.authenticate('jwt',{ session:false }), (req,res,next)=>{
    const { user } = req;
        let crunch  = (similar) => {
            console.log('[similar used to loop]',similar)
            let top = []
            similar.map((item,i)=>{
                if(similar>=10){
                    return ;
                }
              
                    top.push(item)
                if(i == similar.length-1){
                 
                    return ;
                    
                }
                
            });
            
            return top;
            
        }

         let neo_session = driver.session();
                                     neo_session
                                    .run(`MATCH (p1:User {username: '${user.username}'})-[likes1:LIKES]->(i1:Interest)
                                            MATCH (p2:User)-[likes2:LIKES]->(i1:Interest) WHERE p2 <> p1
                                            RETURN p1.username AS from,
                                                   p2.username AS to,       
                                                   likes1.weight AS fromWeight,
                                                   likes2.weight AS toWeight,
                                                   algo.similarity.euclideanDistance(collect(likes1.weight), collect(likes2.weight)) AS similarity `)
                                    .then(async(result)=> {
                                        let similar= []
                                        let  simMap = new Promise((resolve,reject)=>{
                                                  result.records.map((record,i)=> {
                                           // console.log('[each record]',  record._fields)
                                            let each = {
                                                username:record._fields[1],
                                                similarity:record._fields[4]
                                            }
                                            similar.push(each)
                                            if(i== result.records.length -1){
                                                resolve();
                                            }
                                        });
                                        })
                                        await simMap;
                                        let top = crunch(similar);
                                        // let cypher = createCypher(top)
                                        // console.log(cypher)
                                         neo_session.close();
                                       let recommendations = [];
                                       top.map(async(each,i)=>{
                                            let prom= new Promise((resolve, reject)=>{
                                                 
                                                          let neo_session2 = driver.session();
                                                            neo_session2
                                                            .run(`MATCH (p$:User {username: '${each.username}'})-[:LIKES]->(pl:Place) RETURN pl`)
                                                            .then(async(result2)=> {
                                                                      neo_session2.close();
                                                                        let prom2= new Promise((resolve, reject)=>{
                                                                           result2.records.forEach((record2,i) =>{
                                                                                       console.log('[each record]',  record2._fields)
                                                                                             let each2=record2._fields[0].properties;
                                                                                           
                                                                                            recommendations.push(each2)
                                                                                            console.log(i ,' vs ', result2.records.length-1)
                                                                                            if(i == result2.records.length-1){
                                                                                                resolve()
                                                                                            }
                                                                                        
                                                                                    });
                                                                        })
                                                                        await prom2;
                                                                               
                                                                           
                                                                           
                                                                            resolve();
                                                                    })
                                                                    .catch((error)=> {
                                                                        console.log(error);
                                                                    }); 
                                           
                                             
                                     
                                                
                                            })
                                                await prom;
                                            
                                                console.log(i ,' vs ',  top.length)
                                                console.log(i== top.length-1);
                                                if(i== top.length-1){
                                                       res.json({recommendations})
                                                }
                                       })
                                    
                                    })
                                     .catch((error)=> {
                                                console.log(error);
                                }); 
})

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
router.post('/delete_this',(req,res,next)=>{
    console.log('[data from sms listener]',req.body)
    res.json({success:true})
})
module.exports = router;

