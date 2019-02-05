const mongoose = require('mongoose');
const router = require('express').Router();
const Items = mongoose.model('Items');
const passport = require('passport');
//new item
router.post('/',passport.authenticate('jwt', { session: false }), (req, res, next) => {
  const { body } = req;
  if(!body) {
    return res.status(422).json({
      errors: {
        body: 'is required',
      },
    });
  }
  if(!body.name) {
    return res.status(422).json({
      errors: {
        name: 'is required',
      },
    });
  }

  if(!body.category) {
    return res.status(422).json({
      errors: {
        category: 'is required',
      },
    });
  } 
  if(!body.price) {
    return res.status(422).json({
      errors: {
        price: 'is required',
      },
    });
  } 
  if(!body.description) {
    return res.status(422).json({
      errors: {
        description: 'is required',
      },
    });
  } 
if(!body.type) {
    return res.status(422).json({
      errors: {
       type: 'is required',
      },
    });
  } 
  const newItem = new Items(body);
  return newItem.save()
        .then(() => {
                
                res.json({ order: newItem.toJSON() ,success:true})
                
        })
        .catch(next);
});

router.get('/', passport.authenticate('jwt', { session: false }), (req, res, next) => {
  return Items.find()
    .sort({ createdAt: 'descending' })
    .then((Items) =>{
      res.json({ Items: Items.map(item => item.toJSON()),success:true })
      
    })
    .catch(next);
});
router.get('/categories',/* passport.authenticate('jwt', { session: false }),*/ (req, res, next) => {
  return Items.aggregate([ { $match : { } } ,
                            	{
                            	 "$group" : {_id:"$category", count:{$sum:1}}
                            	},
                            	{
                           	   $sort:{"count":-1}
                            	},
                            	{$limit : 10}
                            	]).then((Categories) => res.json({ Categories:Categories,success:true }))
    .catch(next);
});

router.param('id', (req, res, next, id) => {
  return Items.findById(id, (err, item) => {
    if(err) {
      return res.sendStatus(404);
    } else if(item) {
      req.item = item;
      return next();
    }
  }).catch(next);
});

router.get('/:id', (req, res, next) => {
  return res.json({
    article: req.article.toJSON(),
  });
});

router.patch('/', (req, res, next) => {
  const { body } = req;
  //console.log(body)
  Items.findOne({_id:body._id})
       .then((found) =>{
         found.price =body.price;
         found.qty =body.qty;
         found.description = body.description;
         //check type
         found.suppliers = body.suppliers;
         found.save()
              .then(changes=>{
              
                res.json({success:true,message:'Changes saved successfully'});
              })
        
       })
      .catch(next);
});

router.delete('/:id', (req, res, next) => {
  return Orders.findByIdAndRemove(req.article._id)
    .then(() => res.sendStatus(200))
    .catch(next);
});

module.exports = router;