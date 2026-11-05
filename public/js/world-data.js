// Land mask for the World face: 120×47 cells at 3° steps (lat 84°N → 57°S),
// derived from Natural Earth 1:50m land (public domain) via world-atlas.
const WORLD_MAP = { step: 3, cols: 120, top: 84, rows: ["00000003fc7ff90000000000000000","0000000ffffffc00c000001a000000","000007e5c3fffc004000803fc07000","00003eb2807ff800000211fffe1000","03f9d7cbf87ff0001c00bfffffffa6","e7ffffff9e3fc0007fdfffffffffff","27ffffff8e1e0601efffffffffffff","07fffff8340c0003dffffffffffffe","0383fff83e000023cffffffffff860","0000ffff3f800021dfffffffffc0c0","00007fffff8000dbffffffffffe080","00003fffff40003ffffffffffff000","00003ffffe00001fffffffffffc000","00003ffff800007ffc77ffffff9000","00003ffff00000787ffbfffffe0000","00001fffe000007617fffffffa2000","00000fffc000003f00fffffff2e000","000007ff8000007ffffffffff90000","000007f0800000fffff7fffff80000","000002f0800001fffff9fffff00000","00000070400003ffff7f1fffe00000","00000076080003fffffe0f9f800000","0000001f000003ffffbc0e1f080000","00000003000003fffff0060f800000","000000011e0001fffff80601000000","000000003f0000fffff80204040000","000000003fe00073fff0000e300000","000000003fe00001ffe00006fa0000","000000007ff80001ffc00006e88000","000000007fff0000ff800003007000","000000007fff8000ff800000003c00","000000003fff0000ffc00000000400","000000003ffe0000ffc8000001d000","000000001ffe0000ff98000007f800","000000000ffe0000ff3800000ff800","000000000ffc00007f3000003ffc00","000000000ff000007e0000003ffe00","000000000ff000007e0000003ffe00","000000000fe000003c0000003ffe00","000000000fc0000038000000183c00","000000001f80000000000000001c02","000000001e00000000000000000002","000000001e0000000000000000000c","000000001c00000000000000000008","000000001800000000000000000000","000000001800000000000000000000","000000000c00000000000000000000"] };

// Fallback coordinates when network geolocation is unavailable (offline, local dev).
const ZONE_COORDS = {
  "America/New_York":[40.71,-74.01],"America/Chicago":[41.88,-87.63],"America/Denver":[39.74,-104.99],"America/Los_Angeles":[34.05,-118.24],
  "America/Phoenix":[33.45,-112.07],"America/Anchorage":[61.22,-149.9],"Pacific/Honolulu":[21.31,-157.86],"America/Toronto":[43.65,-79.38],
  "America/Vancouver":[49.28,-123.12],"America/Mexico_City":[19.43,-99.13],"America/Sao_Paulo":[-23.55,-46.63],"America/Argentina/Buenos_Aires":[-34.6,-58.38],
  "America/Bogota":[4.71,-74.07],"America/Lima":[-12.05,-77.04],"America/Santiago":[-33.45,-70.67],"Europe/London":[51.51,-0.13],
  "Europe/Dublin":[53.35,-6.26],"Europe/Lisbon":[38.72,-9.14],"Europe/Paris":[48.86,2.35],"Europe/Berlin":[52.52,13.4],
  "Europe/Madrid":[40.42,-3.7],"Europe/Rome":[41.9,12.5],"Europe/Amsterdam":[52.37,4.9],"Europe/Stockholm":[59.33,18.07],
  "Europe/Warsaw":[52.23,21.01],"Europe/Athens":[37.98,23.73],"Europe/Istanbul":[41.01,28.98],"Europe/Moscow":[55.76,37.62],
  "Africa/Cairo":[30.04,31.24],"Africa/Lagos":[6.52,3.38],"Africa/Nairobi":[-1.29,36.82],"Africa/Johannesburg":[-26.2,28.05],
  "Asia/Dubai":[25.2,55.27],"Asia/Karachi":[24.86,67.01],"Asia/Kolkata":[28.61,77.21],"Asia/Calcutta":[28.61,77.21],
  "Asia/Dhaka":[23.81,90.41],"Asia/Bangkok":[13.76,100.5],"Asia/Jakarta":[-6.21,106.85],"Asia/Singapore":[1.35,103.82],
  "Asia/Hong_Kong":[22.32,114.17],"Asia/Shanghai":[31.23,121.47],"Asia/Taipei":[25.03,121.57],"Asia/Seoul":[37.57,126.98],
  "Asia/Tokyo":[35.68,139.69],"Asia/Manila":[14.6,120.98],"Australia/Perth":[-31.95,115.86],"Australia/Sydney":[-33.87,151.21],
  "Australia/Melbourne":[-37.81,144.96],"Australia/Brisbane":[-27.47,153.03],"Pacific/Auckland":[-36.85,174.76]
};

// Reference cities shown beside your location; the first three outside your zone are used.
const REFERENCE_CITIES = [
  { code: "NYC", name: "New York", tz: "America/New_York" },
  { code: "LON", name: "London", tz: "Europe/London" },
  { code: "TYO", name: "Tokyo", tz: "Asia/Tokyo" },
  { code: "SFO", name: "San Francisco", tz: "America/Los_Angeles" },
  { code: "DXB", name: "Dubai", tz: "Asia/Dubai" },
  { code: "SYD", name: "Sydney", tz: "Australia/Sydney" }
];
