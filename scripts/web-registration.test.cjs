const assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm'), test=require('node:test');
const root=fs.readFileSync('index.html','utf8');
const context={window:{},document:{querySelector:()=>null},URL};
vm.runInNewContext(fs.readFileSync('web-app/dist/registration-data.js','utf8'),context);
vm.runInNewContext(fs.readFileSync('web-app/dist/registration.js','utf8'),context);
const registration=context.window.g360Registration;
const valid={name:'Entreprise de test',category:'Éducation',subcategory:'Auto-écoles',city:'Conakry',district:'Ratoma',quartier:'Kipé',postalCode:'00000',streetAddress:'',phone:'+224 000 00 00 00',email:'',website:'',whatsapp:'',description:'Cours de conduite.'};
test('category, subcategory and city choices exactly match the reference file',()=>{
 const taxonomy=JSON.parse(root.match(/const DEFAULT_TAXONOMY=(\{.*?\});const TAXONOMY_KEY/)[1]);
 const cities=vm.runInNewContext(root.match(/const CITIES=(\[[^;]+\])/)[1]);
 assert.equal(JSON.stringify(registration.taxonomy),JSON.stringify(taxonomy));assert.equal(JSON.stringify(registration.cities),JSON.stringify(cities));assert.equal(Object.keys(taxonomy).length,19);
});
test('all reference fields survive normalization without inventing map coordinates',()=>{
 const value=registration.normalize(valid);
 for(const name of registration.fields)assert.equal(value[name],valid[name]);
 assert.equal(value.categoryId,'education');assert.equal(value.subcategoryId,'auto-ecoles');assert.equal(value.communeId,'ratoma');assert.equal(value.latitude,null);assert.equal(value.longitude,null);
});
test('mismatched categories, invalid cities and unsafe web URLs are rejected',()=>{
 assert.throws(()=>registration.normalize({...valid,subcategory:'Garages'}));
 assert.throws(()=>registration.normalize({...valid,city:'Not in list'}));
 assert.throws(()=>registration.normalize({...valid,website:'javascript:alert(1)'}));
 assert.throws(()=>registration.normalize({...valid,category:'__proto__',subcategory:'constructor'}));
 assert.throws(()=>registration.normalize({...valid,description:'x'.repeat(801)}));
});
test('photo validation accepts supported formats and rejects oversized or non-image uploads',()=>{
 registration.validatePhoto({type:'image/webp',size:5*1024*1024});
 assert.throws(()=>registration.validatePhoto({type:'image/jpeg',size:5*1024*1024+1}));
 assert.throws(()=>registration.validatePhoto({type:'image/svg+xml',size:1024}));
});
test('website uses the exact reference logo',()=>{
 const readLogo = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
 assert.equal(readLogo('web-app/dist/logo.svg'), readLogo('logo.svg'));
});
