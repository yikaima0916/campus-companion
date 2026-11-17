// The original Campus Companion address now forwards to the handover deployment.
// The original D1 database is kept, unbound, as a backup.
const target = 'https://campus-companion.campus-companion-ln.workers.dev';
export default {
  fetch(request) {
    const url = new URL(request.url);
    return Response.redirect(target + url.pathname + url.search, 301);
  },
};
