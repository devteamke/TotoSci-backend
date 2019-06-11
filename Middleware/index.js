
const MiddlewareObj={};

MiddlewareObj.isTrainer=(req,res,next)=>{
	if(req.user.role=='trainer'){
		return next();
	}else{
		return res.status(403).json({success:false,message:'You are not permitted  to access the service'});
	}
};
MiddlewareObj.isAdmin=(req,res,next)=>{
	if(req.user.role=='admin'){
		return next();
	}else{
		return res.status(403).json({success:false,message:'You are not permitted  to access the service'});
	}
};
MiddlewareObj.isManager=(req,res,next)=>{
	if(req.user.role=='manager'){
		return next();
	}else{
		return res.status(403).json({success:false,message:'You are not permitted  to access the service'});
	}
};

MiddlewareObj.isChief=(req,res,next)=>{
	if(req.user.role=='chief-trainer'){
		return next();
	}else{
		return res.status(403).json({success:false,message:'You are not permitted  to access the service'});
	}
};
module.exports=MiddlewareObj;