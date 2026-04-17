/* ================================================================
   HOUSE OF SPEED - AUTH CONFIGURATION (SERVER-SIDE)
   Supabase configuration - KEEP THIS FILE SECURE
   DO NOT expose these values to the client
   ================================================================ */

module.exports = {
  supabase: {
    url: process.env.SUPABASE_URL || 'http://localhost:8000',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
  },

  // Validate configuration on load
  validate() {
    if (process.env.NODE_ENV === 'production') {
      if (!this.supabase.url || !this.supabase.serviceKey) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in production');
      }
    }
  }
};
