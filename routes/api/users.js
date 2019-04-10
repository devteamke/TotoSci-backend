const mongoose = require('mongoose');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = mongoose.model('Users');
const driver = require('../../neo4j')
router.post('/login', (req, res, next) => {
  const { body } = req;

  if(!body.username) {
    return res.status(422).json({
      errors: {
        username: 'is required',
      },
    });
  }

  if(!body.password) {
    return res.status(422).json({
      errors: {
        password: 'is required',
      },
    });
  } 
  let username = body.username;
  let password = body.password;
    let errors ={}
    User.findOne({username})
        .then(user => {
            if(!user) {
              
             
                return res.status(200).json({success:false,message:'Incorrect username or password!'});
            }
            bcrypt.compare(password, user.password)
                    .then(isMatch => {
                        if(isMatch) {
                            const payload = {
                                id: user.id,
                                username: user.username,
                                role: user.role,
                                email:user.email,
                                isSetUp:user.isSetUp,
                            }
                            jwt.sign(payload, 'secret', {
                                expiresIn: 90000
                            }, (err, token) => {
                                if(err) console.error('There is some error in token', err);
                                else {
                                    res.json({
                                        success: true,
                                        token: `Bearer ${token}`,
                                        user_id:user._id,
                                        message:'You have successfully logged in'
                                    });
                                }
                            });
                        }
                        else {
                             return res.status(200).json({success:false,message:'Incorrect username or password!'});
                        }
                    });
        });
  


});
router.post('/register', (req, res, next) => {
  const { body } = req;
  console.log(body)
  if(!body.username) {
    return res.status(422).json({
      errors: {
        username: 'is required',
      },
    });
  }

  if(!body.email) {
    return res.status(422).json({
      errors: {
        email: 'is required',
      },
    });
  } 
  // if(!body.type) {
  //   return res.status(422).json({
  //     errors: {
  //       type: 'is required',
  //     },
  //   });
  // } 
 if(!body.password) {
    return res.status(422).json({
      errors: {
        password: 'is required',
      },
    });
  } 
  if(!body.password_2) {
    return res.status(422).json({
      errors: {
        password_2: 'is required',
      },
    });
  } 
  if(body.password!=body.password_2) {
    return res.status(422).json({
      errors: {
        password: 'Passwords do not match',
      },
    });
  } 
  
 
    User.findOne({
        username: body.username
    }).then(user => {
        if(user) {
            return res.status(200).json({success:false,message:'Username already exists'});
        }
        else {
           User.findOne({
           email: body.email
        }).then(user => {
            if(user) {
            return res.status(200).json({success:false,message:'Email already exists'});
        }
        else {
            const newUser = new User({
                username: body.username,
                email: body.email,
                type: body.type,
                password: body.password,
               
            });
            
            bcrypt.genSalt(10, (err, salt) => {
                if(err) console.error('There was an error', err);
                else {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if(err) console.error('There was an error', err);
                        else {
                            newUser.password = hash;
                            newUser
                                .save()
                                .then(user => {
                                    var neo_session = driver.session();
                                     neo_session
                                    .run(`CREATE (u:User {username:'${user.username}',_id:'${user._id}'}) RETURN u.username`)
                                    .then((result)=> {
                                        result.records.forEach(function(record) {
                                            console.log(record)
                                        });
                                
                                      neo_session.close();
                                    })
                                    .catch((error)=> {
                                        console.log(error);
                                    });
                                    user = user.toObject();
                                    delete user.password
                                      const payload = {
                                        id: user._id,
                                        username: user.username,
                                        role: user.role,
                                        email:user.email,
                                        isSetUp:user.isSetUp,
                                    }
                                    jwt.sign(payload, 'secret', {
                                        expiresIn:90000
                                    }, (err, token) => {
                                        if(err) console.error('There is some error in token', err);
                                        else {
                                            res.json({
                                                success: true,
                                                token: `Bearer ${token}`,
                                               
                                                message:'You have successfully registered to locality'
                                            });
                                        }
                                    });
                                   
                                }); 
                        }
                    });
                }
            });
        }
        })
           
        }
    });
  
});

router.post('/profile', passport.authenticate('jwt', { session: false }), (req, res) => {
  
   User.findById(req.user.id)
       .then((user)=>{
         user = user.toObject()
         delete user.password;
         delete user.updatedAt;
         delete user.__v;
         delete user.role;
         console.log(user)
         res.json({success:true,message:'Query successful', user:user})
       })
       .catch((err)=>{
         console.log(err)
       })
});

router.post('/update_profile', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { body } = req;
    console.log('[data of request]', req.body)
   User.findOneAndUpdate({_id:req.user.id},{email:body.email,fname:body.fname,lname:body.lname,phone_number:body.phone_number}, {new: true})
       .then((user)=>{
        user = user.toObject()
        delete user.password;
        delete user.updatedAt;
        delete user.__v;
        delete user.role;
         console.log(user)
         res.json({success:true,message:'Query successful', user:user})
       })
       .catch((err)=>{
         console.log(err)
       })
});
router.post('/save_interests', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { body } = req;
    const { user } = req;
    const { items } =req.body;
    console.log('[data of request]', req.body)
   
     const keys =  Object.keys(items)
     const values = Object.values(items)
      console.log('[keys]', Object.keys(items))
      console.log('[values]', Object.values(items))
     let interests =[];
    for(let i=0;i<keys.length;i++){
        console.log(i)
        let toPush = {
           interest:keys[i],
           weight:values[i]
         }
       if(values[i]!==0){
            interests.push(toPush);
       }
      
    }
    console.log('[interests]',interests)
   
   
    const saveToGraph = () =>  {
        let matchString="";
        let createString ="";
        let comma =',';
        interests.map((interest, i)=>{
            
            if(i==interests.length-1){
                comma=''
            }
            matchString+=`(i${i}:Interest {name:'${interest.interest}'})${comma}`
            createString+=`((u)-[:LIKES {weight: ${interest.weight*2}}]->(i${i}))${comma}`;  
            
        })
        console.log('[matchString]',matchString)
        console.log('[createString]',createString)
         var neo_session = driver.session();
                                     neo_session
                                    .run(`MATCH (u:User {_id: '${user._id}'}), ${matchString} CREATE ${createString} RETURN u`)
                                    .then((result)=> {
                                        result.records.forEach(function(record) {
                                            console.log(record)
                                        });
                                
                                      neo_session.close();
                                    })
                                    .catch((error)=> {
                                        console.log(error);
                                    }); 
    }
   
   User.findOneAndUpdate({_id:req.user.id},{interests:body.interests, isSetUp:true}, {new: true})
       .then((user)=>{
        user = user.toObject()
         delete user.password;
         delete user.updatedAt;
         delete user.__v;
         delete user.role;
         console.log(user)
         saveToGraph();
         res.json({success:true,message:'Query successful', user:user})
               
    
       })
       .catch((err)=>{
         console.log(err)
       })
});

router.post('/update_password', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { body } = req;
    const { user } = req;
    console.log('[data of request]', req.body)
  let username = user.username;
  let password = body.password;
    let errors ={}
    User.findOne({username})
        .then(user => {
            if(!user) {
              
             
                return res.status(200).json({success:false,message:'Failed to update password!'});
            }
                bcrypt.compare(password, user.password)
                        .then(isMatch => {
                            if(isMatch) {
                               bcrypt.genSalt(10, (err, salt) => {
                                if(err) console.error('There was an error', err);
                                else {
                                    bcrypt.hash(body.newPassword, salt, (err, hash) => {
                                        if(err) console.error('There was an error', err);
                                        else {
                                            user.password = hash;
                                            user
                                                .save()
                                                .then(user => {
                                                  
                                                     return res.status(200).json({success:true,message:'Password updated successfully'});
                                                }); 
                                        }
                                    });
                                }
                            });
                        }
                        else {
                             return res.status(200).json({success:false,message:'Old password is invalid!'});
                       }
                    });
        });
  
 
});

router.post('/new_token',passport.authenticate('jwt',{session:false}),(req,res,next)=>{
    const { user } = req;
    const { body } = req;
    console.log('[user in new token request]');
    
              const payload = {
                                id: user.id,
                                username: user.username,
                                role: user.role,
                                email:user.email,
                                isSetUp:user.isSetUp,
                            }
                            jwt.sign(payload, 'secret', {
                                expiresIn: 90000
                            }, (err, token) => {
                                if(err) console.error('There is some error in token', err);
                                else {
                                    res.json({
                                        success: true,
                                        token: `Bearer ${token}`,
                                        user_id:user._id,
                                        message:'new token recieved'
                                    });
                                }
                            });
})
/*returns all users */


router.get('/all', (req, res, next) => {
  return User.find()
    .sort({ createdAt: 'descending' })
    .then((users) => res.json({ users: users.map(user=> user.toJSON()),success:true }))
    .catch(next);
});
// /*Fectch a single user*/
// router.get('/:id', (req, res, next) => {
//   return User.find({_id:req.params.id})
//     .sort({ createdAt: 'descending' })
//     .then((users) => res.json({ users: users.map(user=> user.toJSON()),success:true }))
//     .catch(next);
// });

// router.param('id', (req, res, next, id) => {
//   return User.findById(id, (err, user) => {
//     if(err) {
//       return res.sendStatus(404);
//     } else if(user) {
//       req.user = user;
//       return next();
//     }
//   }).catch(next);
// });

// router.get('/:id', (req, res, next) => {
//   return res.json({
//     user: req.user.toJSON(),
//   });
// });
router.get('/policy', (req, res, next) => {
 
  return res.render("policy.ejs");
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

router.delete('/:id', (req, res, next) => {
  return User.findByIdAndRemove(req.article._id)
    .then(() => res.sendStatus(200))
    .catch(next);
});

module.exports = router;