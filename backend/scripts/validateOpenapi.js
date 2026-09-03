const SwaggerParser = require('@apidevtools/swagger-parser');
const { openApiDocument } = require('../openapi/v1');

SwaggerParser.validate(openApiDocument)
  .then(() => console.log(`OpenAPI ${openApiDocument.info.version} is valid`))
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
