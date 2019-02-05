const mongoose = require('mongoose');
const router = require('express').Router();
const Orders = mongoose.model('Orders');
const Items = mongoose.model('Items');
const passport = require('passport');
router.post('/', passport.authenticate('jwt', { session: false }), (req, res, next) => {
  const { body } = req;

  if(!body.amount) {
    return res.status(422).json({
      errors: {
        amount: 'is required',
      },
    });
  }

  if(!body.employee) {
    return res.status(422).json({
      errors: {
        employee: 'is required',
      },
    });
  } 
 
  if(body.orderItems.length==0) {
    return res.status(422).json({
      errors: {
        orderItems: 'is required',
      },
    });
  }

//   if(!body.body) {
//     return res.status(422).json({
//       errors: {
//         body: 'is required',
//       },
//     });
//   }

  const newOrder = new Orders(body);
  return newOrder.save()
        .then(  async() => {
            let trans = new Promise((resolve, reject) => {
                  body.orderItems.map((item,i)=>{
                    let val = -1*item.qty
                    console.log(item.itemId)
                    console.log(val)
                    Items.findOneAndUpdate({ _id: item.itemId },{ $inc: { qty: val } })
                        .then((err,updated)=>{
                          console.log(err)
                          console.log(updated)
                        })
                        if(i+1 == body.orderItems.length){
                          console.log(i+1,body.orderItems.length)
                          resolve()
                        }
                  })
              })
              // 
              await trans;
             res.json({ order: newOrder.toJSON(),success:true })
                
        })
        .catch(next);
});

router.get('/',passport.authenticate('jwt', { session: false }), (req, res, next) => {

  return Orders.find({employee:req.user.username})
    .sort({ createdAt: 'descending' })
    .then((Orders) => res.json({ Orders: Orders.map(order=> order.toJSON()),success:true }))
    .catch(next);
});

router.param('id', (req, res, next, id) => {
  return Orders.findById(id, (err, article) => {
    if(err) {
      return res.sendStatus(404);
    } else if(article) {
      req.article = article;
      return next();
    }
  }).catch(next);
});

router.get('/:id', (req, res, next) => {
  return res.json({
    article: req.article.toJSON(),
  });
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
  return Orders.findByIdAndRemove(req.article._id)
    .then(() => res.sendStatus(200))
    .catch(next);
});

module.exports = router;