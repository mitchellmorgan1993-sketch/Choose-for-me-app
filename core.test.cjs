const {test}=require('node:test');
const assert=require('node:assert/strict');
const {openState,matchesCuisine,applyRoutes}=require('./core.js');
const monday=(hour,minute=0)=>new Date(2026,8,28,hour,minute);
test('opening hours distinguish closed, open, and unknown',()=>{
 assert.equal(openState(undefined,monday(12)),null);
 assert.equal(openState('24/7',monday(12)),true);
 assert.equal(openState('Mo-Fr 09:00-17:00',monday(12)),true);
 assert.equal(openState('Mo-Fr 09:00-17:00',monday(17)),false);
 assert.equal(openState('Mo-Fr 09:00-17:00; PH off',monday(12)),null);
 assert.equal(openState('Mo 25:00-26:00',monday(12)),null);
 assert.equal(openState('Mo-Fr 09:00-17:00; Mo off',monday(12)),false);
});
test('split shifts, overnight and week wrapping',()=>{
 assert.equal(openState('Mo 09:00-12:00,17:00-22:00',monday(13)),false);
 assert.equal(openState('Mo 09:00-12:00,17:00-22:00',monday(18)),true);
 assert.equal(openState('Su 22:00-02:00',monday(1)),true);
 assert.equal(openState('Su 22:00-02:00',monday(2)),false);
 assert.equal(openState('Fr-Mo 10:00-24:00',monday(23)),true);
});
test('multiple cuisines use OR and empty selection matches all',()=>{
 assert.equal(matchesCuisine({cuisine:'thai'},new Set(['italian','thai'])),true);
 assert.equal(matchesCuisine({cuisine:'pizzeria'},new Set(['pizza'])),true);
 assert.equal(matchesCuisine({cuisine:'thai'},new Set(['italian'])),false);
 assert.equal(matchesCuisine({},new Set()),true);
});
const places=[{id:'node/1',driveKm:5,estimated:true},{id:'way/1',driveKm:8,estimated:true}];
test('valid routes filter distance and unreachable destinations',()=>{
 assert.deepEqual(applyRoutes(places,{code:'Ok',distances:[[0,null,11000]]},10),[]);
 const result=applyRoutes(places,{code:'Ok',distances:[[0,6000,9000]],durations:[[0,600,null]]},10);
 assert.equal(result[0].driveKm,6);assert.equal(result[0].minutes,10);assert.equal(result[0].estimated,false);assert.equal(result[1].minutes,null);
});
test('service errors and malformed responses retain marked estimates',()=>{
 for(const table of [null,{code:'Error'},{code:'Ok',distances:[]}])assert.deepEqual(applyRoutes(places,table,6),[places[0]]);
});

test('menu links prefer direct menus and safely fall back to website or search',()=>{
 const {menuLink,foodPhotosLink}=require('./core.js');
 const place={name:'Test & Thai',lat:-27,lon:153,tags:{'website:menu':'https://example.com/menu.pdf',website:'https://example.com','addr:city':'Brisbane'}};
 assert.equal(menuLink(place).href,'https://example.com/menu.pdf');
 place.tags['website:menu']='javascript:alert(1)';
 assert.equal(menuLink(place).href,'https://example.com/');
 place.tags.website='example.com/menu';
 assert.equal(menuLink(place).href,'https://example.com/menu');
 place.tags.website='data:text/html,unsafe';
 assert.equal(menuLink(place).label,'Search for menu ↗');
 assert.match(decodeURIComponent(menuLink(place).href),/Test & Thai Brisbane menu/);
 assert.match(decodeURIComponent(foodPhotosLink(place)),/Test & Thai Brisbane food/);
 assert.match(foodPhotosLink(place),/tbm=isch/);
});
