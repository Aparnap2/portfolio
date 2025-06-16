import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="scroll-smooth">
      <Head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* Preload critical resources */}
        <link 
          rel="preload" 
          href="/_next/static/css/app/layout.css" 
          as="style" 
        />
        
        {/* Preload font files */}
        <link
          rel="preload"
          href="/_next/static/media/fira-code-v21-latin-regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/_next/static/media/space-grotesk-v15-latin-regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Preload critical CSS */}
        <style
          dangerouslySetInner={{
            __html: `
              /* Critical CSS will be inlined here */
              html { scroll-behavior: smooth; }
              body { margin: 0; font-family: var(--font-space-grotesk), sans-serif; }
              * { box-sizing: border-box; }
              :focus-visible { outline: 2px solid #8b5cf6; outline-offset: 2px; }
            `,
          }}
        />
      </Head>
      <body className="antialiased bg-gray-900 text-gray-100">
        <Main />
        <NextScript />
        
        {/* Performance monitoring */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <script
              src="https://www.googletagmanager.com/gtag/js?id=YOUR_GA_MEASUREMENT_ID"
              strategy="afterInteractive"
            />
            <script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'YOUR_GA_MEASUREMENT_ID');
              `}
            </script>
          </>
        )}
      </body>
    </Html>
  );
}
