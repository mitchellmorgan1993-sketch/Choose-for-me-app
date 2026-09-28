Table Turn — restaurant picker

Run
Keep index.html, styles.css, core.js and app.js together. Open index.html in a modern browser, or serve this directory with:
  python3 -m http.server 8765 --bind 127.0.0.1
Then visit http://127.0.0.1:8765. Use HTTPS when hosting for a phone.

Changes
- Find food photos opens an image search using the selected restaurant and address (coordinates if no address is listed). Results are not verified; this is not an in-app photo gallery.
- Selected restaurants show a direct menu link when available, otherwise their listed website or an address-based menu search. Links open in a new tab. Menu availability and accuracy depend on OpenStreetMap listing data; menus are not scraped or embedded.
- Optional Exclude fast food toggle removes listings tagged amenity=fast_food in OpenStreetMap. Off by default; accuracy depends on listing classification.
- Multiple cuisine filters, with Surprise me clearing the selection.
- Open now evaluates common weekly hours, split shifts and overnight periods. Missing or unsupported schedules are excluded. It uses the device's time zone, which must match the restaurant's local time. Holiday/date/solar-time rules require a full opening-hours provider; confirm hours with the venue.
- Searches the full selected radius and routes candidates in batches instead of limiting the pool to 60.
- Preserves explicitly marked distance/time estimates when routing fails; unreachable routes are excluded. Estimates use straight-line distance multiplied by 1.35 and assumed speed of 35 km/h, so actual journeys may exceed the selected range.
- Generic dish ideas are clearly distinguished from verified menu items.
- Adds directions, selected-button accessibility states, live status messages, keyboard focus styling and reduced-motion support.
- Separates styles and JavaScript for maintenance.

Data and limitations
Restaurant listings come from public OpenStreetMap Overpass services. Driving routes use the public OSRM service. Searches send the selected location to these services. Coverage, current opening hours, service availability and routing accuracy are not guaranteed. This is a web prototype, not a native iOS package.

Verification
Run with Node.js:
  node --test core.test.cjs app.test.cjs
Automated tests cover schedules, filters, route failures, unreachable destinations, full-radius batched search and wheel completion using fixtures. Browser checks verified multi-selection and the missing-location prompt. Live geolocation and external API availability were not tested.

GitHub Pages / iPhone
Publish the repository main branch, root folder, using Settings > Pages > Deploy from a branch. All app asset paths are relative, so repository-based Pages URLs work. The hosted site is public.
On iPhone, open the HTTPS Pages address in Safari, choose Share > Add to Home Screen, enable Open as Web App if offered, and tap Add. Grant location access when using Detect.
The manifest and PNG icons support standalone Home Screen launch. Internet is required for restaurant searches, maps, menus and photos.
