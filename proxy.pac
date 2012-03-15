function FindProxyForURL(url, host) {
      // our local URLs from the domains below example.com don't need a proxy:
      if (shExpMatch(url, "http://localhost:3000/plasma/*"))
      {
         return "PROXY 18.85.58.21";
      } else {
         return "DIRECT";
      }
   }