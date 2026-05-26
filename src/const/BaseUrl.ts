// const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

// const getDefaultApiBaseUrl = () => {
//   const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
//   const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
//   const apiPort = "7117";

//   return trimTrailingSlash(`${protocol}//${host}:${apiPort}`);
// };

// export const baseUrl = getDefaultApiBaseUrl();
  export const baseUrl = "http://localhost:7117";  // localserver 
 // export const baseUrl = "https://localhost:7117";  // localserver with https
 //export const baseUrl = "http://10.60.2.141:7117"; //test server http
//export const baseUrl = "http://10.60.2.29:7117"; // prod server http