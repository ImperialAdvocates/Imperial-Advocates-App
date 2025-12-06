import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* PWA manifest */}
          <link rel="manifest" href="/manifest.json" />

          {/* App icons */}
          <link rel="icon" href="/icons/icon-192.png" />
          <link rel="apple-touch-icon" href="/icons/icon-192.png" />

          {/* Theme colours */}
          <meta name="theme-color" content="#202b8a" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="black-translucent"
          />
          <meta
            name="apple-mobile-web-app-title"
            content="Imperial Training"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
