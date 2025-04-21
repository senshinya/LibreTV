import { sha256 } from '../js/sha256.js'; // 需新建或引入SHA-256实现

// Cloudflare Pages Middleware to inject environment variables
export async function onRequest(context) {
  const { request, env, next } = context;
  
  // Proceed to the next middleware or route handler
  const response = await next();
  
  // Check if the response is HTML
  const contentType = response.headers.get("content-type") || "";
  
  if (contentType.includes("text/html")) {
    // Get the original HTML content
    let html = await response.text();
    
    // Replace the placeholder with actual environment variable value
    // If PASSWORD is not set, replace with empty string
    const password = env.PASSWORD || "";
    let passwordHash = "";
    if (password) {
      passwordHash = await sha256(password);
    }
    html = html.replace('window.__ENV__.PASSWORD = "{{PASSWORD}}";', 
                        `window.__ENV__.PASSWORD = "${passwordHash}"; // SHA-256 hash`);
    
    // Create a new response with the modified HTML
    return new Response(html, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });
  }
  
  // Return the original response for non-HTML content
  return response;
}