const neo4j = require('neo4j-driver').v1;
const config = {maxConnectionLifetime: 1000};
const driver = neo4j.driver("bolt://hobby-akcdfagfchaogbkeikaeilcl.dbs.graphenedb.com:24786", neo4j.auth.basic("engine", "b.BQW2rffrWCIY.EAeiWerQu1tNsHE5"));


module.exports = driver ;