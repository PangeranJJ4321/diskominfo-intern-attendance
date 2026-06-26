const path = require('path')
const fs = require('fs')

// === LOGGER TO FILE ===
const logFile = path.join(__dirname, 'app-debug.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function formatLog(args) {
  return args.map(a => {
    if (a instanceof Error) return a.stack || a.message;
    if (typeof a === 'object') return JSON.stringify(a);
    return String(a);
  }).join(' ') + '\n';
}

const originalConsoleLog = console.log;
console.log = function(...args) {
  logStream.write(`[LOG] ${new Date().toISOString()}: ` + formatLog(args));
  originalConsoleLog.apply(console, args);
};

const originalConsoleError = console.error;
console.error = function(...args) {
  logStream.write(`[ERROR] ${new Date().toISOString()}: ` + formatLog(args));
  originalConsoleError.apply(console, args);
};

const originalConsoleWarn = console.warn;
console.warn = function(...args) {
  logStream.write(`[WARN] ${new Date().toISOString()}: ` + formatLog(args));
  originalConsoleWarn.apply(console, args);
};

process.on('uncaughtException', (err) => {
  fs.appendFileSync(logFile, `[FATAL EXCEPTION] ${new Date().toISOString()}: ${err.stack || err}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  fs.appendFileSync(logFile, `[UNHANDLED REJECTION] ${new Date().toISOString()}: ${reason.stack || reason}\n`);
});

console.log("=========================================");
console.log("=== NEXT.JS STANDALONE SERVER STARTING ===");
console.log("PORT Variable:", process.env.PORT);
console.log("NODE_ENV Variable:", process.env.NODE_ENV);
console.log("=========================================");
// ======================

// === LOAD ENV VARIABLES MANUALLY IN CPANEL ===
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split(/\r?\n/).forEach((line) => {
      if (!line || line.trim().startsWith('#')) return;
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!(key in process.env)) {
          process.env[key] = value.trim();
        }
      }
    });
    console.log('.env file loaded successfully.');
  } else {
    console.warn('.env file not found.');
  }
} catch (err) {
  console.warn('Failed to load .env:', err);
}
// =============================================

const dir = path.join(__dirname)

process.env.NODE_ENV = 'production'
process.chdir(__dirname)

// PENTING: Jangan gunakan parseInt() karena cPanel Passenger 
// sering mengirimkan PORT dalam bentuk string socket/named pipe (contoh: /tmp/passenger.xxx)
// Jika di-parseInt, hasilnya NaN dan akan fallback ke 3000, sehingga webnya error 500.
const currentPort = process.env.PORT || 3000
const hostname = process.env.HOSTNAME || '0.0.0.0'

let keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10)
const nextConfig = {"env":{},"webpack":null,"typescript":{"ignoreBuildErrors":false},"typedRoutes":false,"distDir":"./.next","cleanDistDir":true,"assetPrefix":"","cacheMaxMemorySize":52428800,"configOrigin":"next.config.ts","useFileSystemPublicRoutes":true,"generateEtags":true,"pageExtensions":["tsx","ts","jsx","js"],"poweredByHeader":true,"compress":true,"images":{"deviceSizes":[640,750,828,1080,1200,1920,2048,3840],"imageSizes":[32,48,64,96,128,256,384],"path":"/_next/image","loader":"default","loaderFile":"","domains":[],"disableStaticImages":false,"minimumCacheTTL":14400,"formats":["image/webp"],"maximumRedirects":3,"maximumResponseBody":50000000,"dangerouslyAllowLocalIP":false,"dangerouslyAllowSVG":false,"contentSecurityPolicy":"script-src 'none'; frame-src 'none'; sandbox;","contentDispositionType":"attachment","localPatterns":[{"pathname":"**","search":""}],"remotePatterns":[{"protocol":"https","hostname":"res.cloudinary.com","port":"","pathname":"/**"},{"protocol":"https","hostname":"picsum.photos","port":"","pathname":"/**"}],"qualities":[75],"unoptimized":false,"customCacheHandler":false},"devIndicators":{"position":"bottom-left"},"onDemandEntries":{"maxInactiveAge":60000,"pagesBufferLength":5},"basePath":"","sassOptions":{},"trailingSlash":false,"i18n":null,"productionBrowserSourceMaps":false,"excludeDefaultMomentLocales":true,"reactProductionProfiling":false,"reactStrictMode":null,"reactMaxHeadersLength":6000,"httpAgentOptions":{"keepAlive":true},"logging":{"serverFunctions":true,"browserToTerminal":"warn"},"compiler":{},"expireTime":31536000,"staticPageGenerationTimeout":60,"output":"standalone","modularizeImports":{"@mui/icons-material":{"transform":"@mui/icons-material/{{member}}"},"lodash":{"transform":"lodash/{{member}}"}},"outputFileTracingRoot":"G:\\Pangeran Intern\\no bebas\\diskominfo-intern-attendance","cacheComponents":false,"cacheLife":{"default":{"stale":300,"revalidate":900,"expire":4294967294},"seconds":{"stale":30,"revalidate":1,"expire":60},"minutes":{"stale":300,"revalidate":60,"expire":3600},"hours":{"stale":300,"revalidate":3600,"expire":86400},"days":{"stale":300,"revalidate":86400,"expire":604800},"weeks":{"stale":300,"revalidate":604800,"expire":2592000},"max":{"stale":300,"revalidate":2592000,"expire":31536000}},"cacheHandlers":{},"experimental":{"appNewScrollHandler":false,"useSkewCookie":false,"cssChunking":true,"multiZoneDraftMode":false,"appNavFailHandling":false,"prerenderEarlyExit":true,"serverMinification":true,"linkNoTouchStart":false,"caseSensitiveRoutes":false,"cachedNavigations":false,"partialFallbacks":false,"dynamicOnHover":false,"varyParams":false,"prefetchInlining":false,"preloadEntriesOnStart":true,"clientRouterFilter":true,"clientRouterFilterRedirects":false,"fetchCacheKeyPrefix":"","proxyPrefetch":"flexible","optimisticClientCache":true,"manualClientBasePath":false,"cpus":7,"memoryBasedWorkersCount":false,"imgOptConcurrency":null,"imgOptTimeoutInSeconds":7,"imgOptMaxInputPixels":268402689,"imgOptSequentialRead":null,"imgOptSkipMetadata":null,"isrFlushToDisk":true,"workerThreads":false,"optimizeCss":false,"nextScriptWorkers":false,"scrollRestoration":false,"externalDir":false,"disableOptimizedLoading":false,"gzipSize":true,"craCompat":false,"esmExternals":true,"fullySpecified":false,"swcTraceProfiling":false,"forceSwcTransforms":false,"largePageDataBytes":128000,"typedEnv":false,"parallelServerCompiles":false,"parallelServerBuildTraces":false,"ppr":false,"authInterrupts":false,"webpackMemoryOptimizations":false,"optimizeServerReact":true,"strictRouteTypes":false,"viewTransition":false,"removeUncaughtErrorAndRejectionListeners":false,"validateRSCRequestHeaders":false,"staleTimes":{"dynamic":0,"static":300},"reactDebugChannel":true,"serverComponentsHmrCache":true,"staticGenerationMaxConcurrency":8,"staticGenerationMinPagesPerWorker":25,"transitionIndicator":false,"gestureTransition":false,"inlineCss":false,"useCache":false,"globalNotFound":false,"browserDebugInfoInTerminal":"warn","lockDistDir":true,"proxyClientMaxBodySize":10485760,"hideLogsAfterAbort":false,"mcpServer":true,"turbopackFileSystemCacheForDev":true,"turbopackFileSystemCacheForBuild":false,"turbopackInferModuleSideEffects":true,"turbopackPluginRuntimeStrategy":"childProcesses","optimizePackageImports":["lucide-react","date-fns","lodash-es","ramda","antd","react-bootstrap","ahooks","@ant-design/icons","@headlessui/react","@headlessui-float/react","@heroicons/react/20/solid","@heroicons/react/24/solid","@heroicons/react/24/outline","@visx/visx","@tremor/react","rxjs","@mui/material","@mui/icons-material","recharts","react-use","effect","@effect/schema","@effect/platform","@effect/platform-node","@effect/platform-browser","@effect/platform-bun","@effect/sql","@effect/sql-mssql","@effect/sql-mysql2","@effect/sql-pg","@effect/sql-sqlite-node","@effect/sql-sqlite-bun","@effect/sql-sqlite-wasm","@effect/sql-sqlite-react-native","@effect/rpc","@effect/rpc-http","@effect/typeclass","@effect/experimental","@effect/opentelemetry","@material-ui/core","@material-ui/icons","@tabler/icons-react","mui-core","react-icons/ai","react-icons/bi","react-icons/bs","react-icons/cg","react-icons/ci","react-icons/di","react-icons/fa","react-icons/fa6","react-icons/fc","react-icons/fi","react-icons/gi","react-icons/go","react-icons/gr","react-icons/hi","react-icons/hi2","react-icons/im","react-icons/io","react-icons/io5","react-icons/lia","react-icons/lib","react-icons/lu","react-icons/md","react-icons/pi","react-icons/ri","react-icons/rx","react-icons/si","react-icons/sl","react-icons/tb","react-icons/tfi","react-icons/ti","react-icons/vsc","react-icons/wi"],"trustHostHeader":false,"isExperimentalCompile":false},"htmlLimitedBots":"[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight","bundlePagesRouterDependencies":false,"configFileName":"next.config.ts","turbopack":{"root":"G:\\Pangeran Intern\\no bebas\\diskominfo-intern-attendance"},"distDirRoot":".next"}

process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig)

// Inisialisasi Next.js dengan custom server untuk menjamin file statis terbaca oleh Passenger cPanel
const next = require('next');
const http = require('http');
const { parse } = require('url');

const app = next({
  dev: false,
  dir: dir,
  conf: nextConfig,
  customServer: false,
  hostname: hostname,
  port: currentPort,
});

const handle = app.getRequestHandler();

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

app.prepare().then(() => {
  http.createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      // EXPLICIT STATIC FILE SERVING FOR PUBLIC FOLDER
      if (pathname !== '/') {
        const publicPath = path.join(__dirname, 'public', pathname);
        if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
          const ext = path.extname(publicPath).toLowerCase();
          res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
          res.statusCode = 200;
          fs.createReadStream(publicPath).pipe(res);
          return;
        }
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  }).listen(currentPort, (err) => {
    if (err) {
      console.error('Error starting Next.js server:', err);
      process.exit(1);
    }
    console.log(`> Ready on http://${hostname}:${currentPort}`);
  });
}).catch((err) => {
  console.error('Error preparing Next.js app:', err);
  process.exit(1);
});
