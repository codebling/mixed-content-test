# [Mixed Content](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content) test server

This repo contains code for a webserver to show the way Mixed Content is handled differently on local "potentially trusted" domains (like `127.0.0.1` and `localhost`) and on "untrusted" domains. 

It also applies some Content Security Policy (CSP) directives in an attempt to make both trusted and untrusted domains to behave identically. 

For more background, see https://stackoverflow.com/questions/60456809/blocking-mixed-content-from-potentially-trustworthy-origins-127-0-0-0-8/60496950#60496950

## Running

### Using Docker
```
docker build -t mixed-content-test . && docker run --rm -it -p 80:80 -p 443:443 -v /tmp/:/tmp mixed-content-test
```

The shared volume is used to save the Content Security Policy reports. 

### Using Node
```
npm run build && sudo node index.js
```

`sudo` is necessary because the priviledged ports 443 and 80 are used. 

## Content Security Policy Reports

The server sends a header to the browser requesting that it generate reports. You'll find the Content Security Policy report files in `/tmp` with names `csp-report-<number>.json`.


# Summary of findings

I have found no browser settings to treat potentially trusted domains as untrusted, **BUT** here are several options to make 127.0.0.1 and untrusted domains behave the same, or to generate a report of items that would normally generate a warning. 

## XHR

For XHR, adding an entry to your `hosts` file is enough (tested in Firefox 73.0.1 & Chrome 80.0.3987). 

```
# /etc/hosts
127.0.0.1 example.com
```
XHR requests from https://example.com to http://example.com will be blocked by the Mixed Content rules. Note that XHR is still subject CORS and may additionally be blocked by the CORS policy.

This also applies to WebSockets and several [other connection types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/connect-src). 

## `<img>` and other non-XHR

I have found no way to generate only a warning for images or other connection types (you can see a nearly-exhaustive list with examples at [Mixed Content Examples](https://www.mixedcontentexamples.com/)). 

There are two options if you wish 127.0.0.1 to behave as if it were a regular domain:

 * Block Mixed Content entirely (this may even help future-proof your site) using CSP
 * Get the browser to generate a report of elements which would have generated a warning

### Blocking Mixed Content

Add this CSP directive to allow only HTTPS images. 
```
Content-Security-Policy: image-src https:
```

Use `default-src` instead of `image-src` to allow only HTTPS for all other connection types. [List of other connection types and their directives](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/default-src).

### Generating a report

Add this CSP directive to get the browser to POST a JSON report of resources that would have been blocked. 
```
Content-Security-Policy-Report-Only: default-src https:; report-uri /your-endpoint
```

Here's some Express code to do that.

```
let cspCounter = 1;
const CSP_VIOLATION_REPORT_ENDPOINT = '/csp-violation-report-endpoint';
app.use( (req, res, next) => {
  res.set('Content-Security-Policy-Report-Only', `default-src https:; report-uri ${CSP_VIOLATION_REPORT_ENDPOINT}`);
  next();
});
app.post(CSP_VIOLATION_REPORT_ENDPOINT, (req, res) => {
  const reportFile = `/tmp/csp-report-${cspCounter++}.json`;
  req.pipe(fs.createWriteStream(reportFile));
  req.on('end', () => res.send('ok'));  
  fs.readFile(reportFile, (err, data) => debug('csp-report')(err || JSON.parse(data.toString())) );
});
```