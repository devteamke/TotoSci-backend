const neo4j = require('neo4j-driver').v1;

const driver = neo4j.driver("bolt://hobby-akcdfagfchaogbkeikaeilcl.dbs.graphenedb.com:24786", neo4j.auth.basic("locality", "b.YiV0zxuerwES.JaDNWlAtNNOY4JbP"));


module.exports = driver ;