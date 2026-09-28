/* Pure helpers shared by the browser and regression tests. */
(function(root){
 'use strict';
 const days=['Su','Mo','Tu','We','Th','Fr','Sa'];
 function openState(value,now=new Date()){
  if(typeof value!=='string'||!value.trim())return null;
  value=value.trim();if(value==='24/7')return true;
  const rules=[];
  for(const part of value.split(';')){
   const match=part.trim().match(/^(?:([A-Za-z,\s-]+)\s+)?(off|closed|\d{2}:\d{2}-\d{2}:\d{2}(?:\s*,\s*\d{2}:\d{2}-\d{2}:\d{2})*)$/);
   if(!match)return null; // Holidays, dates, solar times, comments and other complex rules are unknown.
   const selected=new Set();
   if(!match[1])days.forEach((_,i)=>selected.add(i));
   else for(const span of match[1].split(',')){
    if(!/^(Mo|Tu|We|Th|Fr|Sa|Su)(-(Mo|Tu|We|Th|Fr|Sa|Su))?$/.test(span.trim()))return null;
    const [start,end=start]=span.trim().split('-');let i=days.indexOf(start),last=days.indexOf(end);
    for(let count=0;count<7;count++,i=(i+1)%7){selected.add(i);if(i===last)break}
   }
   const ranges=[];const off=/^(off|closed)$/.test(match[2]);
   if(!off)for(const range of match[2].split(',')){
    const [a,b]=range.trim().split('-').map(t=>t.split(':').map(Number));
    if(a[0]>23||a[1]>59||b[0]>24||b[1]>59||(b[0]===24&&b[1]!==0))return null;
    const start=a[0]*60+a[1],end=b[0]*60+b[1];if(start===end)return null;
    ranges.push([start,end]);
   }
   rules.push({selected,ranges,off});
  }
  const today=now.getDay(),previous=(today+6)%7,minute=now.getHours()*60+now.getMinutes();
  // Later rules override earlier rules for the same starting day.
  const current=rules.filter(r=>r.selected.has(today)).at(-1);
  const yesterday=rules.filter(r=>r.selected.has(previous)).at(-1);
  if(current?.off)return false;
  return Boolean(current?.ranges.some(([a,b])=>b>a?minute>=a&&minute<b:minute>=a)||yesterday?.ranges.some(([a,b])=>b<a&&minute<b));
 }
 function matchesCuisine(tags,selected){
  if(!selected.size)return true;
  const cuisine=String(tags.cuisine||tags['cuisine:en']||'').toLowerCase().replaceAll('_',' ');
  return [...selected].some(c=>cuisine.includes(c)||(c==='pizza'&&cuisine.includes('pizzeria')));
 }
 function applyRoutes(places,table,km){
  const distances=table?.distances?.[0],durations=table?.durations?.[0];
  const valid=table?.code==='Ok'&&Array.isArray(distances)&&distances.length===places.length+1;
  return places.flatMap((place,i)=>{
   if(!valid)return place.driveKm<=km?[place]:[];
   const metres=distances[i+1];
   if(metres===null)return []; // No reachable driving route. Never convert null to zero.
   if(!Number.isFinite(metres)||metres<0)return place.driveKm<=km?[place]:[];
   if(metres/1000>km)return [];
   const seconds=durations?.[i+1];
   return [{...place,driveKm:metres/1000,minutes:Number.isFinite(seconds)&&seconds>=0?seconds/60:null,estimated:false}];
  });
 }
 function safeWebsite(value){
  if(typeof value!=='string')return null;
  const text=value.trim();
  if(!text||/[\u0000-\u0020]/.test(text))return null;
  // Accept explicit web URLs or bare domain names, never other schemes.
  const candidate=/^https?:\/\//i.test(text)?text: /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/?#]|$)/i.test(text)?`https://${text}`:null;
  if(!candidate)return null;
  try{const url=new URL(candidate);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:null}catch{return null}
 }
 function restaurantSearch(place){
  const tags=place.tags||{};
  const address=['addr:housenumber','addr:street','addr:suburb','addr:city','addr:postcode'].map(key=>tags[key]).filter(Boolean).join(' ');
  return `${place.name} ${address||`${place.lat}, ${place.lon}`}`;
 }
 function foodPhotosLink(place){
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${restaurantSearch(place)} food`)}`;
 }
 function menuLink(place){
  const tags=place.tags||{};
  for(const key of ['website:menu','contact:website:menu','menu:website','menu']){
   const href=safeWebsite(tags[key]);if(href)return {href,label:'View menu ↗',note:'Opens the menu linked in this restaurant’s listing in a new tab.'};
  }
  for(const key of ['website','contact:website']){
   const href=safeWebsite(tags[key]);if(href)return {href,label:'Visit restaurant website ↗',note:'No direct menu link is listed. Look for the menu on the restaurant’s website.'};
  }
  return {href:`https://www.google.com/search?q=${encodeURIComponent(`${restaurantSearch(place)} menu`)}`,label:'Search for menu ↗',note:'No menu or website is listed. Search results may include other locations—check the address.'};
 }
 const api={openState,matchesCuisine,applyRoutes,menuLink,foodPhotosLink};
 if(typeof module!=='undefined')module.exports=api;else root.TableTurn=api;
})(globalThis);
