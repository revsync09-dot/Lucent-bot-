const { createClient } = require("@supabase/supabase-js");
const { getConfig } = require("../config/config");

const config = getConfig();

const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

module.exports = { supabase };
