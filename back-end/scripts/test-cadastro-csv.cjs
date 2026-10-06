const root=require('path').resolve(__dirname,'..');require(root+'/node_modules/dotenv').config({path:root+'/.env'});const assert=require('assert/strict');
const reports=require(root+'/dist/controllers/cadastroReports');
const csv=reports.cadastroCsv(reports.cadastroReports.produtos,[{CODIGO:1,DESCRICAO:'=HYPERLINK("evil")',CODIGO_INTERNO:'00001',CODIGO_BARRAS:'0000123456789',VALOR_UNITARIO:12.34}]);
assert(csv.startsWith('\uFEFF'));assert(csv.includes('"\'00001"'));assert(csv.includes('"\'0000123456789"'));assert(csv.includes('"12,34"'));assert(csv.includes('"\'=HYPERLINK(""evil"")"'));
const empty=reports.cadastroCsv(reports.cadastroReports.marcas,[]);assert.equal(empty.split('\r\n').length,1);
console.log('PASS: CSV com BOM, cabeçalhos, aspas, zeros à esquerda, números e proteção contra fórmulas. Sem banco.');
