
// const getDefaultApiBaseUrl = () => {
//   const host = window.location.hostname;

//   console.log("Detected hostname:", host);

//   let url = "";

//   switch (host) {
//     case "design.siennaecad.com":
//       // url = "http://10.60.2.29:7117";  //prod api service
//       url = "https://design.siennaecad.com";
//       break;

//     case "10.60.2.29":
//       url = "https://10.60.2.29:7117";
//       break;

//     case "10.60.2.141":
//       url = "https://10.60.2.141:7117";
//       break;

//     default:
//       url = "http://localhost:7117";
//       break;
//   }
//  // url="http://125.17.124.142:7117"
//   console.log("API Base URL", url)
//   return url;
// };

// export const baseUrl = getDefaultApiBaseUrl();

// this code is generalised to take host name and form url
// // Build the API base URL from the current browser host.
// // The backend in this repo is exposed on port 7117, so we must include it explicitly.
const getDefaultApiBaseUrl = () => {
  const host = window.location.hostname;
  let url = "";
  console.log("Detected hostname:", host);

  if (host === "localhost" || host === "127.0.0.1") {
    url = "http://localhost:7117";    //local port 7117
    console.log("API Base localhost URL", url)
    return url;
  }
  url = `https://${host}`;
  console.log("API Base URL", url)
  return url;

};

export const baseUrl = getDefaultApiBaseUrl();